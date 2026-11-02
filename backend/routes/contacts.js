const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, telegram_id } = req.body;

    if (!name || (!phone && !email && !telegram_id)) {
      return res.status(400).json({
        error: 'Name and at least one of phone, email or telegram_id are required'
      });
    }

    const [count] = await db.query(
      'SELECT COUNT(*) AS total FROM contacts WHERE user_id = ?',
      [req.userId]
    );
    if (count[0].total >= 5) {
      return res.status(400).json({ error: 'You can add up to 5 contacts' });
    }

    const [result] = await db.query(
      'INSERT INTO contacts (user_id, name, phone, email, telegram_id) VALUES (?, ?, ?, ?, ?)',
      [req.userId, name, phone || null, email || null, telegram_id || null]
    );

    res.status(201).json({ message: 'Contact added', contactId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, phone, email, telegram_id FROM contacts WHERE user_id = ?',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;