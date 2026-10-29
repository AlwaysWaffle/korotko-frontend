import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function AuthLayout({ children, subtitle }: { children: React.ReactNode; subtitle: string }) {
  return (
    <main className="auth-page">
      <header className="auth-theme-header">
        <ThemeToggle />
      </header>
      <Link to="/login" className="brand-lockup mb-8">
        <span className="brand-mark">↗</span>
        <span>коротко</span>
      </Link>
      <section className="panel w-full max-w-md rounded-2xl p-7 sm:p-9">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Ссылки под контролем</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        {children}
      </section>
      <p className="mt-6 text-xs text-muted">Просто делитесь. Умно анализируйте.</p>
    </main>
  )
}
