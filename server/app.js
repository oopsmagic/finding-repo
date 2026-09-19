const express = require('express');
const cors = require('cors');
const repoRoutes = require('./routes/repo.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FindingRepo API is running',
  });
});

app.use('/api/repos', repoRoutes);

module.exports = app;
