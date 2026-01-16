import http from './http'

export interface PortalResponse<T> {
  success: boolean
  message: string
  data: T
}

export const ensureCsrfToken = async () => {
  const response = await http.get<PortalResponse<string>>('/v2/auth/csrf')
  if (!response.success) {
    throw new Error(response.message || '获取 CSRF 失败')
  }
}

export const unwrapPortalResponse = <T>(response: PortalResponse<T>) => {
  if (!response.success) {
    throw new Error(response.message || '请求失败')
  }
  return response.data
}
