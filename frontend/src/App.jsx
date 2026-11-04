import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Sos from './pages/Sos'
import Track from './pages/Track'
import Contacts from './pages/Contacts'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/sos" element={<Sos />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/track/:token" element={<Track />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App