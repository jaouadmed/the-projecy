const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['odoo', 'dolibarr', 'wordpress']
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'running', 'stopped', 'failed'],
    default: 'pending'
  },
  config: {
    type: Object,
    required: true
  },
  deploymentInfo: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resources: {
    cpu: {
      type: Number,
      default: 1
    },
    memory: {
      type: Number,
      default: 1024 // MB
    },
    storage: {
      type: Number,
      default: 10 // GB
    }
  },
  domain: {
    type: String,
    trim: true
  },
  backups: [{
    backupId: String,
    timestamp: Date,
    path: String,
    size: Number,
    status: {
      type: String,
      enum: ['completed', 'failed', 'in_progress'],
      default: 'completed'
    }
  }],
  metrics: {
    lastUpdated: Date,
    cpuUsage: Number,
    memoryUsage: Number,
    diskUsage: Number,
    requestCount: Number
  }
});

// Add indexes for better query performance
DeploymentSchema.index({ userId: 1 });
DeploymentSchema.index({ type: 1 });
DeploymentSchema.index({ status: 1 });
DeploymentSchema.index({ name: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
DeploymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Deployment', DeploymentSchema);