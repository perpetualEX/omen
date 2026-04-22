// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Treasury.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarket.sol";

contract Deploy is Script {
    function run() external {
        address agent = vm.envAddress("AGENT_ADDRESS");
        address collateralToken = vm.envAddress("COLLATERAL_TOKEN"); // USDC on rollup

        vm.startBroadcast();

        Treasury treasury = new Treasury(IERC20(collateralToken));
        MarketFactory factory = new MarketFactory(
            agent,
            address(treasury),
            IERC20(collateralToken)
        );

        vm.stopBroadcast();

        console.log("Treasury:", address(treasury));
        console.log("MarketFactory:", address(factory));
        console.log("Agent:", agent);
        console.log("Collateral:", collateralToken);
    }
}
