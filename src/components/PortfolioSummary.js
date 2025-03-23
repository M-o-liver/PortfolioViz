import React from 'react';
import './PortfolioSummary.css';

export default function PortfolioSummary({ stats }) {
  if (!stats) return null;

  return (
    <div className="portfolio-summary">
      <div className="summary-card">
        <h3>Current Value</h3>
        <div className="value">
          ${stats.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className={`change ${stats.totalReturn >= 0 ? 'positive' : 'negative'}`}>
          {stats.totalReturn >= 0 ? '▲' : '▼'} 
          {Math.abs(stats.totalReturn).toFixed(1)}%
        </div>
      </div>

      <div className="summary-card">
        <h3>Cost Basis</h3>
        <div className="value">
          ${stats.totalACB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className="subtext">Total Invested</div>
      </div>

      <div className="summary-card allocation">
        <h3>Asset Allocation</h3>
        <div className="allocation-list">
          {stats.allocation.map(asset => (
            <div key={asset.symbol} className="allocation-item">
              <div className="asset-header">
                <span>{asset.symbol}</span>
                <span>
                  {(asset.value / stats.currentValue * 100).toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(asset.value / stats.currentValue * 100).toFixed(1)}%`,
                    backgroundColor: getColor(asset.symbol)
                  }}
                ></div>
              </div>
              <div className="asset-details">
                <span>Value: ${Math.round(asset.value).toLocaleString()}</span>
                <span>Cost: ${Math.round(asset.acb).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function for consistent colors
const colors = [
  '#0071A7', '#2ECC71', '#E67E22', '#9B59B6', '#34495E',
  '#1ABC9C', '#E74C3C', '#F1C40F', '#95A5A6'
];

const getColor = (symbol) => {
  const hash = Array.from(symbol).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};