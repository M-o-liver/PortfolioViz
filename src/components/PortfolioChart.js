import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const PortfolioChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/ProcessTransactions');
      const data = await response.json();
      setChartData(data);
    };

    fetchData();
  }, []);

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