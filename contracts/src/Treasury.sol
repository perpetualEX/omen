// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PredictionMarket.sol";

/**
 * @title Treasury
 * @notice Collects protocol fees from all markets. Owner can withdraw.
 *         In production this would be a DAO-controlled multisig with streaming
 *         payouts to token holders. For hackathon scope, it's an EOA.
 */
contract Treasury {
    address public owner;
    IERC20  public collateral;

    event Withdrawn(address indexed to, uint256 amount);
    event OwnerChanged(address indexed newOwner);

    constructor(IERC20 _collateral) {
        owner = msg.sender;
        collateral = _collateral;
    }

    function setOwner(address newOwner) external {
        require(msg.sender == owner, "not owner");
        owner = newOwner;
        emit OwnerChanged(newOwner);
    }

    function withdraw(address to, uint256 amount) external {
        require(msg.sender == owner, "not owner");
        require(collateral.transfer(to, amount), "xfer");
        emit Withdrawn(to, amount);
    }

    function balance() external view returns (uint256) {
        return collateral.balanceOf(address(this));
    }
}
