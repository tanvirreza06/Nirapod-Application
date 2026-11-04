import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const linkStyle = {
    marginRight: 16,
    textDecoration: 'none',
    color: '#d62828',
    fontWeight: 'bold'
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #dddddd'
      }}
    >
      <strong style={{ marginRight: 24 }}>Nirapod</strong>
      <Link to="/sos" style={linkStyle}>SOS</Link>
      <Link to="/contacts" style={linkStyle}>Contacts</Link>
      <button onClick={logout} style={{ marginLeft: 'auto' }}>Logout</button>
    </nav>
  )
}

export default Navbar