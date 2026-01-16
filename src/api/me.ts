import http from './http'
import { ensureCsrfToken, unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'
import type { PortalUserResponse } from './types'

export interface UpdatePasswordPayload {
  oldPassword: string
  newPassword: string
}

export interface RegisterPayload {
  account: string
  password: string
}

export const fetchMe = async () => {
  const response = await http.get<PortalResponse<PortalUserResponse>>('/v2/me')
  return unwrapPortalResponse(response)
}

export const updatePassword = async (payload: UpdatePasswordPayload) => {
  await ensureCsrfToken()
  const response = await http.put<PortalResponse<null>>(
    '/v2/me/password',
    payload,
  )
  return unwrapPortalResponse(response)
}

export const registerUser = async (payload: RegisterPayload) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<PortalUserResponse>>(
    '/v2/auth/register',
    payload,
  )
  return unwrapPortalResponse(response)
}

export const logout = async () => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<null>>('/v2/auth/logout')
  return unwrapPortalResponse(response)
}
