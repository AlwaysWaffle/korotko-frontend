import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { api, clearToken, getToken, UNAUTHORIZED_EVENT } from '../api/client'
import ThemeToggle from './ThemeToggle'

export default function ProtectedLayout() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const token = getToken()

  useEffect(() => {
    if (!token) return
    const redirect = () => navigate('/login', { replace: true })
    window.addEventListener(UNAUTHORIZED_EVENT, redirect)
    api.me().then((user) => setEmail(user.email)).catch(() => undefined)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, redirect)
  }, [navigate, token])

  if (!token) return <Navigate to="/login" replace />

  function logout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="application-shell">
      <header className="app-header">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/links" className="brand-lockup">
            <span className="brand-mark">↗</span>
            <span>коротко</span>
          </Link>
          <div className="flex items-center gap-3">
            {email && <span className="hidden text-sm text-muted sm:inline">{email}</span>}
            <ThemeToggle />
            <button onClick={logout} className="button-quiet">Выйти</button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
