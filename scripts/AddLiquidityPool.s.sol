// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "lib/forge-std/src/Script.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAllowanceTransfer} from "permit2/src/interfaces/IAllowanceTransfer.sol";

// Import PositionManager interfaces
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {IPoolInitializer_v4} from "@uniswap/v4-periphery/src/interfaces/IPoolInitializer_v4.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";

// Import your contracts
import {VolatilityOracle} from "../contracts/VolatilityOracle.sol";

contract MasterPoolScript is Script {
    // Sepolia testnet addresses
    address constant POSITION_MANAGER = 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4;
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    
    // Your deployed addresses (UPDATE THESE WITH YOUR ACTUAL ADDRESSES)
    address constant COMBINED_FEE_HOOK = 0xE35a5Be1F715eFD40Cc8b9E63B122219c297a080;
    address constant VOLATILITY_ORACLE = 0x1606CB20F347c8d808dB43b3Ad9cA0BC3222FbC3; // Replace with your oracle address
    address constant TOKEN0 = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant TOKEN1 = 0xdd13E55209Fd76AfE204dBda4007C227904f0a81;
    
    // Pool and liquidity parameters  
    int24 constant TICK_SPACING = 60;
    uint160 constant INITIAL_SQRT_PRICE = 79228162514264337593543950336; // 1:1 price
    int24 constant TICK_LOWER = -887220; // Full range
    int24 constant TICK_UPPER = 887220;  // Full range
    // Dynamic amounts - will be set based on actual balance
    uint256 AMOUNT0_MAX;
    uint256 AMOUNT1_MAX; 
    uint256 LIQUIDITY;
    uint32 constant INITIAL_VOLATILITY = 500; // 5%

    function run() external {
        console.log("=== MASTER SCRIPT: CREATE POOL + SET VOLATILITY + ADD LIQUIDITY ===");
        console.log("PositionManager: %s", POSITION_MANAGER);
        console.log("Hook: %s", COMBINED_FEE_HOOK);
        console.log("Oracle: %s", VOLATILITY_ORACLE);
        console.log("TOKEN0: %s", TOKEN0);
        console.log("TOKEN1: %s", TOKEN1);

        vm.startBroadcast();

        // Create the pool key
        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG, // 0x800000
            tickSpacing: TICK_SPACING,
            hooks: IHooks(COMBINED_FEE_HOOK)
        });

        console.log("Pool key created with dynamic fee flag: %s", uint24(LPFeeLibrary.DYNAMIC_FEE_FLAG));

        // Calculate pool ID for volatility setting
        bytes32 poolId = keccak256(abi.encode(pool));
        console.log("Pool ID: %s", uint256(poolId));

        // STEP 1: Set initial volatility BEFORE pool creation
        console.log("\n--- STEP 1: Setting Initial Volatility ---");
        VolatilityOracle oracle = VolatilityOracle(VOLATILITY_ORACLE);
        oracle.updateVolatility(poolId, INITIAL_VOLATILITY);
        console.log("Initial volatility set: %s (%.2f%%)", INITIAL_VOLATILITY, INITIAL_VOLATILITY / 100.0);

        // Check token balances and set amounts based on available balance
        uint256 balance0 = IERC20(TOKEN0).balanceOf(msg.sender);
        uint256 balance1 = IERC20(TOKEN1).balanceOf(msg.sender);
        
        console.log("Your token balances:");
        console.log("  TOKEN0 balance: %s", balance0);
        console.log("  TOKEN1 balance: %s", balance1);
        
        // Use 80% of available balance to be safe
        AMOUNT0_MAX = (balance0 * 80) / 100;
        AMOUNT1_MAX = (balance1 * 80) / 100;
        
        // Set liquidity proportional to the smaller amount
        LIQUIDITY = AMOUNT0_MAX < AMOUNT1_MAX ? AMOUNT0_MAX / 10 : AMOUNT1_MAX / 10;
        
        console.log("Using amounts:");
        console.log("  AMOUNT0_MAX: %s", AMOUNT0_MAX);
        console.log("  AMOUNT1_MAX: %s", AMOUNT1_MAX);
        console.log("  LIQUIDITY: %s", LIQUIDITY);
        
        require(AMOUNT0_MAX > 0, "TOKEN0 balance too low");
        require(AMOUNT1_MAX > 0, "TOKEN1 balance too low");
        console.log("\n--- STEP 2: Token Approvals ---");
        IERC20(TOKEN0).approve(PERMIT2, type(uint256).max);
        IERC20(TOKEN1).approve(PERMIT2, type(uint256).max);
        console.log("Tokens approved to Permit2");

        // Approve PositionManager through Permit2
        IAllowanceTransfer(PERMIT2).approve(TOKEN0, POSITION_MANAGER, type(uint160).max, type(uint48).max);
        IAllowanceTransfer(PERMIT2).approve(TOKEN1, POSITION_MANAGER, type(uint160).max, type(uint48).max);
        console.log("PositionManager approved through Permit2");

        // STEP 3: Create Pool + Add Liquidity in ONE transaction using multicall
        console.log("\n--- STEP 3: Creating Pool + Adding Liquidity (Atomic) ---");

        bytes[] memory params = new bytes[](2);

        // First call: Initialize the pool
        params[0] = abi.encodeWithSelector(
            IPoolInitializer_v4.initializePool.selector,
            pool,
            INITIAL_SQRT_PRICE
        );

        // Second call: Add liquidity
        bytes memory actions = abi.encodePacked(
            uint8(Actions.MINT_POSITION), 
            uint8(Actions.SETTLE_PAIR)  
        );

        bytes[] memory mintParams = new bytes[](2);
        mintParams[0] = abi.encode(
            pool,           // PoolKey
            TICK_LOWER,     // tickLower
            TICK_UPPER,     // tickUpper  
            LIQUIDITY,      // liquidity amount
            AMOUNT0_MAX,    // amount0Max
            AMOUNT1_MAX,    // amount1Max
            msg.sender,     // recipient
            ""              // hookData
        );
        mintParams[1] = abi.encode(pool.currency0, pool.currency1);

        uint256 deadline = block.timestamp + 60;
        params[1] = abi.encodeWithSelector(
            IPositionManager.modifyLiquidities.selector,
            abi.encode(actions, mintParams),
            deadline
        );

        // Execute the atomic multicall
        console.log("Executing atomic pool creation + liquidity addition...");
        IPositionManager(POSITION_MANAGER).multicall(params);

        console.log(" Pool created and liquidity added in single transaction!");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log(" Pool created with dynamic fees");
        console.log(" Initial volatility set: %s%%", INITIAL_VOLATILITY / 100);
        console.log(" Liquidity added - you received an NFT position");
        console.log(" Pool is ready for dynamic fee swaps!");

        console.log("\nPool Details:");
        console.log("  Pool ID: %s", uint256(poolId));
        console.log("  TOKEN0: %s", TOKEN0);
        console.log("  TOKEN1: %s", TOKEN1);
        console.log("  Hook: %s", COMBINED_FEE_HOOK);
        console.log("  Fee: Dynamic (0x%s)", _toHexString(abi.encodePacked(uint24(LPFeeLibrary.DYNAMIC_FEE_FLAG))));
        console.log("  Tick Lower: %s", int256(TICK_LOWER));
        console.log("  Tick Upper: %s", int256(TICK_UPPER));
        console.log("  Initial Volatility: %s%%", INITIAL_VOLATILITY / 100);

        console.log("\nNext Steps:");
        console.log("1. Test swaps with different volatility levels");
        console.log("2. Test reputation-based fee discounts");
        console.log("3. Monitor FeeUpdated events from your hook");
    }

    function _toHexString(bytes memory data) internal pure returns (string memory) {
        bytes16 _HEX_SYMBOLS = "0123456789abcdef";
        bytes memory buffer = new bytes(data.length * 2);
        for (uint256 i = 0; i < data.length; i++) {
            buffer[i * 2] = _HEX_SYMBOLS[uint8(data[i]) / 16];
            buffer[i * 2 + 1] = _HEX_SYMBOLS[uint8(data[i]) % 16];
        }
        return string(buffer);
    }
}