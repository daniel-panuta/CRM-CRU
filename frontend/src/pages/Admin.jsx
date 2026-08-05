import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import { API_URL } from '../lib/api'

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const token = localStorage.getItem('token')

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError('')
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/info`, { headers })
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to load admin data')
      console.error('Failed to fetch admin data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.post(`${API_URL}/admin/users/${userId}/role?role=${newRole}`, {}, { headers })
      await fetchData()
    } catch (err) {
      alert('Failed to update user role')
      console.error(err)
    }
  }

  const handleDeleteClick = (user) => {
    setDeleteTarget(user)
    setShowDeleteModal(true)
  }

  const handlePasswordClick = (user) => {
    setPasswordTarget(user)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  const handleUpdatePassword = async () => {
    if (!passwordTarget) return
    if (!newPassword.trim()) {
      setError('Password cannot be empty.')
      return
    }

    try {
      await axios.put(`${API_URL}/admin/users/${passwordTarget.id}/password`, {
        password: newPassword
      }, { headers })
      setShowPasswordModal(false)
      setPasswordTarget(null)
      setNewPassword('')
      setError('')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to update password')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      await axios.delete(`${API_URL}/admin/users/${deleteTarget.id}`, { headers })
      setUsers(users.filter(u => u.id !== deleteTarget.id))
      setShowDeleteModal(false)
      setDeleteTarget(null)
    } catch (err) {
      alert('Failed to delete user')
      console.error(err)
    }
  }

  if (loading) return <div className="crm-panel p-6">Loading admin panel...</div>

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name || deleteTarget?.email}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeleteTarget(null)
        }}
        confirmText="Delete"
        confirmColor="red"
      />

      <div className="crm-hero">
        <p className="crm-label">Administration</p>
        <h1 className="crm-page-title">Admin Panel</h1>
        <p className="crm-page-subtitle">Manage users and system settings.</p>
        <div className="mt-5">
          <button type="button" onClick={() => navigate('/admin/users/new')} className="crm-button-primary">
            + Add New User
          </button>
        </div>
      </div>

      {error && <div className="crm-panel border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="crm-kpi">
            <p className="crm-label">Total Users</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total_users}</p>
          </div>
          <div className="crm-kpi">
            <p className="crm-label">Admins</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.admins}</p>
          </div>
          <div className="crm-kpi">
            <p className="crm-label">Regular Users</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.regular_users}</p>
          </div>
        </div>
      )}

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="font-semibold text-slate-900">{user.name || '—'}</div>
                </td>
                <td>
                  <div className="text-slate-600">{user.email}</div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="crm-input py-1 px-2 text-xs w-auto"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </td>
                <td>
                  <div className="text-slate-600 text-sm">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePasswordClick(user)}
                      className="inline-flex items-center justify-center rounded bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100 transition text-xs font-medium"
                      title="Change password"
                    >
                      Password
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="Delete user"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="crm-panel mx-4 w-full max-w-md space-y-5 p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Change User Password</h2>
              <p className="mt-2 text-sm text-slate-600">Set a new password for {passwordTarget?.email}</p>
            </div>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="crm-input"
              placeholder="New password"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordTarget(null)
                  setNewPassword('')
                }}
                className="crm-button-secondary flex-1"
              >
                Cancel
              </button>
              <button type="button" onClick={handleUpdatePassword} className="crm-button-primary flex-1">
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
