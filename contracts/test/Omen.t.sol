// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Treasury} from "../src/Treasury.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OmenTest is Test {
    MockUSDC usdc;
    Treasury treasury;
    MarketFactory factory;

    address owner = address(0xA11CE);
    address agent = address(0xAE61);
    address alice = address(0xBEE1);
    address bob = address(0xB0B);

    uint256 constant SEED = 10_000 * 1e6; // 10k USDC per side
    uint256 constant BET_AMOUNT = 100 * 1e6; // 100 USDC

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC(owner);
        treasury = new Treasury(IERC20(address(usdc)), owner);
        factory = new MarketFactory(agent, address(treasury), IERC20(address(usdc)), owner);

        // Fund accounts
        usdc.mint(agent, 1_000_000 * 1e6);
        usdc.mint(alice, 10_000 * 1e6);
        usdc.mint(bob, 10_000 * 1e6);
        vm.stopPrank();
    }

    function _createMarket() internal returns (PredictionMarket) {
        vm.startPrank(agent);
        usdc.approve(address(factory), type(uint256).max);
        address m = factory.createMarket("Will ETH > $5k by EOY?", block.timestamp + 1 days, SEED);
        vm.stopPrank();
        return PredictionMarket(m);
    }

    function test_CreateMarket() public {
        PredictionMarket m = _createMarket();
        assertEq(m.yesReserve(), SEED);
        assertEq(m.noReserve(), SEED);
        assertEq(m.priceYes(), 5_000); // 50% in bps
        assertEq(factory.marketCount(), 1);
    }

    function test_OnlyAgentCanCreate() public {
        vm.startPrank(alice);
        usdc.approve(address(factory), type(uint256).max);
        vm.expectRevert(MarketFactory.NotAgent.selector);
        factory.createMarket("foo", block.timestamp + 1 hours, SEED);
        vm.stopPrank();
    }

    function test_BetYes() public {
        PredictionMarket m = _createMarket();

        vm.startPrank(alice);
        usdc.approve(address(m), type(uint256).max);
        uint256 shares = m.bet(true, BET_AMOUNT, 0);
        vm.stopPrank();

        assertGt(shares, 0, "got zero shares");
        assertEq(m.yesShares(alice), shares);
        assertGt(m.priceYes(), 5_000, "price should move up after YES bet");
        assertEq(usdc.balanceOf(address(treasury)), (BET_AMOUNT * 200) / 10_000); // 2% fee
    }

    function test_SlippageProtection() public {
        PredictionMarket m = _createMarket();

        vm.startPrank(alice);
        usdc.approve(address(m), type(uint256).max);
        uint256 wildlyHighMin = type(uint128).max;
        vm.expectRevert(PredictionMarket.SlippageExceeded.selector);
        m.bet(true, BET_AMOUNT, wildlyHighMin);
        vm.stopPrank();
    }

    function test_CannotBetAfterResolution() public {
        PredictionMarket m = _createMarket();
        vm.warp(block.timestamp + 2 days);

        vm.startPrank(alice);
        usdc.approve(address(m), type(uint256).max);
        vm.expectRevert(PredictionMarket.PastResolution.selector);
        m.bet(true, BET_AMOUNT, 0);
        vm.stopPrank();
    }

    function test_ResolveAndClaim_YES() public {
        PredictionMarket m = _createMarket();

        // Alice bets YES, Bob bets NO
        vm.startPrank(alice);
        usdc.approve(address(m), type(uint256).max);
        m.bet(true, BET_AMOUNT, 0);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(m), type(uint256).max);
        m.bet(false, BET_AMOUNT, 0);
        vm.stopPrank();

        // Time travel past resolution
        vm.warp(block.timestamp + 2 days);

        // Resolve YES
        vm.prank(agent);
        factory.resolveMarket(address(m), PredictionMarket.Outcome.YES);
        assertEq(uint8(m.outcome()), uint8(PredictionMarket.Outcome.YES));

        // Alice claims (winner), Bob cannot
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        uint256 payout = m.claim();
        assertGt(payout, 0);
        assertEq(usdc.balanceOf(alice), aliceBefore + payout);

        vm.prank(bob);
        vm.expectRevert(PredictionMarket.NothingToClaim.selector);
        m.claim();
    }

    function test_InvalidResolution_RefundsAll() public {
        PredictionMarket m = _createMarket();

        vm.startPrank(alice);
        usdc.approve(address(m), type(uint256).max);
        m.bet(true, BET_AMOUNT, 0);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(m), type(uint256).max);
        m.bet(false, BET_AMOUNT, 0);
        vm.stopPrank();

        vm.warp(block.timestamp + 2 days);

        vm.prank(agent);
        factory.resolveMarket(address(m), PredictionMarket.Outcome.INVALID);

        // Both can claim refunds
        vm.prank(alice);
        uint256 aliceRefund = m.claim();
        vm.prank(bob);
        uint256 bobRefund = m.claim();

        assertGt(aliceRefund, 0);
        assertGt(bobRefund, 0);
    }

    function test_OnlyAgentCanResolve() public {
        PredictionMarket m = _createMarket();
        vm.warp(block.timestamp + 2 days);

        vm.prank(alice);
        vm.expectRevert(MarketFactory.NotAgent.selector);
        factory.resolveMarket(address(m), PredictionMarket.Outcome.YES);
    }

    function test_CannotResolveUnknownMarket() public {
        vm.prank(agent);
        vm.expectRevert(MarketFactory.UnknownMarket.selector);
        factory.resolveMarket(address(0xDEAD), PredictionMarket.Outcome.YES);
    }

    function test_FaucetCooldown() public {
        vm.prank(alice);
        usdc.faucet();
        assertEq(usdc.balanceOf(alice), 10_000 * 1e6 + 1_000 * 1e6);

        vm.prank(alice);
        vm.expectRevert(); // FaucetCooldownActive
        usdc.faucet();

        vm.warp(block.timestamp + 1 hours + 1);
        vm.prank(alice);
        usdc.faucet();
    }
}
