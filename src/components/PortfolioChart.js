import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const PortfolioChart = ({ portfolioData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!portfolioData || portfolioData.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Extract dates and format them
    const dates = portfolioData.map(entry => new Date(entry.date).toLocaleDateString());
    
    // Get unique symbols across all entries
    const allSymbols = new Set();
    portfolioData.forEach(entry => {
      Object.keys(entry.position_values || {}).forEach(symbol => {
        allSymbols.add(symbol);
      });
    });
    
    const symbols = Array.from(allSymbols);
    
    // Create datasets for stacked area chart
    const datasets = [
      {
        label: 'Cash',
        data: portfolioData.map(entry => entry.cash),
        backgroundColor: 'rgba(0, 0, 255, 0.3)',
        borderColor: 'rgba(0, 0, 255, 0.8)',
        borderWidth: 1,
        fill: true,
        order: symbols.length + 1, // Ensure cash is at the bottom of the stack
      },
      ...symbols.map((symbol, index) => {
        const color = getColorForSymbol(symbol, index);
        return {
          label: symbol,
          data: portfolioData.map(entry => entry.position_values[symbol] || 0),
          backgroundColor: color.background,
          borderColor: color.border,
          borderWidth: 1,
          fill: true,
          order: symbols.length - index, // Stack order
        };
      }),
    ];

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: 'line', // Using line type with fill for stacked area
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
            stacked: true, // This makes it a stacked chart
            title: {
              display: true,
              text: 'Value (CAD)',
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Portfolio History',
            font: {
              size: 18,
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              afterTitle: function(tooltipItems) {
                // Calculate total value for this date point
                const dataIndex = tooltipItems[0].dataIndex;
                const total = portfolioData[dataIndex].total_value;
                return `Total: $${total.toFixed(2)}`;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [portfolioData]);

  // Helper function to generate consistent colors for symbols
  function getColorForSymbol(symbol, index) {
    // Predefined color palette for better visual distinction
    const colorPalette = [
      { bg: 'rgba(255, 99, 132, 0.3)', border: 'rgba(255, 99, 132, 0.8)' },
      { bg: 'rgba(54, 162, 235, 0.3)', border: 'rgba(54, 162, 235, 0.8)' },
      { bg: 'rgba(255, 206, 86, 0.3)', border: 'rgba(255, 206, 86, 0.8)' },
      { bg: 'rgba(75, 192, 192, 0.3)', border: 'rgba(75, 192, 192, 0.8)' },
      { bg: 'rgba(153, 102, 255, 0.3)', border: 'rgba(153, 102, 255, 0.8)' },
      { bg: 'rgba(255, 159, 64, 0.3)', border: 'rgba(255, 159, 64, 0.8)' },
      { bg: 'rgba(199, 199, 199, 0.3)', border: 'rgba(199, 199, 199, 0.8)' },
      { bg: 'rgba(83, 102, 255, 0.3)', border: 'rgba(83, 102, 255, 0.8)' },
    ];
    
    // Use modulo to cycle through colors if we have more symbols than colors
    const colorIndex = index % colorPalette.length;
    return {
      background: colorPalette[colorIndex].bg,
      border: colorPalette[colorIndex].border
    };
  }

  return (
    <div className="chart-container">
      <canvas ref={chartRef} height="400"></canvas>
    </div>
  );
};

export default PortfolioChart;
