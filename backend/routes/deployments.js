const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dockerode = require('dockerode');
const docker = new dockerode();

// Deployment controller functions
const deploymentController = require('../controllers/deploymentController');

// Get all deployments
router.get('/', deploymentController.getAllDeployments);

// Get a specific deployment
router.get('/:id', deploymentController.getDeploymentById);

// Create a new deployment
router.post('/', deploymentController.createDeployment);

// Update a deployment
router.put('/:id', deploymentController.updateDeployment);

// Delete a deployment
router.delete('/:id', deploymentController.deleteDeployment);

// Start a deployment
router.post('/:id/start', deploymentController.startDeployment);

// Stop a deployment
router.post('/:id/stop', deploymentController.stopDeployment);

// Restart a deployment
router.post('/:id/restart', deploymentController.restartDeployment);

// Get deployment logs
router.get('/:id/logs', deploymentController.getDeploymentLogs);

// Get deployment status
router.get('/:id/status', deploymentController.getDeploymentStatus);

// Get deployment monitoring data
router.get('/:id/monitoring', deploymentController.getDeploymentMonitoring);

// Backup a deployment
router.post('/:id/backup', deploymentController.backupDeployment);

// Restore a deployment from backup
router.post('/:id/restore', deploymentController.restoreDeployment);

// Deploy Odoo instance
router.post('/odoo', async (req, res) => {
  try {
    const { instanceName, dbUser, dbPassword, dbName, adminPassword, hostPort } = req.body;
    
    // Validate required fields
    if (!instanceName || !dbUser || !dbPassword || !dbName || !adminPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create deployment directory
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', instanceName);
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    // Copy docker-compose template
    const templatePath = path.join(__dirname, '../../infrastructure/docker/odoo/docker-compose.template.yml');
    const destPath = path.join(deploymentDir, 'docker-compose.yml');
    fs.copyFileSync(templatePath, destPath);
    
    // Create .env file with configuration
    const envContent = `
      INSTANCE_NAME=${instanceName}
      DB_USER=${dbUser}
      DB_PASSWORD=${dbPassword}
      DB_NAME=${dbName}
      ADMIN_PASSWORD=${adminPassword}
      HOST_PORT=${hostPort || 8069}
      PROXY_MODE=True
      WORKERS=4
      LIST_DB=False
      WITHOUT_DEMO=True
    `;
    fs.writeFileSync(path.join(deploymentDir, '.env'), envContent.trim());
    
    // Deploy using docker-compose
    const dockerCompose = spawn('docker-compose', ['up', '-d'], { cwd: deploymentDir });
    
    dockerCompose.on('close', (code) => {
      if (code === 0) {
        res.status(201).json({
          message: 'Odoo deployment created successfully',
          instanceName,
          deploymentDir,
          status: 'running'
        });
      } else {
        res.status(500).json({ message: 'Failed to deploy Odoo instance' });
      }
    });
    
    dockerCompose.stderr.on('data', (data) => {
      console.error(`Docker Compose Error: ${data}`);
    });
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;