const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/:token', async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.id, e.status, e.started_at, e.ended_at,
              (e.expires_at < NOW()) AS expired, u.name
       FROM sos_events e
       JOIN users u ON u.id = e.user_id
       WHERE e.share_token = ?`,
      [req.params.token]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Tracking link not found' });
    }

    const event = events[0];

    if (event.expired) {
      return res.status(410).json({ error: 'This tracking link has expired' });
    }

    const [points] = await db.query(
      `SELECT lat, lng, recorded_at FROM location_points
       WHERE event_id = ? ORDER BY id DESC LIMIT 50`,
      [event.id]
    );

    res.json({
      name: event.name,
      status: event.status,
      startedAt: event.started_at,
      endedAt: event.ended_at,
      lastLocation: points[0] || null,
      trail: points.reverse()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;