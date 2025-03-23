import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import PortfolioChart from './components/PortfolioChart';
import PortfolioSummary from './components/PortfolioSummary';
import './styles.css';

function App() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDataProcessed = (data) => {
    const stats = calculatePortfolioStats(data);
    setPortfolioData({ ...data, stats });
    setIsLoading(false);
  };

  const calculatePortfolioStats = (data) => {
    if (!data) return null;
    
    const lastIdx = data.dates.length - 1;
    const currentValue = data.market_values[lastIdx];
    const totalACB = data.acb_values[lastIdx];
    
    // Calculate allocation
    const positions = data.positions[lastIdx];
    const totalValue = currentValue;
    const allocation = Object.entries(positions).map(([symbol, pos]) => ({
      symbol,
      value: pos.quantity * (currentValue - totalACB)/totalACB + pos.acb,
      acb: pos.acb,
      quantity: pos.quantity
    }));

    return {
      currentValue,
      totalReturn: ((currentValue - totalACB) / totalACB * 100),
      totalACB,
      allocation
    };
  };

  return (
    <div className="app">
      <header>
        <h1>Portfolio Visualizer</h1>
        <p>Track your investment performance</p>
      </header>

      <main>
        <FileUpload 
          onProcessed={handleDataProcessed}
          onProcessingStart={() => setIsLoading(true)}
        />

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing portfolio data...</p>
          </div>
        )}

        {portfolioData && (
          <div className="results">
            <PortfolioSummary stats={portfolioData.stats} />
            <PortfolioChart 
              dates={portfolioData.dates}
              acb={portfolioData.acb_values}
              market={portfolioData.market_values}
            />
          </div>
        )}
      </main> {/* Added closing tag here */}

      <footer>
        <p>© 2025 Portfolio Visualizer | <a href="#">Terms</a> | <a href="#">Privacy</a></p>
      </footer>
    </div>
  );
}