// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "lib/forge-std/src/Script.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

// Import your contracts for fee checking
import {VolatilityOracle} from "../contracts/VolatilityOracle.sol";
import {CombinedFeeHook} from "../contracts/CombinedFeeHook.sol";

contract SimpleSwapTest is Script {
    // Sepolia testnet addresses
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    
    // Your deployed addresses - UPDATE THESE!
    address constant COMBINED_FEE_HOOK = 0xE35a5Be1F715eFD40Cc8b9E63B122219c297a080;
    address constant VOLATILITY_ORACLE = 0x1606CB20F347c8d808dB43b3Ad9cA0BC3222FbC3;
    address constant TOKEN0 = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant TOKEN1 = 0xdd13E55209Fd76AfE204dBda4007C227904f0a81;
    
    int24 constant TICK_SPACING = 60;
    uint256 constant SWAP_AMOUNT = 10000; // Even smaller amount to be safe

    function run() external {
        console.log("=== FIXED SWAP TEST ===");
        console.log("Testing with corrected price limit handling");
        
        vm.startBroadcast();
        
        // Deploy PoolSwapTest contract
        PoolSwapTest swapTest = new PoolSwapTest(IPoolManager(POOL_MANAGER));
        console.log("PoolSwapTest deployed at: %s", address(swapTest));
        
        // Create pool key
        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(COMBINED_FEE_HOOK)
        });
        
        bytes32 poolId = keccak256(abi.encode(pool));
        console.log("Pool ID: %s", uint256(poolId));
        
        // Check token balances
        uint256 balance0 = IERC20(TOKEN0).balanceOf(msg.sender);
        uint256 balance1 = IERC20(TOKEN1).balanceOf(msg.sender);
        console.log("TOKEN0 balance: %s", balance0);
        console.log("TOKEN1 balance: %s", balance1);
        
        require(balance0 >= SWAP_AMOUNT, "Need more TOKEN0 for testing");
        require(balance1 >= SWAP_AMOUNT, "Need more TOKEN1 for testing");
        
        // Approve tokens
        IERC20(TOKEN0).approve(address(swapTest), type(uint256).max);
        IERC20(TOKEN1).approve(address(swapTest), type(uint256).max);
        console.log("Tokens approved");
        
        // Set a known volatility for predictable testing
        VolatilityOracle oracle = VolatilityOracle(VOLATILITY_ORACLE);
        oracle.updateVolatility(poolId, 1000); // 10% volatility
        console.log("Volatility set to 10%");
        
        // Check initial fee
        CombinedFeeHook hook = CombinedFeeHook(COMBINED_FEE_HOOK);
        uint24 initialFee = hook.lastFees(poolId);
        console.log("Initial fee: %s (%.4f%%)", initialFee, initialFee / 10000.0);
        
        console.log("\n=== ATTEMPTING SWAP ===");
        
        // Try multiple approaches to find one that works
        bool success = false;
        
        // // Approach 1: Use MAX_SQRT_PRICE for zeroForOne=true (counter-intuitive but might work)
        // console.log("Approach 1: Using MAX_SQRT_PRICE...");
        // success = _trySwap(swapTest, pool, true, SWAP_AMOUNT, TickMath.MAX_SQRT_PRICE);
        
        if (!success) {
            // Approach 2: Use MIN_SQRT_PRICE + 1
            console.log("Approach 2: Using MIN_SQRT_PRICE + 1...");
            success = _trySwap(swapTest, pool, true, SWAP_AMOUNT, TickMath.MIN_SQRT_PRICE + 1);
        }
        
        if (!success) {
            // Approach 3: Use a middle value
            console.log("Approach 3: Using middle sqrt price...");
            uint160 middlePrice = uint160((uint256(TickMath.MIN_SQRT_PRICE) + uint256(TickMath.MAX_SQRT_PRICE)) / 2);
            success = _trySwap(swapTest, pool, true, SWAP_AMOUNT, middlePrice);
        }
        
        if (!success) {
            // Approach 4: Try exact input instead of exact output
            console.log("Approach 4: Trying negative amount (exact input)...");
            success = _trySwap(swapTest, pool, true, SWAP_AMOUNT, 0, true); // negative amount = exact input
        }
        
        if (!success) {
            console.log(" All swap attempts failed. Let's debug the pool state...");
            _debugPool(pool);
        } else {
            console.log(" Swap succeeded!");
            
            // Check fee after successful swap
            uint24 newFee = hook.lastFees(poolId);
            console.log("Fee after swap: %s (%.4f%%)", newFee, newFee / 10000.0);
            
            if (newFee != initialFee) {
                console.log(" Dynamic fee calculation worked!");
            }
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== TEST COMPLETE ===");
    }

    
    function _trySwap(
        PoolSwapTest swapTest,
        PoolKey memory pool,
        bool zeroForOne,
        uint256 amount,
        uint160 priceLimit
    ) internal returns (bool) {
        return _trySwap(swapTest, pool, zeroForOne, amount, priceLimit, false);
    }

    function _trySwap(
        PoolSwapTest swapTest,
        PoolKey memory pool,
        bool zeroForOne,
        uint256 amount,
        uint160 priceLimit,
        bool exactInput
    ) internal returns (bool) {
        int256 amountSpecified = exactInput ? -int256(amount) : int256(amount);
        
        SwapParams memory swapParams = SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: amountSpecified,
            sqrtPriceLimitX96: priceLimit
        });
        
        uint256 balance0Before = IERC20(TOKEN0).balanceOf(msg.sender);
        uint256 balance1Before = IERC20(TOKEN1).balanceOf(msg.sender);
        
        try swapTest.swap(
            pool,
            swapParams,
            PoolSwapTest.TestSettings({
                takeClaims: false,
                settleUsingBurn: false
            }),
            ""
        ) {
            uint256 balance0After = IERC20(TOKEN0).balanceOf(msg.sender);
            uint256 balance1After = IERC20(TOKEN1).balanceOf(msg.sender);
            
            console.log("   Success! Price limit: %s", priceLimit);
            if (zeroForOne) {
                console.log("    TOKEN0 change: %s", int256(balance0After) - int256(balance0Before));
                console.log("    TOKEN1 change: %s", int256(balance1After) - int256(balance1Before));
            } else {
                console.log("    TOKEN1 change: %s", int256(balance1After) - int256(balance1Before));
                console.log("    TOKEN0 change: %s", int256(balance0After) - int256(balance0Before));
            }
            return true;
            
        } catch Error(string memory reason) {
            console.log("   Failed with: %s", reason);
            return false;
        } catch (bytes memory lowLevelData) {
            console.log("  Z Failed with low-level error");
            console.logBytes(lowLevelData);
            return false;
        }
    }

    function _debugPool(PoolKey memory pool) internal view {
        console.log("\n=== POOL DEBUG INFO ===");
        console.log("Currency0: %s", Currency.unwrap(pool.currency0));
        console.log("Currency1: %s", Currency.unwrap(pool.currency1));
        console.log("Fee flag: %s", pool.fee);
        console.log("Tick spacing: %s", int256(pool.tickSpacing));
        console.log("Hook: %s", address(pool.hooks));
        console.log("TickMath.MIN_SQRT_PRICE: %s", TickMath.MIN_SQRT_PRICE);
        console.log("TickMath.MAX_SQRT_PRICE: %s", TickMath.MAX_SQRT_PRICE);
    }
}