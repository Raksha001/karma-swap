// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "lib/forge-std/src/Script.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";

// Import your contracts
import {CombinedFeeHook} from "../contracts/CombinedFeeHook.sol";
import {CombinedFeeCalculator} from "../contracts/CombinedFeeCalculator.sol";
import {VolatilityOracle} from "../contracts/VolatilityOracle.sol";

contract DeployCombinedFeeHookScript is Script {
    // Sepolia PoolManager address
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        console.log("Starting CombinedFeeHook deployment on Sepolia...");
        console.log("Deployer (tx sender): %s", msg.sender);

        vm.startBroadcast();

        // Step 1: Deploy CombinedFeeCalculator first
        console.log("Deploying CombinedFeeCalculator...");
        CombinedFeeCalculator feeCalculator = new CombinedFeeCalculator(3000, 10000, 100, 500, 10);
        console.log("CombinedFeeCalculator deployed at %s", address(feeCalculator));

        // Step 2: Mine for the hook address with CORRECT flags
        console.log("Mining for hook address with correct flags...");
        // FIX: Include BOTH flags that your hook uses
        uint160 flags = uint160(
            Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
        );
        
        bytes memory constructorArgs = abi.encode(POOL_MANAGER, address(feeCalculator));
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(CombinedFeeHook).creationCode,
            constructorArgs
        );
        console.log("Found target hook address: %s", hookAddress);
        console.log("Salt: %s", uint256(salt));
        
        // Step 3: Deploy VolatilityOracle
        console.log("Deploying VolatilityOracle...");
        VolatilityOracle volatilityOracle = new VolatilityOracle(hookAddress);
        console.log("VolatilityOracle deployed at %s", address(volatilityOracle));

        // Step 4: Deploy the hook using the mined salt
        console.log("Deploying CombinedFeeHook...");
        CombinedFeeHook hook = new CombinedFeeHook{salt: salt}(
            IPoolManager(POOL_MANAGER),
            address(feeCalculator)
        );
        require(address(hook) == hookAddress, "Hook address mismatch!");

        // Step 5: Configure contracts
        console.log("Configuring contracts...");
        hook.setVolatilityOracle(address(volatilityOracle));
        console.log("   - VolatilityOracle address set in hook");
        
        hook.setReputationSigner(msg.sender);
        console.log("   - ReputationSigner address set in hook");

        volatilityOracle.addUpdater(msg.sender);
        console.log("   - Deployer authorized as updater in oracle");
        
        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("CombinedFeeCalculator: %s", address(feeCalculator));
        console.log("VolatilityOracle: %s", address(volatilityOracle));
        console.log("CombinedFeeHook: %s", address(hook));

        console.log("\nVerification commands:");
        console.log("forge verify-contract --chain sepolia %s contracts/CombinedFeeCalculator.sol:CombinedFeeCalculator", address(feeCalculator));
        console.log("forge verify-contract --chain sepolia %s contracts/VolatilityOracle.sol:VolatilityOracle", address(volatilityOracle));
        console.log("forge verify-contract --chain sepolia %s contracts/CombinedFeeHook.sol:CombinedFeeHook --constructor-args %s",
            address(hook),
            _encodeConstructorArgs(POOL_MANAGER, address(feeCalculator))
        );
    }

    function _encodeConstructorArgs(address poolManager, address feeCalculator) internal pure returns (string memory) {
        return string(abi.encodePacked("0x", _toHexString(abi.encode(poolManager, feeCalculator))));
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