require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/auth');
const contactRoutes = require('./routes/contacts');
const sosRoutes = require('./routes/sos');
const trackRoutes = require('./routes/track');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/track', trackRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ db: 'connected' });
  } catch (err) {
    res.status(500).json({ db: 'failed', error: err.message });
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, email FROM users WHERE id = ?',
    [req.userId]
  );
  res.json(rows[0]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});