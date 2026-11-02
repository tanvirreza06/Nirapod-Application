const express = require('express');
const crypto = require('crypto');
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

    res.status(201).json({
      message: 'SOS started',
      eventId: result.insertId,
      shareToken
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

module.exports = router;