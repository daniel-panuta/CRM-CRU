import { Link, useNavigate } from 'react-router-dom'

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 3v8h8V3zM3 21h8v-6H3z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10.3 3.2h3.4l.6 2a7.9 7.9 0 0 1 1.8.8l2-.8 1.7 3-1.5 1.5c.2.6.3 1.2.3 1.8s-.1 1.2-.3 1.8l1.5 1.5-1.7 3-2-.8a7.9 7.9 0 0 1-1.8.8l-.6 2h-3.4l-.6-2a7.9 7.9 0 0 1-1.8-.8l-2 .8-1.7-3 1.5-1.5a7 7 0 0 1-.3-1.8c0-.6.1-1.2.3-1.8L4.8 8.2l1.7-3 2 .8a7.9 7.9 0 0 1 1.8-.8z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  )
}

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="crm-sidebar">
      <div className="mb-8 space-y-2">
        <p className="crm-label">CRMContacte</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Contact Manager</h1>
        <p className="text-sm leading-6 text-slate-500">Minimal workspace for shared contact data.</p>
      </div>

      <nav className="space-y-2">
        <Link to="/dashboard" className="crm-nav-link">
          <IconDashboard />
          Dashboard
        </Link>
        <Link to="/add" className="crm-nav-link">
          <IconPlus />
          Add contact
        </Link>
        <Link to="/profile" className="crm-nav-link">
          <IconUser />
          My profile
        </Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className="crm-nav-link">
            <IconSettings />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-5">
        {user && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-900">{user.name}</p>
            <p className="mt-1 break-all text-xs text-slate-500">{user.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="crm-button-secondary w-full justify-start"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
