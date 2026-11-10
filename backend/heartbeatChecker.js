const db = require('./db');
const { sendTelegram } = require('./telegram');
const { sendEmail } = require('./email');
const { frontendUrl } = require('./config');

const SILENCE_SECONDS = 60;

async function checkHeartbeats() {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.user_id, e.share_token, u.name,
              COALESCE(MAX(l.recorded_at), e.started_at) AS last_signal
       FROM sos_events e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN location_points l ON l.event_id = e.id
       WHERE e.status = 'active'
         AND e.signal_lost_alerted = 0
         AND e.expires_at > NOW()
       GROUP BY e.id, e.user_id, e.share_token, u.name, e.started_at
       HAVING TIMESTAMPDIFF(SECOND, last_signal, NOW()) >= ?`,
      [SILENCE_SECONDS]
    );

    for (const ev of rows) {
      const [claim] = await db.query(
        'UPDATE sos_events SET signal_lost_alerted = 1 WHERE id = ? AND signal_lost_alerted = 0',
        [ev.id]
      );

      if (claim.affectedRows === 0) continue;

      const [contacts] = await db.query(
        'SELECT telegram_id, email FROM contacts WHERE user_id = ?',
        [ev.user_id]
      );

      const link = `${frontendUrl}/track/${ev.share_token}`;
      const text = `Signal lost! ${ev.name}'s phone stopped sending location. It may be switched off or have no internet. Her last known location is on the map: ${link}`;

      const jobs = [];
      contacts.forEach((c) => {
        if (c.telegram_id) jobs.push(sendTelegram(c.telegram_id, text));
        if (c.email) jobs.push(sendEmail(c.email, 'Signal lost during SOS', text));
      });

      await Promise.all(jobs);
    }
  } catch (err) {
    console.error('Heartbeat check failed:', err.message);
  }
}

function startHeartbeatChecker() {
  setInterval(checkHeartbeats, 15000);
}

module.exports = { startHeartbeatChecker };