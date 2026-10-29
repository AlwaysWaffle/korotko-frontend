import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { LinkItem } from '../api/types'
import { EmptyState, ErrorMessage, Loading } from '../components/States'

const LIMIT = 8
const localDateTimeInput = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

function displayDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function statusOf(link: LinkItem) {
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { text: 'Истекла', style: 'status-expired' }
  return link.is_active ? { text: 'Активна', style: 'status-active' } : { text: 'Отключена', style: 'status-disabled' }
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<'all' | 'true' | 'false'>('all')
  const [offset, setOffset] = useState(0)
  const [originalUrl, setOriginalUrl] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const loadLinks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await api.links(LIMIT, offset, filter === 'all' ? undefined : filter === 'true')
      const withClicks = await Promise.all(results.map(async (link) => {
        const stats = await api.stats(link.id)
        return { ...link, clicks: stats.total_clicks }
      }))
      setLinks(withClicks)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось загрузить ссылки.')
    } finally {
      setLoading(false)
    }
  }, [filter, offset])

  useEffect(() => { void loadLinks() }, [loadLinks])

  async function createLink(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    setError('')
    setBusy(true)
    try {
      await api.createLink({
        original_url: originalUrl,
        ...(customCode.trim() ? { custom_code: customCode.trim() } : {}),
        ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
      })
      setOriginalUrl('')
      setCustomCode('')
      setExpiresAt('')
      setOffset(0)
      setNotice('Ссылка создана.')
      if (offset === 0) await loadLinks()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось создать ссылку.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(link: LinkItem) {
    setError('')
    try {
      await api.updateLink(link.id, { is_active: !link.is_active })
      await loadLinks()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось изменить ссылку.')
    }
  }

  async function deleteLink(link: LinkItem) {
    if (!window.confirm(`Удалить ссылку ${link.short_url}?`)) return
    setError('')
    try {
      await api.deleteLink(link.id)
      await loadLinks()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось удалить ссылку.')
    }
  }

  async function copyLink(link: LinkItem) {
    try {
      await navigator.clipboard.writeText(link.short_url)
      setNotice('Короткая ссылка скопирована.')
    } catch {
      setError('Не удалось скопировать ссылку. Проверьте разрешение браузера.')
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">ВАША ПАНЕЛЬ</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Мои ссылки</h1>
          <p className="mt-2 text-sm text-muted">Создавайте короткие ссылки и следите за переходами.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm text-muted shadow-sm">{links.length} на странице</span>
      </div>

      <section className="panel mb-6">
        <h2 className="text-lg font-semibold text-ink">Сократить ссылку</h2>
        <p className="mt-1 text-sm text-muted">Вставьте длинный адрес — остальное мы сделаем.</p>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={createLink}>
          <label className="field-label md:col-span-2">Исходная ссылка
            <input className="input" type="url" required value={originalUrl} onChange={(event) => setOriginalUrl(event.target.value)} placeholder="https://example.com/your/long/url" />
          </label>
          <label className="field-label">Свой короткий код <span className="font-normal text-muted">(необязательно)</span>
            <div className="flex">
              <span className="input-prefix">/</span>
              <input className="input rounded-l-none" value={customCode} onChange={(event) => setCustomCode(event.target.value)} placeholder="my-link" pattern="[A-Za-z0-9_-]+" title="Используйте латинские буквы, цифры, дефис или подчёркивание" />
            </div>
          </label>
          <label className="field-label">Срок действия <span className="font-normal text-muted">(необязательно)</span>
            <input className="input" type="datetime-local" value={expiresAt} min={localDateTimeInput()} onChange={(event) => setExpiresAt(event.target.value)} />
          </label>
          <div className="md:col-span-2">
            <button className="button-primary" disabled={busy}>{busy ? 'Создаём…' : '＋  Создать ссылку'}</button>
          </div>
        </form>
      </section>

      {notice && <div className="notice-success mb-4" role="status">{notice}<button className="ml-auto" onClick={() => setNotice('')} aria-label="Закрыть">×</button></div>}
      {error && <div className="mb-4"><ErrorMessage message={error} onRetry={loadLinks} /></div>}

      <section className="panel overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-ink">Все ссылки</h2>
            <p className="mt-0.5 text-xs text-muted">Управляйте ссылками и открывайте аналитику.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            Статус
            <select className="select-input" value={filter} onChange={(event) => { setOffset(0); setFilter(event.target.value as typeof filter) }}>
              <option value="all">Все</option>
              <option value="true">Активные</option>
              <option value="false">Отключённые</option>
            </select>
          </label>
        </div>
        {loading ? <Loading label="Загружаем ваши ссылки…" /> : links.length === 0 ? (
          <EmptyState title="Здесь пока пусто" text="Создайте первую короткую ссылку с помощью формы выше." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="table-head"><tr><th>Ссылка</th><th>Оригинальный URL</th><th>Создана</th><th>Статус</th><th>Переходы</th><th className="text-right">Действия</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {links.map((link) => {
                    const status = statusOf(link)
                    return (
                      <tr key={link.id} className="table-row">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <a className="font-semibold text-brand hover:underline" href={link.short_url} target="_blank" rel="noreferrer">{link.short_url}</a>
                            <button onClick={() => void copyLink(link)} className="icon-button" title="Копировать" aria-label="Копировать короткую ссылку">▢</button>
                          </div>
                        </td>
                        <td className="max-w-56 truncate px-5 py-4 text-muted" title={link.original_url}>{link.original_url}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted">{displayDate(link.created_at)}</td>
                        <td className="px-5 py-4"><span className={status.style}>{status.text}</span></td>
                        <td className="px-5 py-4 font-medium text-ink">{link.clicks ?? '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                            <Link to={`/links/${link.id}/stats`} className="font-medium text-brand hover:underline">Статистика</Link>
                            <button onClick={() => void toggleActive(link)} className="table-action">{link.is_active ? 'Выключить' : 'Включить'}</button>
                            <button onClick={() => void deleteLink(link)} className="table-danger">Удалить</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm sm:px-6">
              <span className="text-muted">Страница {Math.floor(offset / LIMIT) + 1}</span>
              <div className="flex gap-2">
                <button className="button-quiet" onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}>Назад</button>
                <button className="button-quiet" onClick={() => setOffset(offset + LIMIT)} disabled={links.length < LIMIT}>Далее</button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
