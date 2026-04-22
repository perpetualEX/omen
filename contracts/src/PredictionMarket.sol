// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PredictionMarket
 * @notice Binary YES/NO prediction market with constant-product pricing (simplified LMSR).
 *         For hackathon scope we use a CPMM — architecturally interchangeable with full LMSR,
 *         much less gas, and easier to reason about.
 *
 * Lifecycle:
 *   CREATED -> OPEN (funded) -> RESOLVED -> CLAIMABLE
 *
 * Resolution: only the factory (acting on behalf of the AI agent) can resolve.
 *             In production this would be replaced with an on-chain oracle / dispute game.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PredictionMarket {
    enum Outcome { UNRESOLVED, YES, NO, INVALID }

    // --- Config ---
    address public immutable factory;
    address public immutable treasury;
    IERC20  public immutable collateral;       // e.g. USDC on rollup
    string  public question;
    uint256 public immutable createdAt;
    uint256 public immutable resolutionTime;   // when agent is allowed to resolve
    uint16  public constant  BET_FEE_BPS = 200;      // 2%
    uint16  public constant  RESOLUTION_FEE_BPS = 500; // 5% of total pool

    // --- State ---
    // CPMM reserves. Initialized by factory with equal seed -> 50/50 odds.
    uint256 public yesReserve;
    uint256 public noReserve;

    // Outstanding shares per user
    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    uint256 public totalYesShares;
    uint256 public totalNoShares;

    Outcome public outcome;
    uint256 public totalCollateral; // excludes fees

    // --- Events ---
    event Bet(address indexed user, bool isYes, uint256 collateralIn, uint256 sharesOut, uint256 newYesReserve, uint256 newNoReserve);
    event Resolved(Outcome outcome, uint256 resolutionFee);
    event Claimed(address indexed user, uint256 payout);

    modifier onlyFactory() {
        require(msg.sender == factory, "not factory");
        _;
    }

    constructor(
        address _factory,
        address _treasury,
        IERC20 _collateral,
        string memory _question,
        uint256 _resolutionTime,
        uint256 _seed
    ) {
        require(_resolutionTime > block.timestamp, "resolution in past");
        factory = _factory;
        treasury = _treasury;
        collateral = _collateral;
        question = _question;
        resolutionTime = _resolutionTime;
        createdAt = block.timestamp;
        yesReserve = _seed;
        noReserve = _seed;
    }

    // --- Betting ---

    function priceYes() public view returns (uint256 bps) {
        // Naive spot price in bps (0-10000). Real LMSR would use log-based cost fn.
        return (noReserve * 10000) / (yesReserve + noReserve);
    }

    function priceNo() public view returns (uint256 bps) {
        return 10000 - priceYes();
    }

    function _quoteShares(uint256 amountIn, bool isYes) internal view returns (uint256) {
        // CPMM: k = yesReserve * noReserve
        // When user deposits X of collateral betting YES, they're effectively removing NO reserve.
        // sharesOut = yesReserve - k / (noReserve + X)
        // We treat collateral 1:1 as if it adds to the opposite side.
        uint256 k = yesReserve * noReserve;
        if (isYes) {
            uint256 newNo = noReserve + amountIn;
            uint256 newYes = k / newNo;
            return yesReserve - newYes;
        } else {
            uint256 newYes = yesReserve + amountIn;
            uint256 newNo = k / newYes;
            return noReserve - newNo;
        }
    }

    function bet(bool isYes, uint256 amount, uint256 minSharesOut) external returns (uint256 shares) {
        require(outcome == Outcome.UNRESOLVED, "market closed");
        require(block.timestamp < resolutionTime, "past resolution");
        require(amount > 0, "zero");

        uint256 fee = (amount * BET_FEE_BPS) / 10000;
        uint256 netIn = amount - fee;

        require(collateral.transferFrom(msg.sender, address(this), netIn), "xferFrom net");
        require(collateral.transferFrom(msg.sender, treasury, fee), "xferFrom fee");

        shares = _quoteShares(netIn, isYes);
        require(shares >= minSharesOut, "slippage");

        if (isYes) {
            noReserve += netIn;
            yesReserve -= shares;
            yesShares[msg.sender] += shares;
            totalYesShares += shares;
        } else {
            yesReserve += netIn;
            noReserve -= shares;
            noShares[msg.sender] += shares;
            totalNoShares += shares;
        }

        totalCollateral += netIn;
        emit Bet(msg.sender, isYes, amount, shares, yesReserve, noReserve);
    }

    // --- Resolution ---

    function resolve(Outcome _outcome) external onlyFactory {
        require(outcome == Outcome.UNRESOLVED, "already resolved");
        require(block.timestamp >= resolutionTime, "too early");
        require(_outcome == Outcome.YES || _outcome == Outcome.NO || _outcome == Outcome.INVALID, "bad outcome");

        outcome = _outcome;

        uint256 resolutionFee = (totalCollateral * RESOLUTION_FEE_BPS) / 10000;
        if (resolutionFee > 0) {
            require(collateral.transfer(treasury, resolutionFee), "xfer fee");
            totalCollateral -= resolutionFee;
        }

        emit Resolved(_outcome, resolutionFee);
    }

    // --- Claim ---

    function claim() external returns (uint256 payout) {
        require(outcome != Outcome.UNRESOLVED, "not resolved");

        if (outcome == Outcome.INVALID) {
            // Refund proportionally to total shares held
            uint256 userShares = yesShares[msg.sender] + noShares[msg.sender];
            uint256 totalShares = totalYesShares + totalNoShares;
            require(userShares > 0 && totalShares > 0, "nothing");
            payout = (userShares * totalCollateral) / totalShares;
            yesShares[msg.sender] = 0;
            noShares[msg.sender] = 0;
        } else {
            uint256 winningShares;
            uint256 totalWinning;
            if (outcome == Outcome.YES) {
                winningShares = yesShares[msg.sender];
                totalWinning = totalYesShares;
                yesShares[msg.sender] = 0;
            } else {
                winningShares = noShares[msg.sender];
                totalWinning = totalNoShares;
                noShares[msg.sender] = 0;
            }
            require(winningShares > 0 && totalWinning > 0, "not a winner");
            payout = (winningShares * totalCollateral) / totalWinning;
        }

        require(collateral.transfer(msg.sender, payout), "xfer claim");
        emit Claimed(msg.sender, payout);
    }
}
