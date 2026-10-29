import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, getToken } from '../api/client'
import AuthLayout from '../components/AuthLayout'

export default function RegisterPage() {
  const navigate = useNavigate()
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
      await api.register(email, password)
      navigate('/login', { replace: true, state: { message: 'Аккаунт создан. Теперь войдите в систему.' } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось создать аккаунт.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout subtitle="Создайте аккаунт, чтобы сокращать ссылки и анализировать переходы.">
      <form className="mt-7 space-y-4" onSubmit={submit}>
        {error && <div className="notice-error" role="alert">{error}</div>}
        <label className="field-label">Электронная почта
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <label className="field-label">Пароль
          <input className="input" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 6 символов" />
        </label>
        <p className="text-xs leading-5 text-muted">Минимум 6 символов. Используйте пароль, который нигде больше не применяете.</p>
        <button className="button-primary w-full" disabled={busy}>{busy ? 'Создаём аккаунт…' : 'Создать аккаунт'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Уже зарегистрированы? <Link to="/login" className="auth-link font-semibold text-brand">Войти</Link></p>
    </AuthLayout>
  )
}
