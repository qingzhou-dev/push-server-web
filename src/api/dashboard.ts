import http from './http'
import { unwrapPortalResponse } from './portal'
import type { PortalResponse } from './portal'
import type {
  DashboardChartsResponse,
  DashboardRecentLogItem,
  DashboardStatsResponse,
} from './types'

export const fetchDashboardStats = async () => {
  const response = await http.get<PortalResponse<DashboardStatsResponse>>(
    '/dashboard/stats',
  )
  return unwrapPortalResponse(response)
}

export const fetchDashboardCharts = async () => {
  const response = await http.get<PortalResponse<DashboardChartsResponse>>(
    '/dashboard/charts',
  )
  return unwrapPortalResponse(response)
}

export const fetchDashboardRecentLogs = async (limit = 10) => {
  const response = await http.get<PortalResponse<DashboardRecentLogItem[]>>(
    '/dashboard/recent-logs',
    { params: { limit } },
  )
  return unwrapPortalResponse(response)
}
