// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title ICombinedFeeHook
 * @notice Interface for the combined fee hook's volatility update function
 */
// MODIFIED: Renamed interface for consistency with our main hook
interface ICombinedFeeHook {
    function updateVolatility(bytes32 poolId, uint32 volatility) external;
}

/**
 * @title VolatilityOracle
 * @notice Oracle that bridges off-chain volatility data with the dynamic fee hook
 */
contract VolatilityOracle {
    // Owner and authorized updaters
    address public owner;
    mapping(address => bool) public authorizedUpdaters;

    // The combined fee hook contract
    // MODIFIED: Updated interface type
    ICombinedFeeHook public feeHook;

    // Mapping of pool ID to last reported volatility
    mapping(bytes32 => uint32) public lastVolatility;
    mapping(bytes32 => uint256) public lastUpdateTime;

    // Events
    event VolatilityUpdated(bytes32 indexed poolId, uint32 volatility);
    event UpdaterAdded(address indexed updater);
    event UpdaterRemoved(address indexed updater);
    event FeeHookUpdated(address indexed newFeeHook);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedUpdaters[msg.sender],
            "Not authorized"
        );
        _;
    }

    // MODIFIED: Constructor is more flexible, allowing hook to be set later
    constructor(address _initialFeeHook) {
        owner = msg.sender;
        if (_initialFeeHook != address(0)) {
            feeHook = ICombinedFeeHook(_initialFeeHook);
        }
    }

    /**
     * @notice Update the fee hook address
     * @param _newFeeHook New fee hook address
     */
    function setFeeHook(address _newFeeHook) external onlyOwner {
        require(_newFeeHook != address(0), "Cannot set hook to zero address");
        feeHook = ICombinedFeeHook(_newFeeHook);
        emit FeeHookUpdated(_newFeeHook);
    }

    /**
     * @notice Add an authorized updater
     * @param updater Address to authorize
     */
    function addUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
        emit UpdaterAdded(updater);
    }

    /**
     * @notice Remove an authorized updater
     * @param updater Address to remove
     */
    function removeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterRemoved(updater);
    }

    /**
     * @notice Update volatility for a pool
     * @param poolId Pool identifier
     * @param volatility Volatility value
     */
    // MODIFIED: Removed unnecessary 'returns (bool)'
    function updateVolatility(
        bytes32 poolId,
        uint32 volatility
    ) external onlyAuthorized {
        // MODIFIED: Added safety check
        require(address(feeHook) != address(0), "Fee hook not set");

        lastVolatility[poolId] = volatility;
        lastUpdateTime[poolId] = block.timestamp;

        // Forward to the fee hook
        feeHook.updateVolatility(poolId, volatility);

        emit VolatilityUpdated(poolId, volatility);
    }

    /**
     * @notice Emergency volatility update (bypass timing constraints)
     * @param poolId Pool identifier
     * @param volatility Volatility value
     */
    function emergencyUpdate(
        bytes32 poolId,
        uint32 volatility
    ) external onlyOwner {
        require(address(feeHook) != address(0), "Fee hook not set");
        
        lastVolatility[poolId] = volatility;
        lastUpdateTime[poolId] = block.timestamp;

        feeHook.updateVolatility(poolId, volatility);

        emit VolatilityUpdated(poolId, volatility);
    }

    /**
     * @notice Get the last reported volatility for a pool
     * @param poolId Pool identifier
     * @return Volatility value and timestamp
     */
    function getVolatility(
        bytes32 poolId
    ) external view returns (uint32, uint256) {
        return (lastVolatility[poolId], lastUpdateTime[poolId]);
    }
}