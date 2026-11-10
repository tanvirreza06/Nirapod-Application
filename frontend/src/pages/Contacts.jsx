import { useEffect, useState } from 'react'

const API = '/api/contacts'

function Contacts() {
  const [contacts, setContacts] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('token')
  const authHeader = { Authorization: `Bearer ${token}` }

  async function loadContacts() {
    try {
      const res = await fetch(API, { headers: authHeader })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not load contacts')
        return
      }

      setContacts(data)
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  async function addContact(e) {
    e.preventDefault()
    setMessage('')

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          name,
          phone,
          email,
          telegram_id: telegramId
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not add contact')
        return
      }

      setName('')
      setPhone('')
      setEmail('')
      setTelegramId('')
      setMessage(data.message)
      loadContacts()
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  async function deleteContact(id) {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: authHeader
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not delete contact')
        return
      }

      setMessage(data.message)
      loadContacts()
    } catch (err) {
      setMessage('Cannot reach server')
    }
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    marginBottom: 10,
    padding: 8,
    boxSizing: 'border-box'
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
      <h2>Trusted contacts</h2>
      <p>Add up to 5 people who will get your SOS link.</p>

      <form onSubmit={addContact}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
          placeholder="Telegram ID (optional)"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Add contact</button>
      </form>

      <p>{message}</p>

      <h3>Your contacts ({contacts.length}/5)</h3>
      {contacts.length === 0 && <p>No contacts yet.</p>}
      {contacts.map((c) => (
        <div
          key={c.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid #dddddd'
          }}
        >
          <div>
            <strong>{c.name}</strong>
            <div style={{ fontSize: 13 }}>
              {[c.phone, c.email, c.telegram_id].filter(Boolean).join(' | ')}
            </div>
          </div>
          <button onClick={() => deleteContact(c.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}

export default Contacts