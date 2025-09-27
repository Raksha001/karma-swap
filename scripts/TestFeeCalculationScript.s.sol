// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "lib/forge-std/src/Script.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";

// Import your contracts
import {VolatilityOracle} from "../contracts/VolatilityOracle.sol";
import {CombinedFeeCalculator} from "../contracts/CombinedFeeCalculator.sol";

contract TestFeeCalculationScript is Script {
    // Use your deployed addresses (update with your actual deployment)
    address constant VOLATILITY_ORACLE = 0x1606CB20F347c8d808dB43b3Ad9cA0BC3222FbC3;
    address constant FEE_CALCULATOR = 0x3920e2e3cfa699B71957E6D9204a14b38405d6A8; // Update this
    address constant TOKEN0 = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant TOKEN1 = 0xdd13E55209Fd76AfE204dBda4007C227904f0a81;
    address constant COMBINED_FEE_HOOK = 0xE35a5Be1F715eFD40Cc8b9E63B122219c297a080;
    
    int24 constant TICK_SPACING = 60;

    function run() external {
        console.log("=== TESTING FEE CALCULATION LOGIC ===");

        vm.startBroadcast();

        // Create pool key to get pool ID
        PoolKey memory pool = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(COMBINED_FEE_HOOK)
        });

        bytes32 poolId = keccak256(abi.encode(pool));
        VolatilityOracle oracle = VolatilityOracle(VOLATILITY_ORACLE);
        CombinedFeeCalculator calculator = CombinedFeeCalculator(FEE_CALCULATOR);

        console.log("Pool ID: %s", uint256(poolId));

        // Test different volatility levels
        console.log("\n--- Testing Fee Calculation at Different Volatility Levels ---");

        uint32[] memory volatilities = new uint32[](5);
        volatilities[0] = 50;   // 0.5%
        volatilities[1] = 100;  // 1%
        volatilities[2] = 300;  // 3%
        volatilities[3] = 500;  // 5%
        volatilities[4] = 1000; // 10%

        for (uint i = 0; i < volatilities.length; i++) {
            uint32 vol = volatilities[i];
            
            // Set volatility in oracle
            oracle.updateVolatility(poolId, vol);
            
            // Test fee calculation with different reputation scores
            uint256[] memory reputationScores = new uint256[](4);
            reputationScores[0] = 0;    // No reputation
            reputationScores[1] = 25;   // Low reputation  
            reputationScores[2] = 50;   // Medium reputation
            reputationScores[3] = 100;  // High reputation

            console.log("\nVolatility: %s%% (raw: %s)", vol / 100, vol);
            
            for (uint j = 0; j < reputationScores.length; j++) {
                uint256 rep = reputationScores[j];
                uint32 fee = calculator.calculateFee(vol, rep);
                
                console.log("  Reputation %s -> Fee: %s (%.4f%%)", 
                    rep, 
                    fee, 
                    fee / 10000.0
                );
            }
        }

        // Test edge cases
        console.log("\n--- Testing Edge Cases ---");
        
        // Very high volatility
        console.log("Very high volatility (50%%):");
        uint32 extremeFee = calculator.calculateFee(5000, 0);
        console.log("  Fee: %s (%.4f%%)", extremeFee, extremeFee / 10000.0);
        
        // Maximum reputation discount
        console.log("Max reputation with high volatility:");
        uint32 discountedFee = calculator.calculateFee(1000, 100);
        console.log("  Fee: %s (%.4f%%)", discountedFee, discountedFee / 10000.0);

        vm.stopBroadcast();

        console.log("\n=== FEE CALCULATION TESTING COMPLETE ===");
        console.log("Key Observations:");
        console.log("- Higher volatility = Higher fees");
        console.log("- Higher reputation = Lower fees");
        console.log("- Fee range should be reasonable for trading");
        
        console.log("\nExpected Behavior:");
        console.log("- Low vol (1%%) + No rep: ~0.30-0.50%% fee");
        console.log("- High vol (10%%) + No rep: ~0.80-1.00%% fee"); 
        console.log("- High vol (10%%) + Max rep: ~0.50-0.70%% fee");
    }
}