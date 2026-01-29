import http from './http'

export interface ProxyConfig {
  id?: number
  host: string
  port: number
  username?: string
  password?: string
  type: 'HTTP'
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
  const response = await http.get<ProxyResponse<ProxyConfig | null>>('/v2/proxy')
  if (response.code !== 200) {
     throw new Error(response.message || 'Failed to fetch proxy config')
  }
  return response.data
}

export const saveProxyConfig = async (config: Omit<ProxyConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
  const response = await http.put<ProxyResponse<ProxyConfig>>('/v2/proxy', config)
  if (response.code !== 200) {
      throw new Error(response.message || 'Failed to save proxy config')
  }
  return response.data
}

export const deleteProxyConfig = async () => {
  const response = await http.delete<ProxyResponse<null>>('/v2/proxy')
  if (response.code !== 200) {
      throw new Error(response.message || 'Failed to delete proxy config')
  }
  return response.data
}
