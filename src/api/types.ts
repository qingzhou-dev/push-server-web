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

export interface PortalPluginResponse {
  id: number
  pluginKey: string
  name: string
  description?: string
  status: number
  createdAt: number
  isConnected: boolean
  isBuiltin: boolean
  meta?: PluginMeta
}

export interface PluginConfigField {
  name: string
  label: string
  description?: string
  type: 'TEXT' | 'PASSWORD' | 'BOOLEAN' | 'SELECT' | 'NUMBER' | 'TEXTAREA' | string
  defaultValue?: any
  required?: boolean
  options?: { label: string; value: any; description?: string }[]
}

export interface PluginMeta {
  configFields?: PluginConfigField[]
  [key: string]: any
}

export interface AppPluginResponse {
  pluginKey: string
  name: string
  description?: string
  meta: PluginMeta
  configJson: string
  status: number
  updatedAt: number
}

export interface PluginActionLogResponse {
  pluginKey: string
  eventId: string
  status: string | number
  message: string
  appId?: number
  appName?: string
  userId?: string
  type?: string
  content?: string
  pluginConfig?: string
  createdAt: number
}

export interface PluginHeartbeatLogResponse {
  pluginKey: string
  currentInflight: number
  uptimeSeconds: number
  createdAt: number
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

export interface DashboardStatsResponse {
  todayTotal: number
  successRate: number
  activeApps: number
  lastErrorTime: string | null
}

export interface DashboardTrendPoint {
  date: string
  count: number
}

export interface DashboardDistributionItem {
  name: string
  value: number
}

export interface DashboardChartsResponse {
  trend: DashboardTrendPoint[]
  distribution: DashboardDistributionItem[]
}

export interface DashboardRecentLogItem {
  time: string
  appName: string
  receiver: string
  status: number
  errorMsg: string
}
