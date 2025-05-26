const voteRoutes = require('./routes/voteRoutes');
app.use('/api', voteRoutes); // Routes are now under /api/vote, /api/results, etc.
