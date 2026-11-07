const crypto = require('crypto');
const db = require('./db');
const { sendTelegram } = require('./telegram');
const { sendEmail } = require('./email');

async function startSosForUser(userId, options = {}) {
  const { reason, lat, lng } = options;

  const [active] = await db.query(
    "SELECT id, share_token FROM sos_events WHERE user_id = ? AND status = 'active'",
    [userId]
  );

  if (active.length > 0) {
    return {
      alreadyActive: true,
      eventId: active[0].id,
      shareToken: active[0].share_token,
      alerted: 0
    };
  }

  const shareToken = crypto.randomBytes(24).toString('hex');

  const [result] = await db.query(
    'INSERT INTO sos_events (user_id, share_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
    [userId, shareToken]
  );
  const eventId = result.insertId;

  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
    await db.query(
      'INSERT INTO location_points (event_id, lat, lng) VALUES (?, ?, ?)',
      [eventId, lat, lng]
    );
  }

  const [users] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
  const [contacts] = await db.query(
    'SELECT telegram_id, email FROM contacts WHERE user_id = ?',
    [userId]
  );

  const link = `http://localhost:5173/track/${shareToken}`;
  const text = `${users[0].name} ${reason} Track here: ${link}`;

  const jobs = [];
  contacts.forEach((c) => {
    if (c.telegram_id) jobs.push(sendTelegram(c.telegram_id, text));
    if (c.email) jobs.push(sendEmail(c.email, 'SOS alert from Nirapod', text));
  });

  const results = await Promise.all(jobs);
  const alerted = results.filter((r) => r.ok).length;

  return { alreadyActive: false, eventId, shareToken, alerted };
}

module.exports = { startSosForUser };