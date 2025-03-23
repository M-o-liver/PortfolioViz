import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function PortfolioChart({ dates, acb, market }) {
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !dates) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#fff' },
        textColor: '#333',
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
    });

    // ACB Series (Cost Basis)
    const acbSeries = chart.addAreaSeries({
      topColor: 'rgba(100, 100, 100, 0.3)',
      bottomColor: 'rgba(100, 100, 100, 0.05)',
      lineColor: 'rgba(100, 100, 100, 0.8)',
      lineWidth: 1,
    });

    // Market Value Series
    const marketSeries = chart.addAreaSeries({
      topColor: 'rgba(0, 113, 167, 0.4)',
      bottomColor: 'rgba(0, 113, 167, 0.05)',
      lineColor: '#0071A7',
      lineWidth: 2,
    });

    // Format data
    const chartData = dates.map((date, i) => ({
      time: date,
      value: market[i],
      acb: acb[i],
    }));

    marketSeries.setData(chartData.map(d => ({ time: d.time, value: d.value })));
    acbSeries.setData(chartData.map(d => ({ time: d.time, value: d.acb })));

    // Handle resizing
    const resizeObserver = new ResizeObserver(entries => {
      chart.resize(entries[0].contentRect.width, 500);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      chart.remove();
      resizeObserver.disconnect();
    };
  }, [dates, acb, market]);

  return <div ref={containerRef} style={{ width: '100%', height: '500px' }} />;
}