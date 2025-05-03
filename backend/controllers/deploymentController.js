const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dockerode = require('dockerode');
const docker = new dockerode();

// Import deployment model (to be created)
const Deployment = require('../models/deployment');

// Get all deployments
exports.getAllDeployments = async (req, res) => {
  try {
    const deployments = await Deployment.find();
    res.status(200).json(deployments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific deployment by ID
exports.getDeploymentById = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    res.status(200).json(deployment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new deployment
exports.createDeployment = async (req, res) => {
  try {
    const { type, name, config } = req.body;
    
    // Validate required fields
    if (!type || !name || !config) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create new deployment record
    const deployment = new Deployment({
      type,
      name,
      config,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save to database
    const savedDeployment = await deployment.save();
    
    // Handle deployment based on type
    let deploymentResult;
    
    switch (type) {
      case 'odoo':
        deploymentResult = await deployOdooInstance(name, config);
        break;
      case 'dolibarr':
        deploymentResult = await deployDolibarrInstance(name, config);
        break;
      case 'wordpress':
        deploymentResult = await deployWordpressInstance(name, config);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported deployment type' });
    }
    
    // Update deployment status
    savedDeployment.status = deploymentResult.success ? 'running' : 'failed';
    savedDeployment.deploymentInfo = deploymentResult.data;
    await savedDeployment.save();
    
    res.status(201).json(savedDeployment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a deployment
exports.updateDeployment = async (req, res) => {
  try {
    const { config } = req.body;
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    // Update configuration
    deployment.config = { ...deployment.config, ...config };
    deployment.updatedAt = new Date();
    
    // Save updated deployment
    const updatedDeployment = await deployment.save();
    
    // Apply configuration changes
    const updateResult = await updateDeploymentConfig(deployment);
    
    if (!updateResult.success) {
      return res.status(500).json({ 
        message: 'Failed to update deployment configuration',
        error: updateResult.error
      });
    }
    
    res.status(200).json(updatedDeployment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a deployment
exports.deleteDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    // Stop and remove containers
    const deleteResult = await removeDeployment(deployment);
    
    if (!deleteResult.success) {
      return res.status(500).json({ 
        message: 'Failed to remove deployment containers',
        error: deleteResult.error
      });
    }
    
    // Remove from database
    await Deployment.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Deployment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a deployment
exports.startDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    const startResult = await startDeploymentContainers(deployment);
    
    if (!startResult.success) {
      return res.status(500).json({ 
        message: 'Failed to start deployment',
        error: startResult.error
      });
    }
    
    deployment.status = 'running';
    deployment.updatedAt = new Date();
    await deployment.save();
    
    res.status(200).json({ message: 'Deployment started successfully', deployment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stop a deployment
exports.stopDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    const stopResult = await stopDeploymentContainers(deployment);
    
    if (!stopResult.success) {
      return res.status(500).json({ 
        message: 'Failed to stop deployment',
        error: stopResult.error
      });
    }
    
    deployment.status = 'stopped';
    deployment.updatedAt = new Date();
    await deployment.save();
    
    res.status(200).json({ message: 'Deployment stopped successfully', deployment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restart a deployment
exports.restartDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    const restartResult = await restartDeploymentContainers(deployment);
    
    if (!restartResult.success) {
      return res.status(500).json({ 
        message: 'Failed to restart deployment',
        error: restartResult.error
      });
    }
    
    deployment.status = 'running';
    deployment.updatedAt = new Date();
    await deployment.save();
    
    res.status(200).json({ message: 'Deployment restarted successfully', deployment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get deployment logs
exports.getDeploymentLogs = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    const logs = await getContainerLogs(deployment);
    
    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get deployment status
exports.getDeploymentStatus = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    const status = await checkDeploymentStatus(deployment);
    
    // Update status in database if it has changed
    if (status.status !== deployment.status) {
      deployment.status = status.status;
      deployment.updatedAt = new Date();
      await deployment.save();
    }
    
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get deployment monitoring data
exports.getDeploymentMonitoring = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    // Get monitoring data based on deployment type
    let monitoringData;
    
    switch (deployment.type) {
      case 'dolibarr':
        monitoringData = await getDolibarrMonitoringData(deployment);
        break;
      case 'wordpress':
        monitoringData = await getWordpressMonitoringData(deployment);
        break;
      case 'odoo':
        monitoringData = await getOdooMonitoringData(deployment);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported deployment type' });
    }
    
    res.status(200).json(monitoringData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Backup a deployment
exports.backupDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    const backupResult = await createDeploymentBackup(deployment);
    
    if (!backupResult.success) {
      return res.status(500).json({ 
        message: 'Failed to create backup',
        error: backupResult.error
      });
    }
    
    res.status(200).json({ 
      message: 'Backup created successfully', 
      backupInfo: backupResult.data 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore a deployment from backup
exports.restoreDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    const { backupId } = req.body;
    
    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }
    
    if (!backupId) {
      return res.status(400).json({ message: 'Backup ID is required' });
    }
    
    const restoreResult = await restoreDeploymentFromBackup(deployment, backupId);
    
    if (!restoreResult.success) {
      return res.status(500).json({ 
        message: 'Failed to restore from backup',
        error: restoreResult.error
      });
    }
    
    res.status(200).json({ 
      message: 'Deployment restored successfully', 
      deployment 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper functions for deployment operations
async function deployOdooInstance(name, config) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', name);
    
    // Create deployment directory
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    // Copy docker-compose template
    const templatePath = path.join(__dirname, '../../infrastructure/docker/odoo/docker-compose.template.yml');
    const destPath = path.join(deploymentDir, 'docker-compose.yml');
    fs.copyFileSync(templatePath, destPath);
    
    // Create .env file with configuration
    const envContent = `
INSTANCE_NAME=${name}
DB_USER=${config.dbUser || 'odoo'}
DB_PASSWORD=${config.dbPassword || 'odoo_password'}
DB_NAME=${config.dbName || 'odoo'}
ADMIN_PASSWORD=${config.adminPassword || 'admin'}
HOST_PORT=${config.hostPort || 8069}
PROXY_MODE=${config.proxyMode || 'True'}
WORKERS=${config.workers || 4}
LIST_DB=${config.listDb || 'False'}
WITHOUT_DEMO=${config.withoutDemo || 'True'}
`;
    
    fs.writeFileSync(path.join(deploymentDir, '.env'), envContent.trim());
    
    // Deploy using docker-compose
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['up', '-d'], { cwd: deploymentDir });
      
      dockerCompose.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            data: {
              name,
              deploymentDir,
              port: config.hostPort || 8069,
              url: `http://localhost:${config.hostPort || 8069}`
            }
          });
        } else {
          resolve({
            success: false,
            error: `Docker compose exited with code ${code}`
          });
        }
      });
      
      dockerCompose.stderr.on('data', (data) => {
        console.error(`Docker Compose Error: ${data}`);
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Deploy a Dolibarr instance
async function deployDolibarrInstance(name, config) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', name);
    
    // Create deployment directory
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    // Copy docker-compose template
    const templatePath = path.join(__dirname, '../../infrastructure/docker/dolibarr/docker-compose.template.yml');
    const destPath = path.join(deploymentDir, 'docker-compose.yml');
    fs.copyFileSync(templatePath, destPath);
    
    // Create .env file with configuration
    const envContent = `
INSTANCE_NAME=${name}
DOLIBARR_URL=${config.url || `http://localhost:${config.hostPort || 8080}`}
DOLIBARR_PORT=${config.hostPort || 8080}
DOLIBARR_ADMIN_USER=${config.adminUser || 'admin'}
DOLIBARR_ADMIN_PASSWORD=${config.adminPassword || 'admin_password'}
DOLIBARR_MODULES=${config.modules || 'modSociete,modService,modProduct,modProjet,modPropale,modFacture,modContrat,modFournisseur,modStock'}

# Database Configuration
DOLIBARR_DB_NAME=${config.dbName || 'dolibarr'}
DOLIBARR_DB_USER=${config.dbUser || 'dolibarr'}
DOLIBARR_DB_PASSWORD=${config.dbPassword || 'dolibarr_password'}
MYSQL_ROOT_PASSWORD=${config.rootPassword || 'root_password'}

# PHP Configuration
PHP_MEMORY_LIMIT=${config.phpMemoryLimit || '256M'}
TIMEZONE=${config.timezone || 'UTC'}

# phpMyAdmin Configuration
PHPMYADMIN_PORT=${config.phpMyAdminPort || 8081}
`;
    
    fs.writeFileSync(path.join(deploymentDir, '.env'), envContent.trim());
    
    // Deploy using docker-compose
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['up', '-d'], { cwd: deploymentDir });
      
      dockerCompose.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            data: {
              name,
              deploymentDir,
              port: config.hostPort || 8080,
              url: config.url || `http://localhost:${config.hostPort || 8080}`,
              adminUser: config.adminUser || 'admin',
              dbName: config.dbName || 'dolibarr'
            }
          });
        } else {
          resolve({
            success: false,
            error: `Docker compose exited with code ${code}`
          });
        }
      });
      
      dockerCompose.stderr.on('data', (data) => {
        console.error(`Docker Compose Error: ${data}`);
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function deployWordpressInstance(name, config) {
  // Implementation similar to deployOdooInstance but for WordPress
  return { success: true, data: { name } };
}

async function updateDeploymentConfig(deployment) {
  // Implementation for updating deployment configuration
  return { success: true };
}

async function removeDeployment(deployment) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    
    // Run docker-compose down
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['down', '-v'], { cwd: deploymentDir });
      
      dockerCompose.on('close', (code) => {
        if (code === 0) {
          // Optionally remove deployment directory
          // fs.rmdirSync(deploymentDir, { recursive: true });
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: `Docker compose down exited with code ${code}`
          });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function startDeploymentContainers(deployment) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['start'], { cwd: deploymentDir });
      
      dockerCompose.on('close', (code) => {
        resolve({
          success: code === 0,
          error: code !== 0 ? `Docker compose start exited with code ${code}` : null
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function stopDeploymentContainers(deployment) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['stop'], { cwd: deploymentDir });
      
      dockerCompose.on('close', (code) => {
        resolve({
          success: code === 0,
          error: code !== 0 ? `Docker compose stop exited with code ${code}` : null
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function restartDeploymentContainers(deployment) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['restart'], { cwd: deploymentDir });
      
      dockerCompose.on('close', (code) => {
        resolve({
          success: code === 0,
          error: code !== 0 ? `Docker compose restart exited with code ${code}` : null
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getContainerLogs(deployment) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['logs', '--tail=100'], { cwd: deploymentDir });
      let logs = '';
      
      dockerCompose.stdout.on('data', (data) => {
        logs += data.toString();
      });
      
      dockerCompose.on('close', () => {
        resolve(logs);
      });
    });
  } catch (error) {
    return `Error retrieving logs: ${error.message}`;
  }
}

async function checkDeploymentStatus(deployment) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', ['ps', '-q'], { cwd: deploymentDir });
      let output = '';
      
      dockerCompose.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      dockerCompose.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve({ status: 'running' });
        } else {
          resolve({ status: 'stopped' });
        }
      });
    });
  } catch (error) {
    return { status: 'unknown', error: error.message };
  }
}

// Get monitoring data for Dolibarr deployment
async function getDolibarrMonitoringData(deployment) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    const containerName = `${deployment.name}_dolibarr_1`;
    
    // Get container stats
    const containerStats = await getContainerStats(containerName);
    
    // Get application health status
    const healthStatus = await checkDolibarrHealth(deployment);
    
    // Get database size
    const dbSize = await getDatabaseSize(deployment);
    
    return {
      containerStats,
      healthStatus,
      dbSize,
      lastChecked: new Date(),
      deploymentInfo: deployment.deploymentInfo
    };
  } catch (error) {
    console.error(`Error getting Dolibarr monitoring data: ${error.message}`);
    return {
      error: error.message,
      lastChecked: new Date()
    };
  }
}

// Get container stats using Docker API
async function getContainerStats(containerName) {
  try {
    const container = docker.getContainer(containerName);
    const stats = await container.stats({ stream: false });
    
    // Calculate CPU usage percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuCount = stats.cpu_stats.online_cpus || 1;
    const cpuUsage = (cpuDelta / systemCpuDelta) * cpuCount * 100;
    
    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage / (1024 * 1024); // Convert to MB
    const memoryLimit = stats.memory_stats.limit / (1024 * 1024); // Convert to MB
    const memoryUsagePercent = (memoryUsage / memoryLimit) * 100;
    
    return {
      cpu: {
        usage: cpuUsage.toFixed(2) + '%',
        cores: cpuCount
      },
      memory: {
        usage: memoryUsage.toFixed(2) + ' MB',
        limit: memoryLimit.toFixed(2) + ' MB',
        percent: memoryUsagePercent.toFixed(2) + '%'
      },
      network: {
        rx: (stats.networks?.eth0?.rx_bytes / (1024 * 1024)).toFixed(2) + ' MB',
        tx: (stats.networks?.eth0?.tx_bytes / (1024 * 1024)).toFixed(2) + ' MB'
      },
      uptime: await getContainerUptime(containerName)
    };
  } catch (error) {
    console.error(`Error getting container stats: ${error.message}`);
    return { error: error.message };
  }
}

// Check Dolibarr application health
async function checkDolibarrHealth(deployment) {
  try {
    const url = deployment.deploymentInfo?.url || `http://localhost:${deployment.deploymentInfo?.port || 8080}`;
    
    // Use a simple HTTP request to check if the application is responding
    return new Promise((resolve) => {
      const http = require('http');
      const req = http.get(url, (res) => {
        const statusCode = res.statusCode;
        resolve({
          status: statusCode >= 200 && statusCode < 300 ? 'healthy' : 'unhealthy',
          statusCode,
          responseTime: Date.now() - startTime
        });
      });
      
      const startTime = Date.now();
      
      req.on('error', (error) => {
        resolve({
          status: 'unreachable',
          error: error.message
        });
      });
      
      req.setTimeout(5000, () => {
        req.abort();
        resolve({
          status: 'timeout',
          error: 'Connection timed out'
        });
      });
    });
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Get database size for a deployment
async function getDatabaseSize(deployment) {
  try {
    const containerName = `${deployment.name}_db_1`;
    const dbName = deployment.deploymentInfo?.dbName || 'dolibarr';
    
    return new Promise((resolve) => {
      const docker = spawn('docker', [
        'exec',
        containerName,
        'mysql',
        '-e',
        `SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema='${dbName}' GROUP BY table_schema;`
      ]);
      
      let output = '';
      
      docker.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          // Parse the output to extract the size
          const lines = output.trim().split('\n');
          if (lines.length >= 2) {
            const sizeMatch = lines[1].match(/\d+\.\d+/);
            if (sizeMatch) {
              resolve({
                size: sizeMatch[0] + ' MB',
                tables: getTotalTables(deployment)
              });
              return;
            }
          }
          resolve({ size: 'unknown' });
        } else {
          resolve({ error: `Command exited with code ${code}` });
        }
      });
    });
  } catch (error) {
    return { error: error.message };
  }
}

// Get container uptime
async function getContainerUptime(containerName) {
  try {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();
    
    const startTime = new Date(info.State.StartedAt);
    const uptime = Math.floor((new Date() - startTime) / 1000); // in seconds
    
    // Format uptime
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } catch (error) {
    return 'unknown';
  }
}

// Get total number of tables in the database
async function getTotalTables(deployment) {
  try {
    const containerName = `${deployment.name}_db_1`;
    const dbName = deployment.deploymentInfo?.dbName || 'dolibarr';
    
    return new Promise((resolve) => {
      const docker = spawn('docker', [
        'exec',
        containerName,
        'mysql',
        '-e',
        `SELECT COUNT(*) AS tables FROM information_schema.TABLES WHERE table_schema='${dbName}';`
      ]);
      
      let output = '';
      
      docker.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      docker.on('close', (code) => {
        if (code === 0) {
          // Parse the output to extract the count
          const lines = output.trim().split('\n');
          if (lines.length >= 2) {
            const countMatch = lines[1].match(/\d+/);
            if (countMatch) {
              resolve(countMatch[0]);
              return;
            }
          }
          resolve('unknown');
        } else {
          resolve('unknown');
        }
      });
    });
  } catch (error) {
    return 'unknown';
  }
}

// Placeholder functions for other application types
async function getWordpressMonitoringData(deployment) {
  // To be implemented
  return { message: 'WordPress monitoring not yet implemented' };
}

async function getOdooMonitoringData(deployment) {
  // To be implemented
  return { message: 'Odoo monitoring not yet implemented' };
}

async function createDeploymentBackup(deployment) {
  try {
    const backupDir = path.join(process.env.BACKUPS_DIR || '../backups', deployment.name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create backup subdirectory for this specific backup
    fs.mkdirSync(backupPath, { recursive: true });
    
    // Execute backup based on deployment type
    if (deployment.type === 'odoo') {
      return await backupOdooDeployment(deployment, backupPath);
    } else if (deployment.type === 'dolibarr') {
      return await backupDolibarrDeployment(deployment, backupPath);
    } else if (deployment.type === 'wordpress') {
      return await backupWordpressDeployment(deployment, backupPath);
    } else {
      return {
        success: false,
        error: `Unsupported deployment type: ${deployment.type}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function backupOdooDeployment(deployment, backupPath) {
  try {
    const deploymentDir = path.join(process.env.DEPLOYMENTS_DIR || '../deployments', deployment.name);
    
    // Execute Odoo backup command
    return new Promise((resolve) => {
      const dockerCompose = spawn('docker-compose', [
        'exec', '-T', 'odoo', 
        '/usr/bin/odoo', 
        '--config=/etc/odoo/odoo.conf', 
        '--backup', 
        `--backup-dir=${backupPath}`
      ], { cwd: deploymentDir });
      
      dockerCompose.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            data: {
              backupId: path.basename(backupPath),
              timestamp: new Date().toISOString(),
              path: backupPath
            }
          });
        } else {
          resolve({
            success: false,
            error: `Backup command exited with code ${code}`
          });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function restoreDeploymentFromBackup(deployment, backupId) {
  // Implementation for restoring from backup
  return { success: true };
}

// Additional helper functions would be implemented as needed