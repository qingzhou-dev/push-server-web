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
  code: number
  message: string
  data: T
}

export const fetchProxyConfig = async () => {
  const response = await http.get<any>('/v2/proxy')
  if (response.code === 200 || response.success === true) {
    return response.data
  }
  throw new Error(response.message || 'Failed to fetch proxy config')
}

export const saveProxyConfig = async (config: Omit<ProxyConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
  const response = await http.put<any>('/v2/proxy', config)
  if (response.code === 200 || response.success === true) {
    return response.data
  }
  throw new Error(response.message || 'Failed to save proxy config')
}

export const deleteProxyConfig = async () => {
  const response = await http.delete<any>('/v2/proxy')
  if (response.code === 200 || response.success === true) {
    return response.data
  }
  throw new Error(response.message || 'Failed to delete proxy config')
}
