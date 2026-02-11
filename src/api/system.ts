import http from './http'
import { ensureCsrfToken, unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface VersionData {
  version: string
}

export interface TurnstileConfig {
  enabled: boolean
  siteKey: string
  secretKey: string
}

export const getCurrentVersion = () => {
  return http.get<ApiResponse<VersionData>>('/system/version')
}

export const getIgnoredVersion = () => {
  return http.get<ApiResponse<VersionData>>('/system/version/ignore')
}

export const ignoreVersion = (version: string) => {
  return http.post<ApiResponse<null>>('/system/version/ignore', { version })
}

export const fetchTurnstileConfig = async () => {
  const response = await http.get<PortalResponse<TurnstileConfig>>('/system/turnstile')
  return unwrapPortalResponse(response)
}

export const updateTurnstileConfig = async (payload: TurnstileConfig) => {
  await ensureCsrfToken()
  const response = await http.put<PortalResponse<null>>('/system/turnstile', payload)
  return unwrapPortalResponse(response)
}
