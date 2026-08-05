import { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import './index.css'
import AddContact from './pages/AddContact'
import Admin from './pages/Admin'
import AdminAddUser from './pages/AdminAddUser'
import Dashboard from './pages/Dashboard'
import EditContact from './pages/EditContact'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <Router>
      {isAuthenticated ? (
        <div className="flex">
          <Sidebar user={user} onLogout={handleLogout} />
          <div className="crm-main">
            <Routes>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/add" element={<AddContact />} />
              <Route path="/contact/edit/:contactId" element={<EditContact />} />
              {user?.role === 'admin' && <Route path="/admin" element={<Admin />} />}
              {user?.role === 'admin' && <Route path="/admin/users/new" element={<AdminAddUser />} />}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  )
}
