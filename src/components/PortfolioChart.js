import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const PortfolioChart = () => {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/ProcessTransactions');
        const data = await response.json();
        if (!data.portfolio_summary || !data.portfolio_summary.cumulative_portfolio_value || !data.portfolio_summary.dates) {
          throw new Error('Invalid data structure from API');
        }
        setChartData(data.portfolio_summary);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!chartData) {
    return <div>Loading...</div>;
  }

  if (!chartData.cumulative_portfolio_value.length || !chartData.dates.length) {
    return <div>No data available to display.</div>;
  }

  const options = {
    chart: {
      type: 'line',
    },
    title: {
      text: 'Portfolio Performance',
    },
    xAxis: {
      categories: chartData.dates,
      title: {
        text: 'Date',
      },
    },
    yAxis: {
      title: {
        text: 'Portfolio Value (CAD)',
      },
    },
    series: [
      {
        name: 'Portfolio Value',
        data: chartData.cumulative_portfolio_value,
        color: '#0071A7',
      },
    ],
    tooltip: {
      shared: true,
      valueDecimals: 2,
      valuePrefix: '$',
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
};

export default PortfolioChart;