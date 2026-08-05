import axios from 'axios'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_URL } from '../lib/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // request, confirm
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleRequestReset = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await axios.post(`${API_URL}/auth/reset-request`, { email })
      setMessage('Check your email for password reset instructions')
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e) => {
    e.preventDefault()
    
    if (!token) {
      setError('Invalid reset link')
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await axios.post(`${API_URL}/auth/reset-confirm`, {
        token,
        new_password: newPassword
      })
      setMessage('Password reset successful! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // If token is in URL, show reset form directly
  if (token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="crm-panel p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
            <p className="text-slate-600 mb-6">Enter your new password below</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="crm-label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="crm-input mt-1"
                  required
                />
              </div>

              <div>
                <label className="crm-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="crm-input mt-1"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="crm-button w-full"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full crm-button-secondary"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Request reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="crm-panel p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h1>
          <p className="text-slate-600 mb-6">Enter your email to receive a password reset link</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="crm-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="crm-input mt-1"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="crm-button w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <button
            onClick={() => navigate('/login')}
            className="mt-4 w-full crm-button-secondary"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
