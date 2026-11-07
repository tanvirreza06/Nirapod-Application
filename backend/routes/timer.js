const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/start', async (req, res) => {
  try {
    const minutes = Math.floor(Number(req.body.minutes));
    const { lat, lng } = req.body;

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 720) {
      return res.status(400).json({ error: 'Minutes must be between 1 and 720' });
    }

    const [existing] = await db.query(
      "SELECT id FROM safety_timers WHERE user_id = ? AND status = 'active'",
      [req.userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A safety timer is already running' });
    }

    const startLat = typeof lat === 'number' ? lat : null;
    const startLng = typeof lng === 'number' ? lng : null;

    const [result] = await db.query(
      'INSERT INTO safety_timers (user_id, ends_at, start_lat, start_lng) VALUES (?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?, ?)',
      [req.userId, minutes, startLat, startLng]
    );

    res.status(201).json({
      message: 'Safety timer started',
      timerId: result.insertId,
      secondsLeft: minutes * 60
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, TIMESTAMPDIFF(SECOND, NOW(), ends_at) AS secondsLeft FROM safety_timers WHERE user_id = ? AND status = 'active'",
      [req.userId]
    );

    if (rows.length === 0) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      timerId: rows[0].id,
      secondsLeft: Math.max(0, rows[0].secondsLeft)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/confirm', async (req, res) => {
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
      "UPDATE safety_timers SET status = 'confirmed' WHERE user_id = ? AND status = 'active'",
      [req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No active timer' });
    }

    res.json({ message: 'Glad you are safe. Timer cancelled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;