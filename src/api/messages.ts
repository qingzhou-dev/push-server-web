import http from './http'
import { ensureCsrfToken, unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'
import type { PortalMessageLogResponse } from './types'

export type MessageType = 'TEXT' | 'TEXT_CARD' | 'MARKDOWN'

export interface SendMessagePayload {
  appId: number
  toUser?: string
  toParty?: string
  toAll?: boolean
  msgType?: MessageType
  content?: string
  title?: string
  description?: string
  url?: string
  btnText?: string
}

export const sendMessage = async (payload: SendMessagePayload) => {
  await ensureCsrfToken()
  const response = await http.post<PortalResponse<PortalMessageLogResponse>>(
    '/v2/messages/send',
    payload,
  )
  return unwrapPortalResponse(response)
}

export const fetchMessageLogs = async (limit = 20) => {
  const response = await http.get<PortalResponse<PortalMessageLogResponse[]>>(
    '/v2/messages/logs',
    { params: { limit } },
  )
  return unwrapPortalResponse(response)
}
