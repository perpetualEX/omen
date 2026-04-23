// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Treasury
 * @notice Collects protocol fees (bet fee + resolution fee) from every Omen market.
 * @dev In production this would be replaced with a governance-controlled multisig or
 *      a staking contract that streams revenue to token holders. For hackathon scope,
 *      the owner can withdraw freely.
 */
contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateral;

    event Withdrawn(address indexed to, uint256 amount);
    event FeesReceived(address indexed from, uint256 amount);

    constructor(IERC20 _collateral, address initialOwner) Ownable(initialOwner) {
        collateral = _collateral;
    }

    /// @notice Called by markets to deposit fees. We log so the frontend can show TVL.
    function reportFee(uint256 amount) external {
        emit FeesReceived(msg.sender, amount);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        collateral.safeTransfer(to, amount);
        emit Withdrawn(to, amount);
    }

    function balance() external view returns (uint256) {
        return collateral.balanceOf(address(this));
    }
}
