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
  success: boolean
  errorMessage?: string | null
  createdAt: number
}
