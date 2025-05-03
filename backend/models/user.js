const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deployments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment'
  }],
  settings: {
    type: Object,
    default: {}
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  lastLogin: {
    type: Date
  }
});

// Add indexes for better query performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// Pre-save middleware to update the updatedAt field
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', UserSchema);