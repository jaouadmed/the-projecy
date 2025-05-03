const mongoose = require('mongoose');

const DolibarrConfigSchema = new mongoose.Schema({
  deployment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'deployment',
    required: true
  },
  siteName: {
    type: String,
    required: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  defaultLanguage: {
    type: String,
    required: true,
    default: 'en_US'
  },
  dbPrefix: {
    type: String,
    default: 'llx_'
  },
  enableMaintenanceMode: {
    type: Boolean,
    default: false
  },
  enabledModules: {
    accounting: {
      type: Boolean,
      default: true
    },
    invoicing: {
      type: Boolean,
      default: true
    },
    crm: {
      type: Boolean,
      default: true
    },
    hrm: {
      type: Boolean,
      default: false
    },
    projects: {
      type: Boolean,
      default: true
    },
    ecommerce: {
      type: Boolean,
      default: false
    },
    pos: {
      type: Boolean,
      default: false
    }
  },
  forceHttps: {
    type: Boolean,
    default: true
  },
  sessionTimeout: {
    type: Number,
    default: 60
  },
  maxLoginAttempts: {
    type: Number,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('dolibarrConfig', DolibarrConfigSchema);