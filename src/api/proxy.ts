import http from './http'

export interface ProxyConfig {
  id?: number
  host: string
  port: number
  username?: string
  password?: string
  type: 'HTTP' | 'SOCKS5'
  exitIp?: string
  active: boolean
  createdAt?: number
  updatedAt?: number
}

export interface ProxyResponse<T> {
  success: boolean
  message: string
  data: T
}

export const fetchProxyConfig = async () => {
  const response = await http.get<ProxyResponse<ProxyConfig | null>>('/v2/proxy')
  if (response.success) {
    return response.data
  }
  throw new Error(response.message || 'Failed to fetch proxy config')
}

export const saveProxyConfig = async (config: Omit<ProxyConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
  const response = await http.put<ProxyResponse<ProxyConfig>>('/v2/proxy', config)
  // Even if connection test fails (success=false), we might want to handle it specifically if data is returned?
  // According to doc: "if success: false but saved, user needs to know".
  // However, standardized handling usually throws on !success.
  // Let's stick to standard handling but allow message propagation.
  if (response.success) {
    return response.data
  }
  throw new Error(response.message || 'Failed to save proxy config')
}

export const deleteProxyConfig = async () => {
  const response = await http.delete<ProxyResponse<null>>('/v2/proxy')
  if (response.success) {
    return response.data
  }
  throw new Error(response.message || 'Failed to delete proxy config')
}
