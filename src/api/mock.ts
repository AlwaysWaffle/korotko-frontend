import type { DailyClicks, LinkItem, Referrer, UpdateLinkInput } from './types'

const LINKS_KEY = 'shortener_mock_links'
const MOCK_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
let nextId = 4
const initialLinks: LinkItem[] = [
  {
    id: 1,
    code: 'launch',
    short_url: `${MOCK_ORIGIN}/launch`,
    original_url: 'https://example.com/products/new-launch',
    expires_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    clicks: 128,
  },
  {
    id: 2,
    code: 'weekly',
    short_url: `${MOCK_ORIGIN}/weekly`,
    original_url: 'https://example.com/blog/weekly-product-updates',
    expires_at: null,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    clicks: 76,
  },
  {
    id: 3,
    code: 'oldpromo',
    short_url: `${MOCK_ORIGIN}/oldpromo`,
    original_url: 'https://example.com/promotion',
    expires_at: null,
    is_active: false,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    clicks: 42,
  },
]

function readLinks(): LinkItem[] {
  const saved = localStorage.getItem(LINKS_KEY)
  if (!saved) {
    localStorage.setItem(LINKS_KEY, JSON.stringify(initialLinks))
    return [...initialLinks]
  }
  try {
    return JSON.parse(saved) as LinkItem[]
  } catch {
    throw new Error('Не удалось прочитать тестовые ссылки из localStorage.')
  }
}

function saveLinks(links: LinkItem[]): void {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links))
}

function mockError(message: string): never {
  throw new Error(message)
}

export async function mockRequest<T>(path: string, options: RequestInit & { auth?: boolean }): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 250))
  const method = options.method || 'GET'
  const url = new URL(path, window.location.origin)
  const pathname = url.pathname

  if (pathname === '/auth/register' && method === 'POST') return undefined as T
  if (pathname === '/auth/login' && method === 'POST') {
    return { access_token: 'mock-access-token', token_type: 'bearer' } as T
  }
  if (pathname === '/auth/me') {
    return { id: 1, email: localStorage.getItem('shortener_mock_email') || 'demo@example.com', created_at: new Date().toISOString() } as T
  }

  const links = readLinks()
  if (pathname === '/links' && method === 'GET') {
    const params = url.searchParams
    const limit = Number(params.get('limit') || 10)
    const offset = Number(params.get('offset') || 0)
    const active = params.get('is_active')
    return links
      .filter((link) => active === null || String(link.is_active) === active)
      .slice(offset, offset + limit) as T
  }
  if (pathname === '/links' && method === 'POST') {
    const input = JSON.parse(String(options.body || '{}')) as {
      original_url: string
      custom_code?: string
      expires_at?: string
    }
    if (links.some((link) => link.code === input.custom_code)) mockError('Этот короткий код уже занят.')
    const code = input.custom_code || Math.random().toString(36).slice(2, 8)
    const link: LinkItem = {
      id: nextId++,
      code,
      short_url: `${MOCK_ORIGIN}/${code}`,
      original_url: input.original_url,
      expires_at: input.expires_at || null,
      is_active: true,
      created_at: new Date().toISOString(),
      clicks: 0,
    }
    saveLinks([link, ...links])
    return link as T
  }

  const match = pathname.match(/^\/links\/(\d+)(?:\/stats(?:\/(daily|referrers))?)?$/)
  if (!match) return mockError('Тестовый API: неизвестный адрес запроса.')
  const id = Number(match[1])
  const suffix = match[2]
  const link = links.find((item) => item.id === id)
  if (!link) return mockError('Ссылка не найдена.')

  if (suffix === 'daily') {
    const params = url.searchParams
    const start = new Date(`${params.get('from')}T00:00:00`)
    const end = new Date(`${params.get('to')}T00:00:00`)
    const daily: DailyClicks[] = []
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      daily.push({
        date: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`,
        clicks: Math.max(0, Math.round((link.clicks || 0) * (0.25 + Math.random() * 0.75) / 14)),
      })
    }
    return daily as T
  }
  if (suffix === 'referrers') {
    return [
      { referrer: 'google.com', clicks: Math.round((link.clicks || 0) * 0.42) },
      { referrer: 't.me', clicks: Math.round((link.clicks || 0) * 0.28) },
      { referrer: 'direct', clicks: Math.round((link.clicks || 0) * 0.19) },
      { referrer: 'Другие источники', clicks: Math.round((link.clicks || 0) * 0.11) },
    ] satisfies Referrer[] as T
  }
  if (pathname.endsWith('/stats')) {
    return { total_clicks: link.clicks || 0, unique_visitors: Math.round((link.clicks || 0) * 0.68) } as T
  }
  if (method === 'GET') return link as T
  if (method === 'PATCH') {
    const input = JSON.parse(String(options.body || '{}')) as UpdateLinkInput
    const updated = { ...link, ...input }
    saveLinks(links.map((item) => (item.id === id ? updated : item)))
    return updated as T
  }
  if (method === 'DELETE') {
    saveLinks(links.filter((item) => item.id !== id))
    return undefined as T
  }
  return mockError('Тестовый API: операция не поддерживается.')
}
