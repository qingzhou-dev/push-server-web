import http from './http'
import { ensureCsrfToken, unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'
import type {
  PortalAppApiKeyResponse,
  PortalAppResponse,
} from './types'

export interface CreateAppPayload {
  agentId: string
  secret: string
}

export interface UpdateAppPayload {
  secret?: string
  token?: string
  encodingAesKey?: string
}

export interface UpdateAppApiKeyPayload {
  rateLimitPerMinute: number | null
}

export const fetchApps = async () => {
  const response = await http.get<PortalResponse<PortalAppResponse[]>>('/v2/apps')
  return unwrapPortalResponse(response)
}

export const createApp = async (payload: CreateAppPayload) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<PortalAppResponse>>(
    '/v2/apps',
    payload,
  )
  return unwrapPortalResponse(response)
}

export const updateApp = async (appId: number, payload: UpdateAppPayload) => {
  await ensureCsrfToken()
  const response = await http.put<PortalResponse<PortalAppResponse>>(
    `/v2/apps/${appId}`,
    payload,
  )
  return unwrapPortalResponse(response)
}

export const deleteApp = async (appId: number) => {
  await ensureCsrfToken()
  const response = await http.delete<PortalResponse<null>>(`/v2/apps/${appId}`)
  return unwrapPortalResponse(response)
}

export const syncApp = async (appId: number) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<PortalAppResponse>>(
    `/v2/apps/${appId}/sync`,
  )
  return unwrapPortalResponse(response)
}

export const fetchAppApiKey = async (appId: number) => {
  const response = await http.get<PortalResponse<PortalAppApiKeyResponse>>(
    `/v2/apps/${appId}/api-key`,
  )
  return unwrapPortalResponse(response)
}

export const createAppApiKey = async (appId: number) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<PortalAppApiKeyResponse>>(
    `/v2/apps/${appId}/api-key`,
  )
  return unwrapPortalResponse(response)
}

export const updateAppApiKey = async (
  appId: number,
  payload: UpdateAppApiKeyPayload,
) => {
  await ensureCsrfToken()
  const response = await http.put<PortalResponse<PortalAppApiKeyResponse>>(
    `/v2/apps/${appId}/api-key`,
    payload,
  )
  return unwrapPortalResponse(response)
}

export const deleteAppApiKey = async (appId: number) => {
  await ensureCsrfToken()
  const response = await http.delete<PortalResponse<null>>(
    `/v2/apps/${appId}/api-key`,
  )
  return unwrapPortalResponse(response)
}
