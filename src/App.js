import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import PortfolioChart from './components/PortfolioChart';
import './styles.css';

function App() {
  const [portfolioData, setPortfolioData] = useState(null);

  const handleDataProcessed = (data) => {
    setPortfolioData(data);
  };

  return (
    <div className="app">
      <header>
        <h1>Portfolio Visualizer</h1>
        <p>Track your investment growth over time</p>
      </header>
      
      <main>
        <FileUpload onDataProcessed={handleDataProcessed} />
        
        {portfolioData && (
          <div className="results-container">
            <PortfolioChart portfolioData={portfolioData} />
          </div>
        )}
      </main>
      
      <footer>
        <p>© 2025 Portfolio Visualizer</p>
      </footer>
    </div>
  );
}

export default App;
