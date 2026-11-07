const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

async function sendEmail(to, subject, text) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { ok: false, error: 'EMAIL_USER or EMAIL_PASS is missing in .env' }
  }

  try {
    await transporter.sendMail({
      from: `Nirapod Alert <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

module.exports = { sendEmail }