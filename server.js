const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables early
const db = require('./db'); // Make sure db.js handles connection logic

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Parses JSON request bodies

const PORT = process.env.PORT || 4000;

// Import and use routes
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});
