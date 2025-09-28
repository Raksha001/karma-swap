// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "lib/forge-std/src/Test.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {CurrencyLibrary, Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {IPoolInitializer_v4} from "@uniswap/v4-periphery/src/interfaces/IPoolInitializer_v4.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";

import "../contracts/CombinedFeeHook.sol";
import "../contracts/VolatilityOracle.sol";
import "../contracts/CombinedFeeCalculator.sol";

contract CombinedFeeHookSimpleTest is Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using LPFeeLibrary for uint24;

    CombinedFeeHook hook;
    VolatilityOracle oracle;
    CombinedFeeCalculator calculator;
    PoolSwapTest testSwapper; // Renamed to avoid conflict with Deployers

    PoolKey poolKey;
    PoolId poolId;

    address oracleUpdater = makeAddr("oracleUpdater");
    uint256 private signerPrivateKey = 0xA11CE;
    address private signerAddress;

    // Same parameters as your deployment scripts
    uint32 constant BASE_FEE = 3000;
    uint32 constant MAX_FEE = 10000;
    uint32 constant MIN_FEE = 100;
    uint32 constant VOLATILITY_MULTIPLIER = 500;
    uint32 constant VOLATILITY_EXPONENT = 10;
    uint32 constant INITIAL_VOLATILITY = 500; // 5% like your script

    function setUp() public {
        // Deploy Uniswap v4 core (this gives us manager, currency0, currency1, etc.)
        Deployers.deployFreshManagerAndRouters();
        
        // Deploy calculator with exact same params as your deployment script
        calculator = new CombinedFeeCalculator(
            BASE_FEE,    // 3000
            MAX_FEE,     // 10000
            MIN_FEE,     // 100
            VOLATILITY_MULTIPLIER, // 500
            VOLATILITY_EXPONENT    // 10
        );
        console.log("Calculator deployed at:", address(calculator));
        
        // Deploy oracle first (will set hook later, like your script)
        oracle = new VolatilityOracle(address(0));
        console.log("Oracle deployed at:", address(oracle));
        
        // Mine for hook address with correct flags (exactly like your deployment script)
        uint160 flags = uint160(
            Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
        );
        
        bytes memory constructorArgs = abi.encode(manager, address(calculator));
        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this), // deployer
            flags,
            type(CombinedFeeHook).creationCode,
            constructorArgs
        );
        console.log("Mined hook address:", hookAddress);
        
        // Deploy hook with mined salt (exactly like your script)
        hook = new CombinedFeeHook{salt: salt}(manager, address(calculator));
        require(address(hook) == hookAddress, "Hook address mismatch!");
        console.log("Hook deployed at:", address(hook));
        
        // Configure contracts exactly like your deployment script
        oracle.setFeeHook(address(hook));
        hook.setVolatilityOracle(address(oracle));
        
        signerAddress = vm.addr(signerPrivateKey);
        hook.setReputationSigner(signerAddress);
        oracle.addUpdater(oracleUpdater);
        oracle.addUpdater(address(this)); // Add test contract as updater

        // Use the existing swapRouter from Deployers, just rename our reference
        testSwapper = new PoolSwapTest(manager);

        // Create pool key with same parameters as your scripts
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG, // 0x800000
            tickSpacing: 60, // Same as your script
            hooks: IHooks(address(hook))
        });
        poolId = poolKey.toId();

        // Set initial volatility BEFORE pool creation (like your MasterPoolScript)
        bytes32 testPoolId = bytes32(uint256(poolId));
        oracle.updateVolatility(testPoolId, INITIAL_VOLATILITY);
        console.log("Initial volatility set:", INITIAL_VOLATILITY);

        // Initialize pool with same sqrt price as your script
        manager.initialize(poolKey, SQRT_PRICE_1_1); // This is 1:1 price like your script
        
        // Add liquidity using the same approach as Deployers (simplified for testing)
        modifyLiquidityRouter.modifyLiquidity(
            poolKey,
            IPoolManager.ModifyLiquidityParams({
                tickLower: -60,
                tickUpper: 60,
                liquidityDelta: 10 ether,
                salt: bytes32(0)
            }),
            ZERO_BYTES
        );
        
        console.log("Setup complete - pool ID:", uint256(poolId));
        console.log("Pool initialized with dynamic fees and initial liquidity");
    }

    // ================================
    // ESSENTIAL CALCULATOR TESTS
    // ================================

    function test_BasicFeeCalculation() public {
        // Test with same parameters as your deployment
        console.log("=== FEE CALCULATION TESTS ===");
        
        // Base fee with no volatility or reputation
        uint32 baseFee = calculator.calculateFee(0, 0);
        assertEq(baseFee, BASE_FEE);
        console.log("Base fee (no volatility/reputation):", baseFee);

        // With volatility (same as your initial volatility: 500 = 5%)
        uint32 volatilityFee = calculator.calculateFee(INITIAL_VOLATILITY, 0);
        assertTrue(volatilityFee > baseFee);
        console.log("Fee with 5% volatility:", volatilityFee);

        // With high reputation (discount)
        uint32 reputationFee = calculator.calculateFee(0, 80);
        assertTrue(reputationFee < baseFee);
        console.log("Fee with high reputation:", reputationFee);

        // Combined (volatility + reputation like real usage)
        uint32 combinedFee = calculator.calculateFee(INITIAL_VOLATILITY, 80);
        console.log("Combined fee (5% volatility + high reputation):", combinedFee);
        console.log("Calculator tests passed!");
    }

    // ================================
    // ESSENTIAL ORACLE TESTS
    // ================================

    function test_VolatilityUpdate() public {
        console.log("=== VOLATILITY ORACLE TESTS ===");
        bytes32 testPoolId = keccak256("test");
        
        // Test same initial volatility as your deployment script
        vm.prank(oracleUpdater);
        oracle.updateVolatility(testPoolId, INITIAL_VOLATILITY);
        
        (uint32 volatility,) = oracle.getVolatility(testPoolId);
        assertEq(volatility, INITIAL_VOLATILITY);
        assertEq(hook.poolVolatility(testPoolId), INITIAL_VOLATILITY);
        
        console.log("Volatility update test passed - volatility set to:", volatility);
    }

    function test_OnlyAuthorizedCanUpdate() public {
        console.log("=== AUTHORIZATION TESTS ===");
        vm.expectRevert("Not authorized");
        oracle.updateVolatility(keccak256("test"), 500);
        console.log("Authorization test passed - unauthorized access blocked");
    }

    // ================================
    // ESSENTIAL HOOK TESTS
    // ================================

    function test_RequiresDynamicFee() public {
        console.log("=== DYNAMIC FEE REQUIREMENT TEST ===");
        PoolKey memory staticFeeKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000, // Static fee (should fail)
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        vm.expectRevert(CombinedFeeHook.PoolMustUseDynamicFee.selector);
        manager.initialize(staticFeeKey, SQRT_PRICE_1_1);
        console.log("Dynamic fee requirement test passed!");
    }

    function test_SwapUpdatesFee() public {
        console.log("=== SWAP FEE UPDATE TEST ===");
        bytes32 testPoolId = bytes32(uint256(poolId));
        
        // The volatility is already set in setUp() to INITIAL_VOLATILITY
        console.log("Pool volatility already set to:", hook.poolVolatility(testPoolId));
        
        // Initial fee should be 0 (no swaps yet)
        assertEq(hook.lastFees(testPoolId), 0);
        console.log("Initial fee before swap:", hook.lastFees(testPoolId));
        
        // Perform swap
        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -1e18, // Swap 1 token
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });
        
        testSwapper.swap(poolKey, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);
        
        // Fee should be updated
        uint24 newFee = hook.lastFees(testPoolId);
        uint32 expectedFee = calculator.calculateFee(INITIAL_VOLATILITY, 0);
        
        assertTrue(newFee > 0);
        assertEq(newFee, expectedFee);
        
        console.log("Fee after swap:", newFee);
        console.log("Expected fee from calculator:", expectedFee);
        console.log("Swap fee update test passed!");
    }

    function test_ReputationDiscount() public {
        console.log("=== REPUTATION DISCOUNT TEST ===");
        bytes32 testPoolId = bytes32(uint256(poolId));
        
        // Create valid reputation signature
        uint256 reputationScore = 85;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 messageHash = keccak256(abi.encodePacked(address(testSwapper), reputationScore, deadline));
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, prefixedHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        bytes memory hookData = abi.encode(reputationScore, deadline, signature);
        
        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -1e18,
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });
        
        testSwapper.swap(poolKey, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), hookData);
        
        uint24 finalFee = hook.lastFees(testPoolId);
        uint32 expectedFee = calculator.calculateFee(INITIAL_VOLATILITY, reputationScore);
        assertEq(finalFee, expectedFee);
        
        console.log("Fee with reputation score", reputationScore, ":", finalFee);
        console.log("Expected fee:", expectedFee);
        console.log("Reputation discount test passed!");
    }

    function test_InvalidSignature() public {
        console.log("=== INVALID SIGNATURE TEST ===");
        uint256 reputationScore = 75;
        uint256 deadline = block.timestamp + 1 hours;
        address testSender = makeAddr("testSender");
        
        // Wrong signature
        bytes memory signature = abi.encodePacked(bytes32("wrong"), bytes32("signature"), bytes1(0x1b));
        bytes memory hookData = abi.encode(reputationScore, deadline, signature);
        
        (bool success, uint256 score) = hook.verifyReputation(hookData, testSender);
        
        assertFalse(success);
        assertEq(score, 0);
        console.log("Invalid signature correctly rejected");
    }

    // ================================
    // INTEGRATION TEST
    // ================================

    function test_FullWorkflow() public {
        bytes32 testPoolId = bytes32(uint256(poolId));
        console.log("=== FULL WORKFLOW TEST ===");
        
        // Pool already has volatility set in setUp(), but let's update it
        oracle.updateVolatility(testPoolId, 600); // Increase to 6%
        console.log("1. Updated volatility to 600 (6%)");
        
        // 2. Swap without reputation
        SwapParams memory params = SwapParams({
            zeroForOne: true,
            amountSpecified: -1e17, // Smaller amount
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });
        
        testSwapper.swap(poolKey, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);
        uint24 feeWithoutReputation = hook.lastFees(testPoolId);
        console.log("2. Fee without reputation:", feeWithoutReputation);
        
        // 3. Swap with reputation
        uint256 reputationScore = 80;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 messageHash = keccak256(abi.encodePacked(address(testSwapper), reputationScore, deadline));
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, prefixedHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        bytes memory hookData = abi.encode(reputationScore, deadline, signature);
        
        params.zeroForOne = false; // Swap back
        testSwapper.swap(poolKey, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), hookData);
        uint24 feeWithReputation = hook.lastFees(testPoolId);
        console.log("3. Fee with reputation (score 80):", feeWithReputation);
        
        // 4. Verify reputation discount worked
        assertTrue(feeWithReputation < feeWithoutReputation);
        console.log("4. Reputation discount confirmed!");
        
        uint256 discount = feeWithoutReputation - feeWithReputation;
        console.log("   Discount amount:", discount);
        console.log("   Discount %:", (discount * 100) / feeWithoutReputation);
        
        console.log("=== FULL WORKFLOW PASSED! ===");
    }

    // ================================
    // ACCESS CONTROL TESTS
    // ================================

    function test_OnlyOwnerCanSetOracle() public {
        console.log("=== ACCESS CONTROL TESTS ===");
        address notOwner = makeAddr("notOwner");
        vm.prank(notOwner);
        vm.expectRevert("Only owner");
        hook.setVolatilityOracle(notOwner);
        console.log("Hook access control test passed");
    }

    function test_OnlyOwnerCanUpdateCalculatorParams() public {
        address notOwner = makeAddr("notOwner");
        vm.prank(notOwner);
        vm.expectRevert("Only owner");
        calculator.updateParameters(2000, 8000, 400, 800, 10);
        console.log("Calculator access control test passed");
    }

    // ================================
    // PARAMETER VERIFICATION TEST
    // ================================

    function test_DeploymentParametersMatch() public {
        console.log("=== DEPLOYMENT PARAMETER VERIFICATION ===");
        
        // Verify calculator parameters match your deployment script
        assertEq(calculator.baseFee(), BASE_FEE);
        assertEq(calculator.maxFee(), MAX_FEE);
        assertEq(calculator.minFee(), MIN_FEE);
        assertEq(calculator.volatilityMultiplier(), VOLATILITY_MULTIPLIER);
        assertEq(calculator.volatilityExponent(), VOLATILITY_EXPONENT);
        
        console.log(" Base Fee:", calculator.baseFee());
        console.log(" Max Fee:", calculator.maxFee());
        console.log(" Min Fee:", calculator.minFee());
        console.log(" Volatility Multiplier:", calculator.volatilityMultiplier());
        console.log(" Volatility Exponent:", calculator.volatilityExponent());
        
        // Verify relationships are set correctly
        assertEq(address(hook.feeCalculator()), address(calculator));
        assertEq(address(hook.volatilityOracle()), address(oracle));
        assertEq(address(oracle.feeHook()), address(hook));
        
        console.log(" All contract relationships configured correctly");
        console.log(" Parameters match deployment script exactly");
    }
}