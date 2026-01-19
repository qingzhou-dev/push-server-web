import http from './http'

export interface PortalResponse<T> {
  success: boolean
  message: string
  data: T
}

export const ensureCsrfToken = async () => {
  const response = await http.get<PortalResponse<string>>('/v2/auth/csrf')
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch CSRF token')
  }
  return response.data
}

export const unwrapPortalResponse = <T>(response: PortalResponse<T>) => {
  if (!response.success) {
    throw new Error(response.message || 'Request failed')
  }
  return response.data
}
