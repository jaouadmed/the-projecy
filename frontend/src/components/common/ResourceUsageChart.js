import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ResourceUsageChart = ({ data, type }) => {
  // Handle missing data
  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  // Extract usage percentage from data
  let usagePercent = 0;
  if (type === 'cpu' && data.usage) {
    usagePercent = parseFloat(data.usage.replace('%', ''));
  } else if (type === 'memory' && data.percent) {
    usagePercent = parseFloat(data.percent.replace('%', ''));
  }

  // Prepare chart data
  const chartData = {
    labels: ['Used', 'Available'],
    datasets: [
      {
        data: [usagePercent, 100 - usagePercent],
        backgroundColor: [
          type === 'cpu' ? '#3f51b5' : '#f50057',
          '#e0e0e0',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Chart options
  const options = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <Box sx={{ position: 'relative', height: 200, mt: 2 }}>
      <Doughnut data={chartData} options={options} />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="div">
          {usagePercent.toFixed(1)}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {type === 'cpu' ? 'CPU' : 'Memory'}
        </Typography>
      </Box>

      <Box sx={{ mt: 3 }}>
        {type === 'cpu' && data.cores && (
          <Typography variant="body2" color="text.secondary" align="center">
            Cores: {data.cores}
          </Typography>
        )}
        
        {type === 'memory' && data.usage && data.limit && (
          <Typography variant="body2" color="text.secondary" align="center">
            {data.usage} / {data.limit}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ResourceUsageChart;