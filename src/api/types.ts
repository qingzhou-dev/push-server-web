export interface PortalUserResponse {
  id: number
  account: string
  createdAt: number
  updatedAt: number
}

export interface PortalAppResponse {
  id: number
  agentId: string
  name: string
  avatarUrl?: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface PortalAppApiKeyResponse {
  appId: number
  hasKey: boolean
  apiKey?: string | null
  rateLimitPerMinute?: number | null
  createdAt?: number | null
  updatedAt?: number | null
}

export interface PortalMessageArticle {
  title: string
  url: string
  description?: string
  picUrl?: string
}

export interface PortalMessageLogResponse {
  id: number
  appId: number
  agentId: string
  msgType: string
  toUser?: string
  toParty?: string
  toAll?: boolean
  title?: string
  description?: string
  url?: string
  content?: string
  articles?: PortalMessageArticle[]
  success: boolean
  errorMessage?: string | null
  createdAt: number
}

export interface PortalPageResponse<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}
