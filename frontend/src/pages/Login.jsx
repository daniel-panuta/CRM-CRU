import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Login({ setIsAuthenticated, setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { loading, error, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await login(email, password)
      setUser(data.user)
      setIsAuthenticated(true)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="crm-auth-shell">
      <div className="crm-auth-grid">
        <div className="crm-auth-visual">
          <div>
            <p className="crm-label text-white/60">CRMContacte</p>
            <h1 className="mt-4 max-w-sm text-4xl font-semibold tracking-tight md:text-5xl">Minimal contact management for focused teams.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              Clean lists, quick filters, and shared records designed to stay out of the way.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Share</p>
              <p className="mt-2 text-sm text-white/80">Centralized contacts</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Filter</p>
              <p className="mt-2 text-sm text-white/80">Column-based search</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Simple</p>
              <p className="mt-2 text-sm text-white/80">Minimal setup</p>
            </div>
          </div>
        </div>

        <div className="crm-auth-card">
          <div className="crm-auth-inner">
            <p className="crm-label">Access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Sign in to continue</h2>
            <p className="mt-3 text-sm text-slate-500">
              Use your account credentials. New users are created by admin only.
            </p>

            {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="crm-input"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="crm-input"
              />

              <button type="submit" disabled={loading} className="crm-button-primary w-full">
                {loading ? 'Loading...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/reset')}
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
