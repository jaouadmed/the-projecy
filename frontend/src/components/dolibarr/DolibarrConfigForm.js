import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import axios from 'axios';

const DolibarrConfigForm = ({ open, onClose, deploymentId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [config, setConfig] = useState({
    // General settings
    siteName: '',
    adminEmail: '',
    defaultLanguage: 'en_US',
    
    // Database settings
    dbPrefix: 'llx_',
    enableMaintenanceMode: false,
    
    // Module settings
    enabledModules: {
      accounting: true,
      invoicing: true,
      crm: true,
      hrm: false,
      projects: true,
      ecommerce: false,
      pos: false
    },
    
    // Security settings
    forceHttps: true,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5
  });
  
  // Fetch current configuration
  useEffect(() => {
    if (open && deploymentId) {
      fetchConfig();
    }
  }, [open, deploymentId]);
  
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/deployments/${deploymentId}/config/dolibarr`);
      setConfig(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load configuration: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value
    });
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setConfig({
      ...config,
      [name]: checked
    });
  };
  
  const handleModuleChange = (module) => (e) => {
    setConfig({
      ...config,
      enabledModules: {
        ...config.enabledModules,
        [module]: e.target.checked
      }
    });
  };
  
  const handleSubmit = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      await axios.put(`/api/deployments/${deploymentId}/config/dolibarr`, config);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Failed to save configuration: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={!saving ? onClose : undefined} maxWidth="md" fullWidth>
      <DialogTitle>Dolibarr Configuration</DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Configuration saved successfully!</Alert>}
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* General Settings */}
              <Grid item xs={12}>
                <Typography variant="h6">General Settings</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Site Name"
                  name="siteName"
                  value={config.siteName}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Admin Email"
                  name="adminEmail"
                  value={config.adminEmail}
                  onChange={handleChange}
                  variant="outlined"
                  type="email"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Default Language</InputLabel>
                  <Select
                    name="defaultLanguage"
                    value={config.defaultLanguage}
                    onChange={handleChange}
                    label="Default Language"
                  >
                    <MenuItem value="en_US">English (US)</MenuItem>
                    <MenuItem value="fr_FR">French</MenuItem>
                    <MenuItem value="es_ES">Spanish</MenuItem>
                    <MenuItem value="de_DE">German</MenuItem>
                    <MenuItem value="it_IT">Italian</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Database Settings */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">Database Settings</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Database Prefix"
                  name="dbPrefix"
                  value={config.dbPrefix}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="Prefix for database tables (e.g., llx_)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableMaintenanceMode}
                      onChange={handleSwitchChange}
                      name="enableMaintenanceMode"
                      color="primary"
                    />
                  }
                  label="Enable Maintenance Mode"
                />
              </Grid>
              
              {/* Module Settings */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">Module Settings</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Enable or disable Dolibarr modules
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabledModules.accounting}
                          onChange={handleModuleChange('accounting')}
                          color="primary"
                        />
                      }
                      label="Accounting"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabledModules.invoicing}
                          onChange={handleModuleChange('invoicing')}
                          color="primary"
                        />
                      }
                      label="Invoicing"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabledModules.crm}
                          onChange={handleModuleChange('crm')}
                          color="primary"
                        />
                      }
                      label="CRM"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabledModules.hrm}
                          onChange={handleModuleChange('hrm')}
                          color="primary"
                        />
                      }
                      label="HR Management"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabledModules.projects}
                          onChange={handleModuleChange('projects')}
                          color="primary"
                        />
                      }
                      label="Projects"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabledModules.ecommerce}
                          onChange={handleModuleChange('ecommerce')}
                          color="primary"
                        />
                      }
                      label="E-Commerce"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabledModules.pos}
                          onChange={handleModuleChange('pos')}
                          color="primary"
                        />
                      }
                      label="Point of Sale"
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              {/* Security Settings */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">Security Settings</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.forceHttps}
                      onChange={handleSwitchChange}
                      name="forceHttps"
                      color="primary"
                    />
                  }
                  label="Force HTTPS"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  type="number"
                  value={config.sessionTimeout}
                  onChange={handleChange}
                  variant="outlined"
                  InputProps={{ inputProps: { min: 5, max: 1440 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  name="maxLoginAttempts"
                  type="number"
                  value={config.maxLoginAttempts}
                  onChange={handleChange}
                  variant="outlined"
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={loading || saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DolibarrConfigForm;