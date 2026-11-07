import { useEffect, useRef, useState } from 'react'

const SHAKE_LIMIT = 25
const SHAKES_NEEDED = 3
const SHAKE_WINDOW_MS = 1500
const COUNTDOWN_SECONDS = 10

function Sos() {
  const [eventId, setEventId] = useState(null)
  const [trackLink, setTrackLink] = useState('')
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState('')
  const [shakeOn, setShakeOn] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [cancelPin, setCancelPin] = useState('')
  const [cancelMessage, setCancelMessage] = useState('')
  const shakeTimes = useRef([])

  function beginCountdown() {
    setCancelPin('')
    setCancelMessage('')
    setCountdown(COUNTDOWN_SECONDS)
  }

  useEffect(() => {
    if (!eventId) return

    const token = localStorage.getItem('token')

    function sendLocation() {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await fetch(`http://localhost:5000/api/sos/${eventId}/location`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              })
            })
          } catch (err) {
            setMessage('Cannot reach server')
          }
        },
        () => setMessage('Please allow location access')
      )
    }

    sendLocation()
    const timer = setInterval(sendLocation, 5000)
    return () => clearInterval(timer)
  }, [eventId])

  useEffect(() => {
    if (!shakeOn || eventId || countdown !== null) return

    function onMotion(e) {
      const a = e.accelerationIncludingGravity
      if (!a) return

      const force = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2)
      if (force < SHAKE_LIMIT) return

      const now = Date.now()
      const last = shakeTimes.current[shakeTimes.current.length - 1]
      if (last && now - last < 150) return

      shakeTimes.current = [
        ...shakeTimes.current.filter((t) => now - t < SHAKE_WINDOW_MS),
        now
      ]

      if (shakeTimes.current.length >= SHAKES_NEEDED) {
        shakeTimes.current = []
        beginCountdown()
      }
    }

    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [shakeOn, eventId, countdown])

  useEffect(() => {
    if (countdown === null) return

    if (countdown === 0) {
      setCountdown(null)
      startSos()
      return
    }

    if (navigator.vibrate) navigator.vibrate(200)
    const t = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function enableShake() {
    if (typeof DeviceMotionEvent === 'undefined') {
      setMessage('This device has no motion sensor')
      return
    }

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const result = await DeviceMotionEvent.requestPermission()
      if (result !== 'granted') {
        setMessage('Motion permission denied')
        return
      }
    }

    setShakeOn(true)
    setMessage('Shake protection is on. Keep this screen open.')
  }

  async function cancelWithPin() {
    if (!cancelPin) {
      setCancelMessage('Enter your PIN')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const res = await fetch('http://localhost:5000/api/sos/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: cancelPin })
      })
      const data = await res.json()

      if (!res.ok) {
        setCancelMessage(data.error || 'Wrong PIN')
        setCancelPin('')
        return
      }

      setCountdown(null)
      setCancelPin('')
      setCancelMessage('')
      setMessage('Alert cancelled')
    } catch (err) {
      setCancelMessage('Cannot reach server')
    }
  }

  async function startSos() {
    setMessage('')
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('http://localhost:5000/api/sos/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not start SOS')
        return
      }

      setEventId(data.eventId)
      setTrackLink(`http://localhost:5173/track/${data.shareToken}`)
      setMessage(data.message)
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  async function stopSos() {
    if (!pin) {
      setMessage('Enter your PIN')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`http://localhost:5000/api/sos/${eventId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not stop SOS')
        return
      }

      setEventId(null)
      setTrackLink('')
      setPin('')
      setMessage(data.message)
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  if (countdown !== null) {
    return (
      <div style={{ maxWidth: 320, margin: '60px auto', padding: 16, textAlign: 'center' }}>
        <h2>Shake detected</h2>
        <p>SOS will start in</p>
        <div style={{ fontSize: 72, fontWeight: 'bold', color: '#d62828' }}>{countdown}</div>
        <input
          type="password"
          inputMode="numeric"
          placeholder="Enter PIN to cancel"
          value={cancelPin}
          onChange={(e) => setCancelPin(e.target.value)}
          style={{ display: 'block', width: '100%', margin: '16px 0 12px', padding: 8, boxSizing: 'border-box' }}
        />
        <button onClick={cancelWithPin} style={{ padding: '12px 24px', fontSize: 18 }}>
          Cancel with PIN
        </button>
        <p>{cancelMessage}</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 320, margin: '60px auto', padding: 16, textAlign: 'center' }}>
      <h2>Nirapod</h2>

      {!eventId ? (
        <div>
          <button
            onClick={startSos}
            style={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              border: 'none',
              background: '#d62828',
              color: '#ffffff',
              fontSize: 36,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            SOS
          </button>

          <div style={{ marginTop: 24 }}>
            {shakeOn ? (
              <button onClick={() => setShakeOn(false)}>Turn off shake protection</button>
            ) : (
              <button onClick={enableShake}>Turn on shake protection</button>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={beginCountdown}>Test shake (for laptop testing)</button>
          </div>
        </div>
      ) : (
        <div>
          <p>Tracking link for your contacts:</p>
          <p style={{ wordBreak: 'break-all' }}>{trackLink}</p>
          <input
            type="password"
            inputMode="numeric"
            placeholder="Enter your PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ display: 'block', width: '100%', margin: '12px 0', padding: 8 }}
          />
          <button
            onClick={stopSos}
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

export default Sos