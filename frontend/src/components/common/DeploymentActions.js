import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, CircularProgress, Snackbar, Alert, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BackupIcon from '@mui/icons-material/Backup';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import UpdateIcon from '@mui/icons-material/Update';
import axios from 'axios';

const DeploymentActions = ({ deploymentId, status, type, onActionComplete, onConfigOpen }) => {
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Handle deployment actions
  const handleAction = async (action) => {
    setLoading(true);
    setCurrentAction(action);
    
    try {
      await axios.post(`/api/deployments/${deploymentId}/${action}`);
      setSnackbar({
        open: true,
        message: `Deployment ${action} successful`,
        severity: 'success'
      });
      
      // Refresh deployment data
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error(`Error during ${action} action:`, error);
      setSnackbar({
        open: true,
        message: `Failed to ${action} deployment: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Deployment Actions
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={() => handleAction('start')}
            disabled={loading || status === 'running'}
          >
            {currentAction === 'start' && loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Start'
            )}
          </Button>
          
          <Button
            variant="contained"
            color="warning"
            startIcon={<StopIcon />}
            onClick={() => handleAction('stop')}
            disabled={loading || status === 'stopped'}
          >
            {currentAction === 'stop' && loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Stop'
            )}
          </Button>
          
          <Button
            variant="contained"
            color="info"
            startIcon={<RestartAltIcon />}
            onClick={() => handleAction('restart')}
            disabled={loading || status === 'stopped'}
          >
            {currentAction === 'restart' && loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Restart'
            )}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={() => handleAction('backup')}
            disabled={loading}
          >
            {currentAction === 'backup' && loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Backup'
            )}
          </Button>
        </Box>
        
        {type === 'dolibarr' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Dolibarr Specific Actions
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<StorageIcon />}
                onClick={() => handleAction('db-optimize')}
                disabled={loading || status !== 'running'}
              >
                {currentAction === 'db-optimize' && loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Optimize DB'
                )}
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<UpdateIcon />}
                onClick={() => handleAction('update-dolibarr')}
                disabled={loading || status !== 'running'}
              >
                {currentAction === 'update-dolibarr' && loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Update Dolibarr'
                )}
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={onConfigOpen}
                disabled={loading}
              >
                Configure
              </Button>
            </Box>
          </>
        )}
        
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            * Start/Stop actions may take a few moments to complete
          </Typography>
        </Box>
      </CardContent>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default DeploymentActions;