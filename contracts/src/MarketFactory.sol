// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PredictionMarket} from "./PredictionMarket.sol";

/**
 * @title MarketFactory
 * @notice Single source of truth for spawning and resolving Omen markets.
 *         Only the registered AI agent address can create or resolve markets.
 */
contract MarketFactory is Ownable {
    using SafeERC20 for IERC20;

    address public agent;
    address public immutable treasury;
    IERC20 public immutable collateral;

    address[] public markets;
    mapping(address => bool) public isMarket;
    mapping(address => uint256) public marketIndex;

    event MarketCreated(
        address indexed market,
        uint256 indexed index,
        string question,
        uint256 resolutionTime,
        uint256 seed
    );
    event MarketResolved(address indexed market, PredictionMarket.Outcome outcome);
    event AgentChanged(address indexed oldAgent, address indexed newAgent);

    error NotAgent();
    error UnknownMarket();

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    constructor(
        address _agent,
        address _treasury,
        IERC20 _collateral,
        address initialOwner
    ) Ownable(initialOwner) {
        agent = _agent;
        treasury = _treasury;
        collateral = _collateral;
    }

    function setAgent(address newAgent) external onlyOwner {
        emit AgentChanged(agent, newAgent);
        agent = newAgent;
    }

    /**
     * @notice Spawn a new binary market. Only callable by the agent.
     * @dev The agent must have approved this factory for `seed * 2` collateral,
     *      which is forwarded to the new market to seed its reserves.
     */
    function createMarket(string calldata question, uint256 resolutionTime, uint256 seed)
        external
        onlyAgent
        returns (address marketAddr)
    {
        PredictionMarket m = new PredictionMarket(
            address(this),
            treasury,
            collateral,
            question,
            resolutionTime,
            seed
        );
        marketAddr = address(m);
        uint256 idx = markets.length;
        markets.push(marketAddr);
        isMarket[marketAddr] = true;
        marketIndex[marketAddr] = idx;

        // Seed both sides of the CPMM reserves. Agent must have approved us.
        collateral.safeTransferFrom(msg.sender, marketAddr, seed * 2);

        emit MarketCreated(marketAddr, idx, question, resolutionTime, seed);
    }

    function resolveMarket(address market, PredictionMarket.Outcome outcome) external onlyAgent {
        if (!isMarket[market]) revert UnknownMarket();
        PredictionMarket(market).resolve(outcome);
        emit MarketResolved(market, outcome);
    }

    function marketCount() external view returns (uint256) {
        return markets.length;
    }

    /// @notice Returns up to `count` markets starting at `offset`. For paginated frontend feeds.
    function getMarkets(uint256 offset, uint256 count) external view returns (address[] memory page) {
        uint256 total = markets.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + count;
        if (end > total) end = total;
        uint256 len = end - offset;
        page = new address[](len);
        for (uint256 i = 0; i < len; i++) {
            page[i] = markets[offset + i];
        }
    }
}
