import React from 'react';

const PortfolioSummary = ({ stats }) => {
  return (
    <div className="portfolio-summary">
      <h2>Portfolio Insights</h2>
      <div className="summary-grid">
        {/* Current Value */}
        <div className="summary-card">
          <h3>Current Value</h3>
          <p className="summary-value">
            ${stats.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            ${stats.totalContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="summary-subtext">{stats.contributionCount} deposits</p>
        </div>

        {/* Asset Allocation */}
        <div className="summary-card">
          <h3>Asset Allocation</h3>
          <div className="allocation-bars">
            {stats.allocation.map((item) => (
              <div key={item.symbol} className="allocation-item">
                <div className="allocation-label">
                  <span>{item.symbol}</span>
                  <span>{item.percentage.toFixed(1)}%</span>
                </div>
                <div className="allocation-bar">
                  <div
                    className="allocation-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dividends Earned */}
        <div className="summary-card">
          <h3>Total Dividends</h3>
          <p className="summary-value">
            ${stats.totalDividends.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="summary-subtext">From {stats.dividendCount} payments</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
