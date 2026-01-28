import http from './http'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface VersionData {
  version: string
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
