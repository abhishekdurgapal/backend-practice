const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Avoid OverwriteModelError when using nodemon or in dev environments
const modelName = 'User';
if (mongoose.models[modelName]) {
  module.exports = mongoose.model(modelName);
  return;
}

// Define the User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  mobile: {
    type: String,
    match: [/^\d{10}$/, 'Invalid mobile number']
  },
  address: {
    type: String,
    required: true
  },
  aadharCardNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['voter', 'admin'],
    default: 'voter'
  },
  isVoted: {
    type: Boolean,
    default: false
  }
});

// Pre-save middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare plaintext password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model(modelName, userSchema);
module.exports = User;
