const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'intern' },
  createdAt: { type: Date, default: Date.now }
});

// Refresh Token Schema (for token rotation and tracking)
const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  isRevoked: { type: Boolean, default: false },
  replacedByToken: { type: String }
});

// Virtual to check if token is expired
RefreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt;
});

// Virtual to check if token is active
RefreshTokenSchema.virtual('isActive').get(function () {
  return !this.isRevoked && !this.isExpired;
});

// Submissions Schema
const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  filesize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }, // Pending, Validated, Failed
  validationReport: { type: mongoose.Schema.Types.Mixed, default: {} }
});

// Ensure virtuals are serialized
RefreshTokenSchema.set('toJSON', { virtuals: true });
RefreshTokenSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', UserSchema);
const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = {
  User,
  RefreshToken,
  Submission
};
