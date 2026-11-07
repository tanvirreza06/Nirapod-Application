const db = require('./db');
const { startSosForUser } = require('./sosService');

async function checkTimers() {
  try {
    const [due] = await db.query(
      "SELECT id, user_id, start_lat, start_lng FROM safety_timers WHERE status = 'active' AND ends_at <= NOW()"
    );

    for (const t of due) {
      const [update] = await db.query(
        "UPDATE safety_timers SET status = 'triggered' WHERE id = ? AND status = 'active'",
        [t.id]
      );

      if (update.affectedRows === 0) continue;

      await startSosForUser(t.user_id, {
        reason: 'did not confirm she is safe in time. The map shows her last known location.',
        lat: t.start_lat,
        lng: t.start_lng
      });
    }
  } catch (err) {
    console.error('Timer check failed:', err.message);
  }
}

function startTimerChecker() {
  setInterval(checkTimers, 15000);
}

module.exports = { startTimerChecker };