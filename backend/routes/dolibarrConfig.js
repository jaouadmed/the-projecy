const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Models
const Deployment = require('../models/deployment');
const DolibarrConfig = require('../models/DolibarrConfig');

/**
 * @route   GET /api/deployments/:id/config/dolibarr
 * @desc    Get Dolibarr configuration for a deployment
 * @access  Private
 */
router.get('/:id/config/dolibarr', auth, async (req, res) => {
  try {
    // Check if deployment exists and belongs to user
    const deployment = await Deployment.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'dolibarr'
    });

    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found or not a Dolibarr deployment' });
    }

    // Get configuration or return default if not exists
    let config = await DolibarrConfig.findOne({ deployment: req.params.id });
    
    if (!config) {
      // Return default configuration
      return res.json({
        siteName: deployment.name || 'Dolibarr ERP & CRM',
        adminEmail: req.user.email,
        defaultLanguage: 'en_US',
        dbPrefix: 'llx_',
        enableMaintenanceMode: false,
        enabledModules: {
          accounting: true,
          invoicing: true,
          crm: true,
          hrm: false,
          projects: true,
          ecommerce: false,
          pos: false
        },
        forceHttps: true,
        sessionTimeout: 60,
        maxLoginAttempts: 5
      });
    }

    res.json(config);
  } catch (err) {
    console.error('Error fetching Dolibarr config:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/deployments/:id/config/dolibarr
 * @desc    Update Dolibarr configuration for a deployment
 * @access  Private
 */
router.put('/:id/config/dolibarr', [
  auth,
  [
    check('siteName', 'Site name is required').not().isEmpty(),
    check('adminEmail', 'Valid email is required').isEmail(),
    check('defaultLanguage', 'Default language is required').not().isEmpty(),
    check('dbPrefix', 'Database prefix is required').not().isEmpty(),
    check('sessionTimeout', 'Session timeout must be a number').isNumeric(),
    check('maxLoginAttempts', 'Max login attempts must be a number').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if deployment exists and belongs to user
    const deployment = await Deployment.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'dolibarr'
    });

    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found or not a Dolibarr deployment' });
    }

    // Extract configuration from request body
    const {
      siteName,
      adminEmail,
      defaultLanguage,
      dbPrefix,
      enableMaintenanceMode,
      enabledModules,
      forceHttps,
      sessionTimeout,
      maxLoginAttempts
    } = req.body;

    // Find and update configuration, or create if not exists
    let config = await DolibarrConfig.findOne({ deployment: req.params.id });
    
    if (config) {
      // Update existing config
      config = await DolibarrConfig.findOneAndUpdate(
        { deployment: req.params.id },
        {
          siteName,
          adminEmail,
          defaultLanguage,
          dbPrefix,
          enableMaintenanceMode,
          enabledModules,
          forceHttps,
          sessionTimeout,
          maxLoginAttempts,
          updatedAt: Date.now()
        },
        { new: true }
      );
    } else {
      // Create new config
      config = new DolibarrConfig({
        deployment: req.params.id,
        siteName,
        adminEmail,
        defaultLanguage,
        dbPrefix,
        enableMaintenanceMode,
        enabledModules,
        forceHttps,
        sessionTimeout,
        maxLoginAttempts
      });

      await config.save();
    }

    // Apply configuration changes to the actual deployment
    // This would involve updating the Dolibarr configuration files
    // through a deployment service or container management
    
    // For MVP, we'll just log that we would apply these changes
    console.log(`Applying Dolibarr configuration changes to deployment ${req.params.id}`);
    
    // In a real implementation, we would call a service to update the configuration
    // await deploymentService.updateDolibarrConfig(deployment._id, config);

    res.json(config);
  } catch (err) {
    console.error('Error updating Dolibarr config:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/deployments/:id/db-optimize
 * @desc    Optimize Dolibarr database
 * @access  Private
 */
router.post('/:id/db-optimize', auth, async (req, res) => {
  try {
    // Check if deployment exists and belongs to user
    const deployment = await Deployment.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'dolibarr'
    });

    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found or not a Dolibarr deployment' });
    }

    // Check if deployment is running
    if (deployment.status !== 'running') {
      return res.status(400).json({ message: 'Deployment must be running to optimize database' });
    }

    // In a real implementation, we would call a service to optimize the database
    // await deploymentService.optimizeDolibarrDatabase(deployment._id);
    
    // For MVP, we'll just log and simulate success
    console.log(`Optimizing database for Dolibarr deployment ${req.params.id}`);
    
    // Simulate a delay for the operation
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.json({ message: 'Database optimization completed successfully' });
  } catch (err) {
    console.error('Error optimizing Dolibarr database:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/deployments/:id/update-dolibarr
 * @desc    Update Dolibarr to latest version
 * @access  Private
 */
router.post('/:id/update-dolibarr', auth, async (req, res) => {
  try {
    // Check if deployment exists and belongs to user
    const deployment = await Deployment.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'dolibarr'
    });

    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found or not a Dolibarr deployment' });
    }

    // Check if deployment is running
    if (deployment.status !== 'running') {
      return res.status(400).json({ message: 'Deployment must be running to update Dolibarr' });
    }

    // In a real implementation, we would call a service to update Dolibarr
    // await deploymentService.updateDolibarrVersion(deployment._id);
    
    // For MVP, we'll just log and simulate success
    console.log(`Updating Dolibarr to latest version for deployment ${req.params.id}`);
    
    // Simulate a delay for the operation
    await new Promise(resolve => setTimeout(resolve, 3000));

    res.json({ message: 'Dolibarr update completed successfully' });
  } catch (err) {
    console.error('Error updating Dolibarr:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;