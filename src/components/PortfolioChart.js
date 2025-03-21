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
        if (!data.cumulative_portfolio_value || !data.dates) {
          throw new Error('Invalid data structure from API');
        }
        setChartData(data);
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

  const options = {
    title: {
      text: 'Portfolio Performance',
    },
    xAxis: {
      categories: chartData.dates,
    },
    yAxis: {
      title: {
        text: 'Portfolio Value',
      },
    },
    series: [
      {
        name: 'Portfolio Value',
        data: chartData.cumulative_portfolio_value,
        type: 'line',
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default PortfolioChart;