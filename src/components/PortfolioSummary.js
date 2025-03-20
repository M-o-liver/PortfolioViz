import React from 'react';
import './PortfolioSummary.css'; // Optional: Add styles for better presentation

const PortfolioSummary = ({ stats }) => {
  return (
    <div className="portfolio-summary">
      <h2>Portfolio Insights</h2>
      
      <div className="summary-grid">
        {/* Current Value */}
        <div className="summary-card">
          <h3>Current Value</h3>
          <p className="summary-value">
            ${stats.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p 
            className="summary-change" 
            style={{ color: stats.totalReturn >= 0 ? 'green' : 'red' }}
          >
            {stats.totalReturn >= 0 ? '↑' : '↓'} {Math.abs(stats.totalReturn).toFixed(2)}%
          </p>
        </div>

        {/* Total Contributions */}
        <div className="summary-card">
          <h3>Total Contributions</h3>
          <p className="summary-value">
            ${stats.totalContributions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="summary-subtext">{stats.contributionCount} deposits</p>
        </div>

        {/* Asset Allocation */}
        <div className="summary-card">
          <h3>Asset Allocation</h3>
          {stats.allocation.map((item) => (
            <div key={item.symbol} className="allocation-item">
              <div className="allocation-label">
                <span>{item.symbol}</span>
                <span>{item.percentage.toFixed(1)}% (${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
              </div>
              <div className="allocation-bar">
                <div 
                  className="allocation-fill" 
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: getColorForSymbol(item.symbol),
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to assign colors to symbols
function getColorForSymbol(symbol) {
  const colorPalette = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#8E44AD', '#27AE60', '#F39C12',
  ];
  
  // Generate a consistent color based on the symbol's hash
  const hash = Array.from(symbol).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPalette[hash % colorPalette.length];
}

export default PortfolioSummary;
