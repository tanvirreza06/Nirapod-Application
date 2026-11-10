require('dotenv').config()

const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

module.exports = { frontendUrl }