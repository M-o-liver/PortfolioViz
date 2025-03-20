import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const PortfolioChart = ({ portfolioData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!portfolioData || portfolioData.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    const dates = portfolioData.map(entry => new Date(entry.date).toLocaleDateString());
    
    const symbols = Object.keys(portfolioData[0].position_values || {})
      .filter(symbol => symbol !== 'cash');
    
    const datasets = [
      {
        label: 'Cash',
        data: portfolioData.map(entry => entry.cash),
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        borderColor: 'blue',
        fill: true,
      },
      ...symbols.map(symbol => ({
        label: symbol,
        data: portfolioData.map(entry => entry.position_values[symbol] || 0),
        backgroundColor: getRandomColor(0.1),
        borderColor: getRandomColor(),
        fill: true,
      })),
    ];

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Value (CAD)',
            },
            stacked: true,
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Portfolio History',
            font: { size: 18 },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [portfolioData]);

  function getRandomColor(alpha = 1) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
    <div className="chart-container">
      <canvas ref={chartRef} height="400"></canvas>
    </div>
  );
};

export default PortfolioChart;
