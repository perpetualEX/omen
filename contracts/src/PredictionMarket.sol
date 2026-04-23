// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @notice Binary YES/NO prediction market using a constant-product market maker (CPMM)
 *         for pricing. Architecturally interchangeable with LMSR, but much simpler gas
 *         profile and easier to audit in a hackathon window.
 *
 * Lifecycle:
 *   CREATED (at construction) -> OPEN (funded + betting) -> RESOLVED -> CLAIMABLE
 *
 * Resolution authority:
 *   Only the factory (acting on behalf of the AI agent) can call `resolve()`.
 *   In production this would be replaced with an on-chain oracle + dispute window.
 */
contract PredictionMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Outcome {
        UNRESOLVED,
        YES,
        NO,
        INVALID
    }

    // --- Immutable config ---
    address public immutable factory;
    address public immutable treasury;
    IERC20 public immutable collateral;
    string public question;
    uint256 public immutable createdAt;
    uint256 public immutable resolutionTime;
    uint16 public constant BET_FEE_BPS = 200; // 2% on every bet
    uint16 public constant RESOLUTION_FEE_BPS = 500; // 5% of total pool at resolution

    // --- State ---
    // CPMM reserves. k = yesReserve * noReserve, held constant during trades.
    // Initialized by the factory with equal seed -> 50/50 odds.
    uint256 public yesReserve;
    uint256 public noReserve;

    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    uint256 public totalYesShares;
    uint256 public totalNoShares;

    Outcome public outcome;
    uint256 public totalCollateral; // excludes fees

    // --- Events ---
    event Bet(
        address indexed user,
        bool isYes,
        uint256 collateralIn,
        uint256 sharesOut,
        uint256 feePaid,
        uint256 newYesReserve,
        uint256 newNoReserve
    );
    event Resolved(Outcome outcome, uint256 resolutionFee);
    event Claimed(address indexed user, uint256 payout);

    // --- Errors ---
    error NotFactory();
    error MarketClosed();
    error PastResolution();
    error BeforeResolution();
    error ZeroAmount();
    error SlippageExceeded();
    error AlreadyResolved();
    error BadOutcome();
    error NotResolved();
    error NothingToClaim();

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
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
        if (_resolutionTime <= block.timestamp) revert PastResolution();
        factory = _factory;
        treasury = _treasury;
        collateral = _collateral;
        question = _question;
        resolutionTime = _resolutionTime;
        createdAt = block.timestamp;
        yesReserve = _seed;
        noReserve = _seed;
    }

    // --- Price views (bps, 0-10000) ---

    function priceYes() public view returns (uint256) {
        return (noReserve * 10_000) / (yesReserve + noReserve);
    }

    function priceNo() public view returns (uint256) {
        return 10_000 - priceYes();
    }

    // --- Bet ---

    /// @notice Quote how many shares you'd get for a given collateral amount, pre-fee.
    function quoteShares(uint256 netIn, bool isYes) public view returns (uint256) {
        uint256 k = yesReserve * noReserve;
        if (isYes) {
            uint256 newNo = noReserve + netIn;
            uint256 newYes = k / newNo;
            return yesReserve - newYes;
        } else {
            uint256 newYes = yesReserve + netIn;
            uint256 newNo = k / newYes;
            return noReserve - newNo;
        }
    }

    function bet(bool isYes, uint256 amount, uint256 minSharesOut)
        external
        nonReentrant
        returns (uint256 shares)
    {
        if (outcome != Outcome.UNRESOLVED) revert MarketClosed();
        if (block.timestamp >= resolutionTime) revert PastResolution();
        if (amount == 0) revert ZeroAmount();

        uint256 fee = (amount * BET_FEE_BPS) / 10_000;
        uint256 netIn = amount - fee;

        collateral.safeTransferFrom(msg.sender, address(this), netIn);
        collateral.safeTransferFrom(msg.sender, treasury, fee);

        shares = quoteShares(netIn, isYes);
        if (shares < minSharesOut) revert SlippageExceeded();

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
        emit Bet(msg.sender, isYes, amount, shares, fee, yesReserve, noReserve);
    }

    // --- Resolution ---

    function resolve(Outcome _outcome) external onlyFactory {
        if (outcome != Outcome.UNRESOLVED) revert AlreadyResolved();
        if (block.timestamp < resolutionTime) revert BeforeResolution();
        if (_outcome == Outcome.UNRESOLVED) revert BadOutcome();

        outcome = _outcome;

        uint256 resolutionFee = (totalCollateral * RESOLUTION_FEE_BPS) / 10_000;
        if (resolutionFee > 0) {
            collateral.safeTransfer(treasury, resolutionFee);
            totalCollateral -= resolutionFee;
        }

        emit Resolved(_outcome, resolutionFee);
    }

    // --- Claim ---

    function claim() external nonReentrant returns (uint256 payout) {
        if (outcome == Outcome.UNRESOLVED) revert NotResolved();

        if (outcome == Outcome.INVALID) {
            // Refund proportionally to all shares held
            uint256 userShares = yesShares[msg.sender] + noShares[msg.sender];
            uint256 totalShares = totalYesShares + totalNoShares;
            if (userShares == 0 || totalShares == 0) revert NothingToClaim();

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

            if (winningShares == 0 || totalWinning == 0) revert NothingToClaim();
            payout = (winningShares * totalCollateral) / totalWinning;
        }

        collateral.safeTransfer(msg.sender, payout);
        emit Claimed(msg.sender, payout);
    }
}
