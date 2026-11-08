import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Sos from './pages/Sos'
import Track from './pages/Track'
import Contacts from './pages/Contacts'
import Timer from './pages/Timer'
import Navbar from './components/Navbar'

function ProtectedLayout() {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" />
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/track/:token" element={<Track />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/sos" element={<Sos />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/contacts" element={<Contacts />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App