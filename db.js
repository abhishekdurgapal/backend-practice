const mongoose = require('mongoose');
require('dotenv').config();

// Use either local or remote MongoDB URL
const mongoURL = process.env.MONGODB_URL_LOCAL || process.env.MONGODB_URI;

if (!mongoURL) {
  console.error('❌ MongoDB URL is not defined in environment variables.');
  process.exit(1); // Exit if no URL is provided
}

console.log('🔗 Connecting to MongoDB at:', mongoURL);

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Access the default connection
const db = mongoose.connection;

// MongoDB event listeners
db.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

db.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

db.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Optional: graceful shutdown on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = db;
