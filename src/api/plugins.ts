import http from './http'
import { ensureCsrfToken, unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'
import type { PortalPluginResponse } from './types'

export interface CreatePluginPayload {
  pluginKey: string
  name: string
  description?: string
}

export interface TogglePluginStatusPayload {
  id: number
  status: number
}

export const fetchPlugins = async () => {
  const response = await http.get<PortalResponse<PortalPluginResponse[]>>('/v2/plugin/list')
  return unwrapPortalResponse(response)
}

export const createPlugin = async (payload: CreatePluginPayload) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<string>>(
    '/v2/plugin/create',
    payload,
  )
  return unwrapPortalResponse(response)
}

export const resetPluginToken = async (id: number) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<string>>(
    '/v2/plugin/reset-token',
    { id }
  )
  return unwrapPortalResponse(response)
}

export const togglePluginStatus = async (payload: TogglePluginStatusPayload) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<null>>(
    '/v2/plugin/status',
    payload,
  )
  return unwrapPortalResponse(response)
}

export const deletePlugin = async (id: number) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<null>>(
    '/v2/plugin/delete',
    { id }
  )
  return unwrapPortalResponse(response)
}
