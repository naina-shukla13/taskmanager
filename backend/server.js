const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

initDb().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/users', require('./routes/users'));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/build/index.html')));
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});