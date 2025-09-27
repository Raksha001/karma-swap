import React from 'react';
import { useReputation } from '../../hooks/useReputationHook';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ReputationDisplayProps {
  variant?: 'full' | 'compact' | 'minimal';
  showRefreshButton?: boolean;
  className?: string;
}

const ReputationDisplay: React.FC<ReputationDisplayProps> = ({ 
  variant = 'full', 
  showRefreshButton = true,
  className = ''
}) => {
  const {
    reputationScore,
    isCalculating,
    lastUpdated,
    error,
    isStale,
    refreshReputation,
    clearError,
    getReputationLabel,
    getReputationColor
  } = useReputation();

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          button: 'hover:bg-green-50'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          button: 'hover:bg-yellow-50'
        };
      case 'orange':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200',
          button: 'hover:bg-orange-50'
        };
      case 'red':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          button: 'hover:bg-red-50'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          button: 'hover:bg-gray-50'
        };
    }
  };

  const colorClasses = getColorClasses(getReputationColor());

  if (variant === 'minimal') {
    if (reputationScore === null && !isCalculating) return null;
    
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {isCalculating ? (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Calculating...</span>
          </div>
        ) : (
          <div className={`px-2 py-1 rounded text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}>
            {reputationScore}/100
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 p-2 rounded-lg border ${colorClasses.bg} ${colorClasses.border} ${className}`}>
        <div className="flex items-center gap-2">
          
          
          <div className="flex flex-col">
            {isCalculating ? (
            <RefreshCw className="w-4 h-4 animate-spin text-gray-600" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle className={`w-4 h-4 ${colorClasses.text}`} />
          )}
            <span className={`text-sm font-medium ${colorClasses.text}`}>
              {isCalculating ? 'Calculating...' : error ? 'Error' : ` Reputation score - ${reputationScore}`}
            </span>
            {/* {!isCalculating && !error && (
              <span className="text-xs text-gray-600">
                {getReputationLabel()}
                {isStale && ' (Stale)'}
              </span>
            )} */}
          </div>
        </div>
        
        {/* {showRefreshButton && !isCalculating && (
          <button
            onClick={refreshReputation}
            className={`p-1 rounded transition-colors ${colorClasses.button}`}
            title="Refresh reputation"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )} */}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`p-4 rounded-lg border ${colorClasses.bg} ${colorClasses.border} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-lg font-semibold ${colorClasses.text}`}>
          Wallet Reputation
        </h3>
        
        {showRefreshButton && (
          <button
            onClick={refreshReputation}
            disabled={isCalculating}
            className={`p-2 rounded transition-colors ${colorClasses.button} disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Refresh reputation"
          >
            <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {error ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Failed to calculate reputation</span>
          </div>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={clearError}
            className="text-xs text-red-600 underline hover:no-underline"
          >
            Clear error
          </button>
        </div>
      ) : isCalculating ? (
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing on-chain behavior...</span>
        </div>
      ) : reputationScore !== null ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-bold ${colorClasses.text}`}>
              {reputationScore}
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${colorClasses.text}`}>
                {getReputationLabel()}
              </span>
              <span className="text-xs text-gray-600">
                Out of 100
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                getReputationColor() === 'green' ? 'bg-green-500' :
                getReputationColor() === 'yellow' ? 'bg-yellow-500' :
                getReputationColor() === 'orange' ? 'bg-orange-500' :
                getReputationColor() === 'red' ? 'bg-red-500' : 'bg-gray-500'
              }`}
              style={{ width: `${reputationScore}%` }}
            />
          </div>
          
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                Updated: {lastUpdated.toLocaleString()}
                {isStale && ' (Stale)'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          Connect your wallet to see reputation score
        </div>
      )}
    </div>
  );
};

export default ReputationDisplay;