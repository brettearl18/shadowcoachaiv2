'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { TrendData } from '@/services/analyticsService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressChartProps {
  data: TrendData;
  title: string;
  height?: number;
}

const defaultOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          const dataset = context.dataset;
          const value = context.parsed.y;
          const trend = (dataset as any).trend;
          
          let label = dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (value !== null) {
            label += value.toFixed(1);
          }
          if (trend !== undefined) {
            label += ` (${trend >= 0 ? '+' : ''}${trend.toFixed(1)}% trend)`;
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => value.toString()
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
};

export function ProgressChart({ data, title, height = 300 }: ProgressChartProps) {
  const options: ChartOptions<'line'> = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        display: true,
        text: title
      }
    }
  };

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.5)`,
      tension: 0.4,
      fill: false
    }))
  };

  return (
    <div style={{ height: height }}>
      <Line options={options} data={chartData} />
    </div>
  );
} 