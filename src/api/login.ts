import http from './http'

export interface LoginPayload {
  account: string
  password: string
  captcha: string
}

export interface LoginResponse {
  code: number
  msg: string
  username?: string
}

export const login = (payload: LoginPayload) => {
  return http.post<LoginResponse>('/login', payload)
}

export const fetchCaptcha = () => {
  return http.get<Blob>('/captcha', { responseType: 'blob' })
}
