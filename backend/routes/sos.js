const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendTelegram } = require('../telegram');
const { sendEmail } = require('../email');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/start', async (req, res) => {
  try {
    const [active] = await db.query(
      "SELECT id, share_token FROM sos_events WHERE user_id = ? AND status = 'active'",
      [req.userId]
    );

    if (active.length > 0) {
      return res.json({
        message: 'SOS already active',
        eventId: active[0].id,
        shareToken: active[0].share_token
      });
    }

    const shareToken = crypto.randomBytes(24).toString('hex');

    const [result] = await db.query(
      'INSERT INTO sos_events (user_id, share_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [req.userId, shareToken]
    );

           const [users] = await db.query('SELECT name FROM users WHERE id = ?', [req.userId]);

    const [contacts] = await db.query(
      'SELECT telegram_id, email FROM contacts WHERE user_id = ?',
      [req.userId]
    );

    const link = `http://localhost:5173/track/${shareToken}`;
    const text = `${users[0].name} needs help! Track her live location: ${link}`;

    const jobs = [];
    contacts.forEach((c) => {
      if (c.telegram_id) jobs.push(sendTelegram(c.telegram_id, text));
      if (c.email) jobs.push(sendEmail(c.email, 'SOS alert from Nirapod', text));
    });

    const results = await Promise.all(jobs);
    const alerted = results.filter((r) => r.ok).length;

    res.status(201).json({
      message: 'SOS started',
      eventId: result.insertId,
      shareToken,
      alerted
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }

    const [events] = await db.query(
      "SELECT id FROM sos_events WHERE id = ? AND user_id = ? AND status = 'active'",
      [req.params.id, req.userId]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Active SOS not found' });
    }

    await db.query(
      'INSERT INTO location_points (event_id, lat, lng) VALUES (?, ?, ?)',
      [req.params.id, lat, lng]
    );

    res.status(201).json({ message: 'Location saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    const [users] = await db.query(
      'SELECT pin_hash FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0 || !users[0].pin_hash) {
      return res.status(400).json({ error: 'No PIN set for this account' });
    }

    const match = await bcrypt.compare(String(pin), users[0].pin_hash);
    if (!match) {
      return res.status(401).json({ error: 'Wrong PIN' });
    }

    const [result] = await db.query(
      "UPDATE sos_events SET status = 'ended', ended_at = NOW() WHERE id = ? AND user_id = ? AND status = 'active'",
      [req.params.id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Active SOS not found' });
    }

    res.json({ message: 'SOS ended. Stay safe!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;