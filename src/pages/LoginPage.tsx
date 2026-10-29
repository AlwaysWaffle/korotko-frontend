import { FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../api/client'
import AuthLayout from '../components/AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (getToken()) return <Navigate to="/links" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api.login(email, password)
      setToken(result.access_token)
      if (import.meta.env.VITE_USE_MOCK === 'true') localStorage.setItem('shortener_mock_email', email)
      navigate('/links', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось войти.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout subtitle="Войдите в аккаунт, чтобы управлять ссылками и смотреть статистику.">
      <form className="mt-7 space-y-4" onSubmit={submit}>
        {Boolean((location.state as { message?: string } | null)?.message) && (
          <div className="notice-success" role="status">{(location.state as { message: string }).message}</div>
        )}
        {error && <div className="notice-error" role="alert">{error}</div>}
        <label className="field-label">Электронная почта
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <label className="field-label">Пароль
          <input className="input" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 6 символов" />
        </label>
        <button className="button-primary w-full" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Нет аккаунта? <Link to="/register" className="auth-link font-semibold text-brand">Создать</Link></p>
    </AuthLayout>
  )
}
