import type {
  CreateLinkInput,
  DailyClicks,
  LinkItem,
  LinkStats,
  Referrer,
  UpdateLinkInput,
  User,
} from './types'
import { mockRequest } from './mock'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const TOKEN_KEY = 'shortener_access_token'
export const UNAUTHORIZED_EVENT = 'shortener:unauthorized'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface ApiOptions extends RequestInit {
  auth?: boolean
}

function validationMessage(details: unknown): string {
  if (typeof details === 'string') return details
  if (Array.isArray(details)) {
    const messages = details.map((item) => {
      if (typeof item === 'object' && item !== null && 'msg' in item) {
        const field = 'loc' in item && Array.isArray(item.loc) ? item.loc.at(-1) : null
        return `${field ? `${String(field)}: ` : ''}${String(item.msg)}`
      }
      return String(item)
    })
    return messages.join('; ')
  }
  return 'Не удалось выполнить запрос. Попробуйте ещё раз.'
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = false, ...init } = options
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return mockRequest<T>(path, { ...init, auth })
  }

  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте подключение и адрес API.')
  }

  if (response.status === 401) {
    clearToken()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }
  if (!response.ok) {
    if (response.status === 204) return undefined as T
    let message = `Ошибка сервера (${response.status}).`
    try {
      const body: unknown = await response.json()
      if (typeof body === 'object' && body !== null && 'detail' in body) {
        message = validationMessage(body.detail)
      }
    } catch {
      // Keep the status-based message when the server response is not JSON.
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  const body = await response.text()
  return body ? JSON.parse(body) as T : undefined as T
}

export const api = {
  register(email: string, password: string): Promise<void> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  me(): Promise<User> {
    return request('/auth/me', { auth: true })
  },
  links(limit: number, offset: number, isActive?: boolean): Promise<LinkItem[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (isActive !== undefined) params.set('is_active', String(isActive))
    return request(`/links?${params}`, { auth: true })
  },
  createLink(input: CreateLinkInput): Promise<LinkItem> {
    return request('/links', { method: 'POST', body: JSON.stringify(input), auth: true })
  },
  link(id: number): Promise<LinkItem> {
    return request(`/links/${id}`, { auth: true })
  },
  updateLink(id: number, input: UpdateLinkInput): Promise<LinkItem> {
    return request(`/links/${id}`, { method: 'PATCH', body: JSON.stringify(input), auth: true })
  },
  deleteLink(id: number): Promise<void> {
    return request(`/links/${id}`, { method: 'DELETE', auth: true })
  },
  stats(id: number): Promise<LinkStats> {
    return request(`/links/${id}/stats`, { auth: true })
  },
  daily(id: number, from: string, to: string): Promise<DailyClicks[]> {
    const params = new URLSearchParams({ from, to })
    return request(`/links/${id}/stats/daily?${params}`, { auth: true })
  },
  referrers(id: number): Promise<Referrer[]> {
    return request(`/links/${id}/stats/referrers`, { auth: true })
  },
}
