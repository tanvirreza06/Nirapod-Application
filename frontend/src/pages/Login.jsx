import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Login failed')
        return
      }

      localStorage.setItem('token', data.token)
      navigate('/sos')
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: '60px auto', padding: 16 }}>
      <h2>Login to Nirapod</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8, boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8, boxSizing: 'border-box' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Login</button>
      </form>
      <p>{message}</p>
      <p>
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  )
}

export default Login