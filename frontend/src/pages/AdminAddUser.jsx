import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'

export default function AdminAddUser() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/admin/users`, {
        name: formData.name.trim() || null,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      }, { headers })

      navigate('/admin')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="crm-hero">
        <p className="crm-label">Administration</p>
        <h1 className="crm-page-title">Add New User</h1>
        <p className="crm-page-subtitle">Only admins can create new accounts.</p>
      </div>

      {error && <div className="crm-panel border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="crm-panel space-y-5 p-6 md:p-8">
        <label className="space-y-2 block">
          <span className="crm-label">Full Name</span>
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="User name"
            className="crm-input"
          />
        </label>

        <label className="space-y-2 block">
          <span className="crm-label">Email</span>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            className="crm-input"
            required
          />
        </label>

        <label className="space-y-2 block">
          <span className="crm-label">Password</span>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Set initial password"
            className="crm-input"
            required
          />
        </label>

        <label className="space-y-2 block">
          <span className="crm-label">Role</span>
          <select name="role" value={formData.role} onChange={handleChange} className="crm-input">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="flex flex-col gap-3 pt-2 md:flex-row">
          <button type="submit" className="crm-button-primary flex-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </button>
          <button type="button" onClick={() => navigate('/admin')} className="crm-button-secondary flex-1">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
