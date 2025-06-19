const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const modelName = 'User';
if (mongoose.models[modelName]) {
  module.exports = mongoose.model(modelName);
  return;
}

// Define the User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number }, // Optional for Gmail
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  mobile: {
    type: String,
    match: [/^\d{10}$/, 'Invalid mobile number']
  },
  address: { type: String },
  password: { type: String }, // ✅ No longer required
  role: {
    type: String,
    enum: ['voter', 'admin'],
    default: 'voter'
  },
  isVoted: { type: Boolean, default: false }
});

// ✅ Only hash password if it exists
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model(modelName, userSchema);
module.exports = User;
