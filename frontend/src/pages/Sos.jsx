import { useEffect, useState } from 'react'

function Sos() {
  const [eventId, setEventId] = useState(null)
  const [trackLink, setTrackLink] = useState('')
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState('')

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

  return (
    <div style={{ maxWidth: 320, margin: '60px auto', padding: 16, textAlign: 'center' }}>
      <h2>Nirapod</h2>

      {!eventId ? (
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