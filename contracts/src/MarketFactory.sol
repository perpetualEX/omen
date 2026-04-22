// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PredictionMarket.sol";

/**
 * @title MarketFactory
 * @notice Only the registered AI agent address can spawn markets or resolve them.
 *         The agent is expected to seed each market with an equal YES/NO reserve
 *         so both sides start at 50% implied probability.
 */
contract MarketFactory {
    address public owner;        // multisig in prod; EOA for hackathon
    address public agent;        // the AI agent's signing address
    address public treasury;
    IERC20  public collateral;

    address[] public markets;
    mapping(address => bool) public isMarket;

    event MarketCreated(address indexed market, string question, uint256 resolutionTime, uint256 seed);
    event MarketResolved(address indexed market, PredictionMarket.Outcome outcome);
    event AgentChanged(address indexed newAgent);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier onlyAgent() { require(msg.sender == agent, "not agent"); _; }

    constructor(address _agent, address _treasury, IERC20 _collateral) {
        owner = msg.sender;
        agent = _agent;
        treasury = _treasury;
        collateral = _collateral;
    }

    function setAgent(address newAgent) external onlyOwner {
        agent = newAgent;
        emit AgentChanged(newAgent);
    }

    function createMarket(
        string calldata question,
        uint256 resolutionTime,
        uint256 seed
    ) external onlyAgent returns (address marketAddr) {
        PredictionMarket m = new PredictionMarket(
            address(this),
            treasury,
            collateral,
            question,
            resolutionTime,
            seed
        );
        marketAddr = address(m);
        markets.push(marketAddr);
        isMarket[marketAddr] = true;

        // Seed the market's reserves by transferring collateral in.
        // Factory must be pre-funded or agent must have approved the factory.
        require(collateral.transferFrom(msg.sender, marketAddr, seed * 2), "seed xferFrom");

        emit MarketCreated(marketAddr, question, resolutionTime, seed);
    }

    function resolveMarket(address market, PredictionMarket.Outcome outcome) external onlyAgent {
        require(isMarket[market], "unknown market");
        PredictionMarket(market).resolve(outcome);
        emit MarketResolved(market, outcome);
    }

    function marketCount() external view returns (uint256) { return markets.length; }
}
