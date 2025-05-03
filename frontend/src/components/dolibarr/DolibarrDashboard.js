import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

// Import charts and monitoring components
import DeploymentStatusCard from '../common/DeploymentStatusCard';
import ResourceUsageChart from '../common/ResourceUsageChart';
import DeploymentActions from '../common/DeploymentActions';
import DolibarrConfigForm from './DolibarrConfigForm';

const DolibarrDashboard = ({ deploymentId }) => {
  const [deployment, setDeployment] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Fetch deployment data
  const fetchDeployment = async () => {
    try {
      const response = await axios.get(`/api/deployments/${deploymentId}`);
      setDeployment(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load deployment data');
      console.error(err);
    }
  };

  // Fetch monitoring data
  const fetchMonitoring = async () => {
    try {
      const response = await axios.get(`/api/deployments/${deploymentId}/monitoring`);
      setMonitoring(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load monitoring data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDeployment();
    fetchMonitoring();

    // Set up polling for monitoring data
    const interval = setInterval(() => {
      fetchMonitoring();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [deploymentId, refreshInterval]);

  if (loading && !deployment && !monitoring) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Typography variant="h4" gutterBottom>
        Dolibarr Dashboard
      </Typography>
      
      {deployment && (
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {deployment.name} - {deployment.deploymentInfo?.url || 'URL not available'}
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Status Card */}
        <Grid item xs={12} md={4}>
          <DeploymentStatusCard 
            status={deployment?.status} 
            type="dolibarr"
            lastUpdated={deployment?.updatedAt}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <DeploymentActions 
            deploymentId={deploymentId}
            status={deployment?.status}
            type="dolibarr"
            onActionComplete={fetchDeployment}
            onConfigOpen={() => setConfigDialogOpen(true)}
          />
        </Grid>

        {/* Resource Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>CPU Usage</Typography>
              {monitoring?.containerStats ? (
                <ResourceUsageChart 
                  data={monitoring.containerStats.cpu}
                  type="cpu"
                />
              ) : (
                <Typography color="text.secondary">No CPU data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Memory Usage</Typography>
              {monitoring?.containerStats ? (
                <ResourceUsageChart 
                  data={monitoring.containerStats.memory}
                  type="memory"
                />
              ) : (
                <Typography color="text.secondary">No memory data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Database Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Database</Typography>
              {monitoring?.dbSize ? (
                <Box>
                  <Typography variant="body1">
                    Size: {monitoring.dbSize.size}
                  </Typography>
                  <Typography variant="body1">
                    Tables: {monitoring.dbSize.tables}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">No database info available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Health Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Application Health</Typography>
              {monitoring?.healthStatus ? (
                <Box>
                  <Typography variant="body1" color={
                    monitoring.healthStatus.status === 'healthy' ? 'success.main' : 
                    monitoring.healthStatus.status === 'unhealthy' ? 'warning.main' : 'error.main'
                  }>
                    Status: {monitoring.healthStatus.status}
                  </Typography>
                  {monitoring.healthStatus.responseTime && (
                    <Typography variant="body1">
                      Response Time: {monitoring.healthStatus.responseTime}ms
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary">No health data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => {
            setLoading(true);
            fetchDeployment();
            fetchMonitoring();
          }}
        >
          Refresh Data
        </Button>
      </Box>
      
      {/* Dolibarr Configuration Dialog */}
      <DolibarrConfigForm 
        open={configDialogOpen}
        onClose={() => {
          setConfigDialogOpen(false);
          fetchDeployment(); // Refresh data after config changes
        }}
        deploymentId={deploymentId}
      />
    </Box>
  );
};

export default DolibarrDashboard;