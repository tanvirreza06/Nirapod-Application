async function sendTelegram(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN is missing in .env' }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    })
    const data = await res.json()

    if (!data.ok) {
      return { ok: false, error: data.description }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

module.exports = { sendTelegram }