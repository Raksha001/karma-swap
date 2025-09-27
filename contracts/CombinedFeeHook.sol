// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

interface ICombinedFeeCalculator {
    function calculateFee(uint32 volatility, uint256 reputationScore) external view returns (uint32 fee);
}

contract CombinedFeeHook is BaseHook {
    using LPFeeLibrary for uint24;

    ICombinedFeeCalculator public feeCalculator;
    address public owner;
    address public volatilityOracle;
    address public reputationSigner;

    mapping(bytes32 => uint32) public poolVolatility;
    mapping(bytes32 => uint24) public lastFees;
    mapping(bytes32 => uint256) public lastFeeUpdate;
    
    uint256 public constant FEE_UPDATE_COOLDOWN = 1 seconds;

    error PoolMustUseDynamicFee();

    // ... (Events, Modifiers, Constructor, Config functions are unchanged) ...
    event FeeUpdated(bytes32 indexed poolId, uint24 oldFee, uint24 newFee);
    event VolatilityUpdated(bytes32 indexed poolId, uint32 volatility);
    event ReputationSignerUpdated(address indexed newSigner);
    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }
    modifier onlyOracle() { require(msg.sender == volatilityOracle, "Only oracle"); _; }

    constructor(IPoolManager _poolManager, address _feeCalculator) BaseHook(_poolManager) {
        feeCalculator = ICombinedFeeCalculator(_feeCalculator);
        owner = tx.origin;
    }
    function setFeeCalculator(address _feeCalculator) external onlyOwner { feeCalculator = ICombinedFeeCalculator(_feeCalculator); }
    function setVolatilityOracle(address _volatilityOracle) external onlyOwner { volatilityOracle = _volatilityOracle; }
    function setReputationSigner(address _signer) external onlyOwner { reputationSigner = _signer; emit ReputationSignerUpdated(_signer); }
    function updateVolatility(bytes32 poolId, uint32 volatility) external onlyOracle { poolVolatility[poolId] = volatility; emit VolatilityUpdated(poolId, volatility); }


    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: true,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function _beforeInitialize(address, PoolKey calldata key, uint160) internal view override returns (bytes4) {
        if (!key.fee.isDynamicFee()) revert PoolMustUseDynamicFee();
        return BaseHook.beforeInitialize.selector;
    }

    // --- MODIFIED: _beforeSwap is now much simpler ---
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        bytes32 poolId = keccak256(abi.encode(key));
        uint32 volatility = poolVolatility[poolId];

        // Call the new helper function to get the fee
        uint24 dynamicFee = _getDynamicFee(volatility, hookData, sender);
        
        // Update state if the fee has changed
        if (dynamicFee != lastFees[poolId]) {
            lastFees[poolId] = dynamicFee;
            lastFeeUpdate[poolId] = block.timestamp;
            emit FeeUpdated(poolId, lastFees[poolId], dynamicFee);
        }

        uint24 feeWithFlag = dynamicFee | LPFeeLibrary.OVERRIDE_FEE_FLAG;
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, feeWithFlag);
    }

    // --- NEW: Helper function to reduce stack depth in _beforeSwap ---
    function _getDynamicFee(
        uint32 volatility,
        bytes calldata hookData,
        address sender
    ) internal view returns (uint24) {
        uint256 reputationScore = 0;
        
        if (hookData.length > 0) {
            (bool success, uint256 score) = verifyReputation(hookData, sender);
            if (success) {
                reputationScore = score;
            }
        }
        
        return uint24(feeCalculator.calculateFee(volatility, reputationScore));
    }
    
    function verifyReputation(
        bytes calldata hookData,
        address sender
    ) internal view returns (bool success, uint256 score) {
        if (reputationSigner == address(0)) return (false, 0);
        
        (uint256 reputationScore, uint256 deadline, bytes memory signature) = 
            abi.decode(hookData, (uint256, uint256, bytes));
        
        if (block.timestamp > deadline) return (false, 0);
        
        bytes32 messageHash = keccak256(abi.encodePacked(sender, reputationScore, deadline));
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);
        
        address signer = ecrecover(prefixedHash, v, r, s);
        
        if (signer == address(0) || signer != reputationSigner) return (false, 0);
        
        return (true, reputationScore);
    }

    function _splitSignature(bytes memory signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(signature.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        if (v < 27) { v += 27; }
    }
}