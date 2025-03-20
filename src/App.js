import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import PortfolioChart from './components/PortfolioChart';
import PortfolioSummary from './components/PortfolioSummary';
import './styles.css';

function App() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [portfolioStats, setPortfolioStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDataProcessed = (data, stats) => {
    setPortfolioData(data);
    setPortfolioStats(stats);
    setIsLoading(false);
  };

  const handleProcessingStart = () => {
    setIsLoading(true);
  };

  return (
    <div className="app">
      <header>
        <h1>Portfolio Visualizer</h1>
        <p>Track your investment growth over time</p>
      </header>
      
      <main>
        <FileUpload 
          onDataProcessed={handleDataProcessed} 
          onProcessingStart={handleProcessingStart}
        />
        
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing your portfolio data...</p>
          </div>
        )}
        
        {portfolioData && portfolioStats && (
          <div className="results-container">
            <PortfolioSummary stats={portfolioStats} />
            <PortfolioChart portfolioData={portfolioData} />
          </div>
        )}
      </main>
      
      <footer>
        <p>© 2025 Portfolio Visualizer | <a href="#">Terms</a> | <a href="#">Privacy</a></p>
      </footer>
    </div>
  );
}

export default App;
