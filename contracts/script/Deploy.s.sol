// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Treasury} from "../src/Treasury.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Deploys the full Omen system to omen-1 (or any EVM network).
 *         Required env vars:
 *           - DEPLOYER_PRIVATE_KEY
 *           - AGENT_ADDRESS
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agent = vm.envAddress("AGENT_ADDRESS");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer:", deployer);
        console.log("Agent:   ", agent);

        vm.startBroadcast(deployerKey);

        MockUSDC usdc = new MockUSDC(deployer);
        console.log("MockUSDC:     ", address(usdc));

        Treasury treasury = new Treasury(IERC20(address(usdc)), deployer);
        console.log("Treasury:     ", address(treasury));

        MarketFactory factory = new MarketFactory(
            agent,
            address(treasury),
            IERC20(address(usdc)),
            deployer
        );
        console.log("MarketFactory:", address(factory));

        // Seed the agent with 10k USDC so it can spawn markets immediately.
        usdc.mint(agent, 10_000 * 1e6);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Copy into .env ===");
        console.log("COLLATERAL_TOKEN_ADDRESS=", address(usdc));
        console.log("TREASURY_ADDRESS=", address(treasury));
        console.log("MARKET_FACTORY_ADDRESS=", address(factory));
    }
}
