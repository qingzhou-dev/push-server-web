import http from './http'

export interface UserQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: string
}

export interface UserRecord {
  id: number
  name: string
  role: string
  status: 'active' | 'disabled'
  lastLogin: string
  channel: string
}

export interface UserListResponse {
  total: number
  items: UserRecord[]
}

export const fetchUsers = (params: UserQuery) => {
  return http.get<UserListResponse>('/users', { params })
}
