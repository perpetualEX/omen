// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice A mintable ERC20 used as collateral for Omen prediction markets on our rollup.
 * @dev On mainnet this would be real USDC bridged via Interwoven Bridge. For testnet we
 *      mint freely to whoever needs it (anyone can self-fund via the public `faucet`).
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6; // match real USDC
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10 ** _DECIMALS; // 1,000 USDC per faucet call
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetAt;

    error FaucetCooldownActive(uint256 secondsRemaining);

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor(address initialOwner) ERC20("Omen USD", "oUSDC") Ownable(initialOwner) {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// @notice Owner can mint freely (for seeding markets).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Anyone can self-claim once an hour — keeps the demo frictionless.
    function faucet() external {
        uint256 last = lastFaucetAt[msg.sender];
        if (last != 0 && last + FAUCET_COOLDOWN > block.timestamp) {
            revert FaucetCooldownActive(last + FAUCET_COOLDOWN - block.timestamp);
        }
        lastFaucetAt[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }
}