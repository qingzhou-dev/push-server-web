import http from './http'
import { ensureCsrfToken, unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'

export interface CorpResponse {
  corpId: string
}

export const fetchCorp = async () => {
  const response = await http.get<PortalResponse<CorpResponse>>('/v2/corp')
  return unwrapPortalResponse(response)
}

export const updateCorp = async (corpId: string) => {
  await ensureCsrfToken()
  const response = await http.put<PortalResponse<CorpResponse>>('/v2/corp', {
    corpId,
  })
  return unwrapPortalResponse(response)
}
