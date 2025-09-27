// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title CombinedFeeCalculator
 * @notice Calculates dynamic fees based on both volatility metrics and user reputation.
 */
contract CombinedFeeCalculator {
    // Owner address
    address public owner;

    // Base fee parameters (in 0.01% units, 100 = 1%)
    uint32 public baseFee;
    uint32 public maxFee;
    uint32 public minFee;

    // Volatility response curve parameters
    uint32 public volatilityMultiplier;
    uint32 public volatilityExponent;

    // --- NEW: Reputation Discount Tiers ---
    uint24 public constant HIGH_REP_DISCOUNT = 1500; // 0.15% discount
    uint24 public constant MID_REP_DISCOUNT = 500;   // 0.05% discount

    // Events
    event ParametersUpdated(
        uint32 baseFee,
        uint32 maxFee,
        uint32 minFee,
        uint32 volatilityMultiplier,
        uint32 volatilityExponent
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(
        uint32 _baseFee,
        uint32 _maxFee,
        uint32 _minFee,
        uint32 _volatilityMultiplier,
        uint32 _volatilityExponent
    ) {
        owner = msg.sender;
        baseFee = _baseFee;
        maxFee = _maxFee;
        minFee = _minFee;
        volatilityMultiplier = _volatilityMultiplier;
        volatilityExponent = _volatilityExponent;
    }

    /**
     * @notice Calculate fee based on volatility and reputation score
     * @param volatility Volatility value (as percentage * 100, e.g. 500 = 5%)
     * @param reputationScore The user's reputation score (0-100) // MODIFIED
     * @return Dynamic fee in hundredths of a basis point (e.g. 3000 = 0.3%)
     */
    function calculateFee(
        uint32 volatility,
        uint256 reputationScore // MODIFIED
    ) external view returns (uint32) {
        // --- Part 1: Calculate fee based on volatility (from original contract) ---
        uint32 volatilityFactor;
        if (volatilityExponent == 10) {
            volatilityFactor = volatility;
        } else if (volatilityExponent == 20) {
            volatilityFactor = uint32(
                (uint256(volatility) * uint256(volatility)) / 100
            );
        } else {
            volatilityFactor = volatility;
        }

        uint256 adjustment = (uint256(volatilityFactor) *
            uint256(volatilityMultiplier)) / 1000;
        
        uint256 volatilityBasedFee = baseFee;
        if (adjustment > 0) {
            volatilityBasedFee = baseFee + adjustment;
        }

        // --- Part 2: Calculate discount based on reputation (NEW) ---
        uint24 reputationDiscount = 0;
        if (reputationScore >= 80) {
            reputationDiscount = HIGH_REP_DISCOUNT;
        } else if (reputationScore >= 50) {
            reputationDiscount = MID_REP_DISCOUNT;
        }

        // --- Part 3: Combine and apply safety checks (MODIFIED) ---
        uint256 finalFee;
        // Apply discount, ensuring fee doesn't go below zero
        if (volatilityBasedFee > reputationDiscount) {
            finalFee = volatilityBasedFee - reputationDiscount;
        } else {
            // If discount is larger than the fee, just use the minimum fee
            finalFee = minFee;
        }

        // Ensure final fee is within the global bounds
        if (finalFee < minFee) {
            finalFee = minFee;
        } else if (finalFee > maxFee) {
            finalFee = maxFee;
        }

        return uint32(finalFee);
    }

    /**
     * @notice Update fee calculation parameters
     * @param _baseFee Base fee value
     * @param _maxFee Maximum allowed fee
     * @param _minFee Minimum allowed fee
     * @param _volatilityMultiplier Multiplier for volatility sensitivity
     * @param _volatilityExponent Exponent for volatility response curve (10=linear, 20=quadratic)
     */
    function updateParameters(
        uint32 _baseFee,
        uint32 _maxFee,
        uint32 _minFee,
        uint32 _volatilityMultiplier,
        uint32 _volatilityExponent
    ) external onlyOwner {
        baseFee = _baseFee;
        maxFee = _maxFee;
        minFee = _minFee;
        volatilityMultiplier = _volatilityMultiplier;
        volatilityExponent = _volatilityExponent;

        emit ParametersUpdated(
            _baseFee,
            _maxFee,
            _minFee,
            _volatilityMultiplier,
            _volatilityExponent
        );
    }

    /**
     * @notice Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        owner = newOwner;
    }
}