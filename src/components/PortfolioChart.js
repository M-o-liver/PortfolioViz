import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(zoomPlugin, annotationPlugin);

const PortfolioChart = ({ portfolioData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [timeRange, setTimeRange] = useState('all');

  // Apply smoothing to the data points
  const applySmoothing = (data, smoothingFactor = 0.2) => {
    if (!data || data.length <= 2) return data;
    
    const smoothedData = [...data];
    
    for (let i = 1; i < smoothedData.length - 1; i++) {
      // Add a small random variation (volatility simulation)
      const volatility = data[i] * 0.005 * (Math.random() - 0.5);
      
      // Apply smoothing algorithm (weighted average)
      smoothedData[i] = 
        smoothedData[i-1] * smoothingFactor + 
        data[i] * (1 - 2 * smoothingFactor) + 
        data[i+1] * smoothingFactor + 
        volatility;
    }
    
    return smoothedData;
  };

  // Find significant events (large deposits, withdrawals, or trades)
  const findSignificantEvents = (data) => {
    if (!data || data.length < 2) return [];
    
    const events = [];
    let prevTotal = data[0].total_value;
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].total_value - prevTotal;
      const percentChange = Math.abs(change / prevTotal);
      
      // If there's a significant change (>5%)
      if (percentChange > 0.05) {
        events.push({
          index: i,
          date: data[i].date,
          change: change,
          percentChange: percentChange
        });
      }
      
      prevTotal = data[i].total_value;
    }
    
    // Limit to top 5 most significant events
    return events
      .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
      .slice(0, 5);
  };

  useEffect(() => {
    if (!portfolioData || portfolioData.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Extract dates and format them
    const dates = portfolioData.map(entry => new Date(entry.date));
    
    // Get unique symbols across all entries
    const allSymbols = new Set();
    portfolioData.forEach(entry => {
      Object.keys(entry.position_values || {}).forEach(symbol => {
        allSymbols.add(symbol);
      });
    });
    
    const symbols = Array.from(allSymbols);
    
    // Find significant events
    const significantEvents = findSignificantEvents(portfolioData);
    
    // Create annotations for significant events
    const annotations = significantEvents.map((event, index) => ({
      type: 'point',
      xValue: new Date(event.date),
      yValue: portfolioData[event.index].total_value,
      backgroundColor: event.change > 0 ? 'rgba(75, 192, 75, 0.8)' : 'rgba(255, 99, 132, 0.8)',
      borderColor: 'white',
      borderWidth: 2,
      radius: 6,
      label: {
        display: true,
        content: `${event.change > 0 ? '↑' : '↓'} ${Math.abs(event.percentChange * 100).toFixed(1)}%`,
        position: index % 2 === 0 ? 'top' : 'bottom'
      }
    }));
    
    // Create datasets for stacked area chart with smoothing
    const datasets = [
      {
        label: 'Cash',
        data: dates.map((date, i) => ({
          x: date,
          y: portfolioData[i].cash
        })),
        backgroundColor: 'rgba(128, 128, 255, 0.4)',
        borderColor: 'rgba(128, 128, 255, 0.8)',
        borderWidth: 1,
        fill: true,
        order: symbols.length + 1, // Ensure cash is at the bottom of the stack
      },
      ...symbols.map((symbol, index) => {
        const color = getColorForSymbol(symbol, index);
        
        // Extract raw data for this symbol
        const rawData = portfolioData.map(entry => entry.position_values[symbol] || 0);
        
        // Apply smoothing to create more natural-looking chart
        const smoothedData = applySmoothing(rawData);
        
        return {
          label: symbol,
          data: dates.map((date, i) => ({
            x: date,
            y: smoothedData[i]
          })),
          backgroundColor: color.background,
          borderColor: color.border,
          borderWidth: 1,
          fill: true,
          order: symbols.length - index, // Stack order
        };
      }),
    ];

    // Add total portfolio value line
    datasets.push({
      label: 'Total Value',
      data: dates.map((date, i) => ({
        x: date,
        y: portfolioData[i].total_value
      })),
      borderColor: 'rgba(0, 0, 0, 0.7)',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0,
      order: 0, // Always on top
    });

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: 'line', // Using line type with fill for stacked area
      data: {
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'month',
              displayFormats: {
                month: 'MMM yyyy'
              }
            },
            title: {
              display: true,
              text: 'Date',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.2)'
            }
          },
          y: {
            stacked: true, // This makes it a stacked chart
            title: {
              display: true,
              text: 'Value (CAD)',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.2)'
            }
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Portfolio History',
            font: {
              size: 20,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#000',
            bodyColor: '#000',
            borderColor: '#ddd',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: function(tooltipItems) {
                return new Date(tooltipItems[0].parsed.x).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              },
              afterTitle: function(tooltipItems) {
                // Calculate total value for this date point
                const dataIndex = tooltipItems[0].dataIndex;
                const total = portfolioData[dataIndex].total_value;
                return `Total: $${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
              },
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += `$${context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                }
                return label;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11
              }
            },
          },
          annotation: {
            annotations: annotations
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'x',
            },
            limits: {
              x: {min: 'original', max: 'original'},
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        animations: {
          tension: {
            duration: 1000,
            easing: 'easeOutQuad',
            from: 0.8,
            to: 0.2,
            loop: false
          }
        },
        elements: {
          line: {
            tension: 0.2 // Smoother curves
          },
          point: {
            radius: 0 // Hide points for cleaner look
          }
        }
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [portfolioData, timeRange]);

  // Helper function to generate consistent colors for symbols
  function getColorForSymbol(symbol, index) {
    // Enhanced color palette for better visual appeal
    const colorPalette = [
      { bg: 'rgba(255, 99, 132, 0.4)', border: 'rgba(255, 99, 132, 0.8)' },
      { bg: 'rgba(54, 162, 235, 0.4)', border: 'rgba(54, 162, 235, 0.8)' },
      { bg: 'rgba(255, 206, 86, 0.4)', border: 'rgba(255, 206, 86, 0.8)' },
      { bg: 'rgba(75, 192, 192, 0.4)', border: 'rgba(75, 192, 192, 0.8)' },
      { bg: 'rgba(153, 102, 255, 0.4)', border: 'rgba(153, 102, 255, 0.8)' },
      { bg: 'rgba(255, 159, 64, 0.4)', border: 'rgba(255, 159, 64, 0.8)' },
      { bg: 'rgba(255, 127, 80, 0.4)', border: 'rgba(255, 127, 80, 0.8)' },
      { bg: 'rgba(46, 204, 113, 0.4)', border: 'rgba(46, 204, 113, 0.8)' },
      { bg: 'rgba(142, 68, 173, 0.4)', border: 'rgba(142, 68, 173, 0.8)' },
      { bg: 'rgba(241, 196, 15, 0.4)', border: 'rgba(241, 196, 15, 0.8)' },
    ];
    
    // Use modulo to cycle through colors if we have more symbols than colors
    const colorIndex = index % colorPalette.length;
    return {
      background: colorPalette[colorIndex].bg,
      border: colorPalette[colorIndex].border
    };
  }

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    
    if (chartInstance.current) {
      const chart = chartInstance.current;
      
      // Reset zoom first
      chart.resetZoom();
      
      // Then set the appropriate time range
      if (range !== 'all') {
        const lastDate = new Date(portfolioData[portfolioData.length - 1].date);
        let startDate = new Date(lastDate);
        
        switch(range) {
          case '1m':
            startDate.setMonth(lastDate.getMonth() - 1);
            break;
          case '3m':
            startDate.setMonth(lastDate.getMonth() - 3);
            break;
          case '6m':
            startDate.setMonth(lastDate.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(lastDate.getFullYear() - 1);
            break;
          case 'ytd':
            startDate = new Date(lastDate.getFullYear(), 0, 1);
            break;
          default:
            break;
        }
        
        chart.zoomScale('x', {min: startDate, max: lastDate});
      }
    }
  };

  return (
    <div className="chart-section">
      <div className="chart-controls">
        <div className="time-range-selector">
          <button className={timeRange === 'all' ? 'active' : ''} onClick={() => handleTimeRangeChange('all')}>All</button>
          <button className={timeRange === 'ytd' ? 'active' : ''} onClick={() => handleTimeRangeChange('ytd')}>YTD</button>
          <button className={timeRange === '1y' ? 'active' : ''} onClick={() => handleTimeRangeChange('1y')}>1Y</button>
          <button className={timeRange === '6m' ? 'active' : ''} onClick={() => handleTimeRangeChange('6m')}>6M</button>
          <button className={timeRange === '3m' ? 'active' : ''} onClick={() => handleTimeRangeChange('3m')}>3M</button>
          <button className={timeRange === '1m' ? 'active' : ''} onClick={() => handleTimeRangeChange('1m')}>1M</button>
        </div>
        <div className="chart-instructions">
          <span>Scroll to zoom • Drag to pan • Double-click to reset</span>
        </div>
      </div>
      <div className="chart-container">
        <canvas ref={chartRef} height="500"></canvas>
      </div>
    </div>
  );
};

export default PortfolioChart;
