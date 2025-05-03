import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const DeploymentStatusCard = ({ status, type, lastUpdated }) => {
  // Define status configurations
  const statusConfig = {
    running: {
      icon: <CheckCircleIcon fontSize="large" />,
      color: 'success.main',
      label: 'Running',
      description: 'The deployment is running normally'
    },
    stopped: {
      icon: <PauseCircleFilledIcon fontSize="large" />,
      color: 'warning.main',
      label: 'Stopped',
      description: 'The deployment is currently stopped'
    },
    pending: {
      icon: <HourglassEmptyIcon fontSize="large" />,
      color: 'info.main',
      label: 'Pending',
      description: 'The deployment is being created'
    },
    failed: {
      icon: <ErrorIcon fontSize="large" />,
      color: 'error.main',
      label: 'Failed',
      description: 'The deployment has encountered an error'
    },
    unknown: {
      icon: <ErrorIcon fontSize="large" />,
      color: 'text.secondary',
      label: 'Unknown',
      description: 'Unable to determine deployment status'
    }
  };

  // Use the status or default to unknown if not provided
  const currentStatus = status && statusConfig[status] ? statusConfig[status] : statusConfig.unknown;
  
  // Format the last updated date
  const formattedDate = lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Deployment Status
        </Typography>
        
        <Box display="flex" alignItems="center" mb={2}>
          <Box color={currentStatus.color} mr={2}>
            {currentStatus.icon}
          </Box>
          <Box>
            <Chip 
              label={currentStatus.label} 
              color={currentStatus.color.split('.')[0]} 
              variant="outlined" 
              size="small"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {currentStatus.description}
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary">
            Type: {type.charAt(0).toUpperCase() + type.slice(1)}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            Last Updated: {formattedDate}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DeploymentStatusCard;