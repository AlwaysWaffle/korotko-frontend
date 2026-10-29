import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import type { DailyClicks, LinkItem, LinkStats, Referrer } from '../api/types'
import { EmptyState, ErrorMessage, Loading } from '../components/States'

const dateInput = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

export default function StatsPage() {
  const { id } = useParams()
  const linkId = Number(id)
  const [link, setLink] = useState<LinkItem | null>(null)
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [daily, setDaily] = useState<DailyClicks[]>([])
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [from, setFrom] = useState(dateInput(new Date(Date.now() - 13 * 86400000)))
  const [to, setTo] = useState(dateInput(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!Number.isInteger(linkId) || linkId < 1) {
      setError('Некорректный идентификатор ссылки.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [linkResult, statsResult, dailyResult, referrerResult] = await Promise.all([
        api.link(linkId),
        api.stats(linkId),
        api.daily(linkId, from, to),
        api.referrers(linkId),
      ])
      setLink(linkResult)
      setStats(statsResult)
      setDaily(dailyResult)
      setReferrers(referrerResult)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось загрузить статистику.')
    } finally {
      setLoading(false)
    }
  }, [linkId, from, to])

  useEffect(() => { void loadData() }, [loadData])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/links" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand">← Все ссылки</Link>
      <div className="mb-7">
        <p className="eyebrow">АНАЛИТИКА</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Статистика ссылки</h1>
        {link && <a className="mt-2 inline-block max-w-full truncate text-sm font-medium text-brand hover:underline" href={link.short_url} target="_blank" rel="noreferrer">{link.short_url}</a>}
      </div>

      {error && <div className="mb-5"><ErrorMessage message={error} onRetry={loadData} /></div>}
      {loading ? <Loading label="Загружаем статистику…" /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="stat-card">
              <span className="stat-icon">↗</span>
              <p className="mt-4 text-sm font-medium text-muted">Всего переходов</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{stats?.total_clicks.toLocaleString('ru-RU') ?? '—'}</p>
            </div>
            <div className="stat-card">
              <span className="stat-icon stat-icon-green">◎</span>
              <p className="mt-4 text-sm font-medium text-muted">Уникальные посетители</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{stats?.unique_visitors.toLocaleString('ru-RU') ?? '—'}</p>
            </div>
          </div>

          <section className="panel mb-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">Переходы по дням</h2>
                <p className="mt-1 text-sm text-muted">Динамика посещений за выбранный период.</p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="field-label text-xs">С
                  <input className="input py-2" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
                </label>
                <label className="field-label text-xs">По
                  <input className="input py-2" type="date" value={to} min={from} max={dateInput(new Date())} onChange={(event) => setTo(event.target.value)} />
                </label>
              </div>
            </div>
            {daily.length === 0 ? <EmptyState title="Нет данных за этот период" text="Попробуйте выбрать другой период." /> : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`))} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(value) => new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date(`${String(value)}T00:00:00`))}
                      contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '.65rem' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      itemStyle={{ color: 'var(--accent)' }}
                    />
                    <Line type="monotone" dataKey="clicks" name="Переходы" stroke="var(--accent)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: 'var(--accent)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-ink">Источники переходов</h2>
              <p className="mt-1 text-sm text-muted">Откуда приходят посетители.</p>
            </div>
            {referrers.length === 0 ? <EmptyState title="Пока нет источников" text="Источники появятся после первых переходов." /> : (
              <div className="table-divider">
                {referrers.map((item, index) => {
                  const percentage = stats?.total_clicks ? Math.round((item.clicks / stats.total_clicks) * 100) : 0
                  return (
                    <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0" key={`${item.referrer}-${index}`}>
                      <span className="referrer-index flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-ink">{item.referrer || 'Прямой переход'}</span>
                          <span className="whitespace-nowrap text-muted">{item.clicks.toLocaleString('ru-RU')} <span className="referrer-percentage">· {percentage}%</span></span>
                        </div>
                        <div className="progress-track h-1.5 overflow-hidden rounded-full"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
