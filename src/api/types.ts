export interface User {
  id: number
  email: string
  created_at: string
}

export interface LinkItem {
  id: number
  code: string
  short_url: string
  original_url: string
  expires_at: string | null
  is_active: boolean
  created_at: string
  clicks?: number
}

export interface CreateLinkInput {
  original_url: string
  custom_code?: string
  expires_at?: string
}

export interface UpdateLinkInput {
  original_url?: string
  expires_at?: string | null
  is_active?: boolean
}

export interface LinkStats {
  total_clicks: number
  unique_visitors: number
}

export interface DailyClicks {
  date: string
  clicks: number
}

export interface Referrer {
  referrer: string
  clicks: number
}
