const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Relación virtual: user.projects
userSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'userId'
});

module.exports = mongoose.model('User', userSchema);
