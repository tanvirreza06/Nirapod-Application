import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    if (!/^\d{4,6}$/.test(pin)) {
      setMessage('PIN must be 4 to 6 digits')
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, pin })
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Signup failed')
        return
      }

      navigate('/login')
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    marginBottom: 12,
    padding: 8,
    boxSizing: 'border-box'
  }

  return (
    <div style={{ maxWidth: 320, margin: '40px auto', padding: 16 }}>
      <h2>Create your Nirapod account</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="Safety PIN (4 to 6 digits)"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Sign up</button>
      </form>
      <p>{message}</p>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}

export default Signup