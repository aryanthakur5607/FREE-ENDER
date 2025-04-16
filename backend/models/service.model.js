const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  skillsRequired: [{
    type: String,
    trim: true
  }],
  skillsOffered: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['available', 'pending', 'in-progress', 'pending-confirmation', 'completed', 'cancelled'],
    default: 'available'
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    completed: {
      type: Boolean,
      default: false
    },
    dueDate: Date
  }],
  location: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  agreement: {
    terms: String,
    acceptedByRequester: {
      type: Boolean,
      default: false,
    },
    acceptedByProvider: {
      type: Boolean,
      default: false,
    },
    acceptedAt: Date,
  },
  completedAt: Date,
  feedback: {
    fromRequester: {
      rating: Number,
      comment: String,
      createdAt: Date,
    },
    fromProvider: {
      rating: Number,
      comment: String,
      createdAt: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
serviceSchema.index({ status: 1 });
serviceSchema.index({ requester: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ skillsRequired: 1 });
serviceSchema.index({ category: 1 });

// Update the updatedAt field before saving
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service; 