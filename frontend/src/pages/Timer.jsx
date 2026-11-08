import { useEffect, useState } from 'react'

const API = 'http://localhost:5000/api/timer'

function formatTime(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({})
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { timeout: 8000 }
    )
  })
}

function Timer() {
  const [minutes, setMinutes] = useState(30)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('token')
  const authHeader = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    async function loadActive() {
      try {
        const res = await fetch(`${API}/active`, { headers: authHeader })
        const data = await res.json()
        if (res.ok && data.active) {
          setSecondsLeft(data.secondsLeft)
        }
      } catch (err) {
        setMessage('Cannot reach server')
      }
    }
    loadActive()
  }, [])

  useEffect(() => {
    if (secondsLeft === null) return

    if (secondsLeft <= 0) {
      setSecondsLeft(null)
      setMessage('Time is up. Your contacts are being alerted.')
      return
    }

    const t = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  async function startTimer() {
    setMessage('')
    const mins = Number(minutes)

    if (!Number.isFinite(mins) || mins < 1 || mins > 720) {
      setMessage('Enter minutes between 1 and 720')
      return
    }

    setMessage('Getting your location...')
    const loc = await getLocation()

    try {
      const res = await fetch(`${API}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ minutes: mins, ...loc })
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not start timer')
        return
      }

      setSecondsLeft(data.secondsLeft)
      setMessage(
        loc.lat !== undefined
          ? 'Timer started. Your location is saved.'
          : 'Timer started. Location was not shared.'
      )
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  async function confirmSafe() {
    if (!pin) {
      setMessage('Enter your PIN')
      return
    }

    try {
      const res = await fetch(`${API}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ pin })
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not confirm')
        setPin('')
        return
      }

      setSecondsLeft(null)
      setPin('')
      setMessage(data.message)
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: '60px auto', padding: 16, textAlign: 'center' }}>
      <h2>Safety timer</h2>

      {secondsLeft === null ? (
        <div>
          <p>If you do not confirm you are safe in time, your contacts get an alert.</p>
          <input
            type="number"
            min="1"
            max="720"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            style={{ width: 80, padding: 8, textAlign: 'center' }}
          />
          <span> minutes</span>
          <div style={{ marginTop: 16 }}>
            <button onClick={startTimer} style={{ padding: '10px 20px', fontSize: 16 }}>
              Start safety timer
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Time left</p>
          <div style={{ fontSize: 56, fontWeight: 'bold', color: '#d62828' }}>
            {formatTime(secondsLeft)}
          </div>
          <input
            type="password"
            inputMode="numeric"
            placeholder="Enter your PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ display: 'block', width: '100%', margin: '16px 0 12px', padding: 8, boxSizing: 'border-box' }}
          />
          <button
            onClick={confirmSafe}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: 8,
              background: '#2a9d8f',
              color: '#ffffff',
              fontSize: 18,
              cursor: 'pointer'
            }}
          >
            I'm safe
          </button>
        </div>
      )}

      <p>{message}</p>
    </div>
  )
}

export default Timer