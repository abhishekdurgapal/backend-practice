const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const db = require('./db'); 
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Routes
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);

mongoose.connection.once('open', async () => {
  try {
    await mongoose.connection.db.collection('users').dropIndex('aadharCardNumber_1');
    console.log(' Dropped aadharCardNumber index');
  } catch (err) {
    if (err.codeName !== 'IndexNotFound') {
      console.error(' Failed to drop index:', err.message);
    } else {
      console.log(' Aadhaar index already removed');
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(` Server is listening on port ${PORT}`);
});
