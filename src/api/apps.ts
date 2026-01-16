import http from './http'
import { ensureCsrfToken, unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'
import type { PortalAppResponse } from './types'

export interface CreateAppPayload {
  agentId: string
  secret: string
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
