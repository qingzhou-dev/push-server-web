<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Clock,
  Histogram,
  PieChart,
  RefreshRight,
  TrendCharts,
} from '@element-plus/icons-vue'

import {
  fetchDashboardCharts,
  fetchDashboardRecentLogs,
  fetchDashboardStats,
} from '@/api/dashboard'
import type {
  DashboardChartsResponse,
  DashboardRecentLogItem,
  DashboardStatsResponse,
} from '@/api/types'

const stats = ref<DashboardStatsResponse | null>(null)
const charts = ref<DashboardChartsResponse | null>(null)
const recentLogs = ref<DashboardRecentLogItem[]>([])

const loadingStats = ref(false)
const loadingCharts = ref(false)
const loadingLogs = ref(false)

const recentLimit = ref(10)
const detailVisible = ref(false)
const detailData = ref<DashboardRecentLogItem | null>(null)

const palette = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
]

const isSuccessRateLow = computed(
  () => (stats.value?.successRate ?? 100) < 95,
)

const kpiCards = computed(() => [
  {
    label: '今日发送总量',
    value:
      stats.value?.todayTotal !== undefined
        ? stats.value.todayTotal.toLocaleString()
        : '--',
    note: '00:00 至当前',
    trend: null,
    icon: TrendCharts,
    tone: 'primary',
  },
  {
    label: '发送成功率',
    value:
      stats.value?.successRate !== undefined
        ? `${stats.value.successRate.toFixed(1)}%`
        : '--',
    note: isSuccessRateLow.value ? '低于 95% 请检查' : '近 24 小时',
    trend: null,
    icon: Histogram,
    tone: isSuccessRateLow.value ? 'danger' : 'success',
  },
  {
    label: '活跃应用数',
    value:
      stats.value?.activeApps !== undefined
        ? stats.value.activeApps.toLocaleString()
        : '--',
    note: 'WeCom 应用总数',
    trend: null,
    icon: PieChart,
    tone: 'accent',
  },
  {
    label: '系统状态 / 最近异常',
    value: stats.value?.lastErrorTime
      ? `失败于 ${stats.value.lastErrorTime}`
      : '运行正常',
    note: '今日失败记录',
    trend: null,
    icon: Clock,
    tone: stats.value?.lastErrorTime ? 'warning' : 'success',
  },
])

const trendPoints = computed(() => {
  const data = charts.value?.trend || []
  const max = Math.max(...data.map((d) => d.count), 1)
  const step = data.length > 1 ? 100 / (data.length - 1) : 0
  return data.map((item, index) => ({
    x: step * index,
    y: 40 - (item.count / max) * 30 - 4,
    label: item.date,
    value: item.count,
  }))
})

const trendPath = computed(() => {
  if (!trendPoints.value.length) return ''
  const [first, ...rest] = trendPoints.value
  return `M ${first.x} ${first.y} ${rest
    .map((p) => `L ${p.x} ${p.y}`)
    .join(' ')}`
})

const trendAreaPath = computed(() => {
  if (!trendPoints.value.length) return ''
  const [first, ...rest] = trendPoints.value
  const last = rest[rest.length - 1] || first
  return `M ${first.x} ${first.y} ${rest
    .map((p) => `L ${p.x} ${p.y}`)
    .join(' ')} L ${last.x} 42 L 0 42 Z`
})

const distributionTotal = computed(
  () =>
    charts.value?.distribution?.reduce((sum, item) => sum + item.value, 0) ||
    0,
)

const distributionGradient = computed(() => {
  const data = charts.value?.distribution || []
  const total = distributionTotal.value
  if (!total || !data.length) {
    return 'conic-gradient(#e5e7eb 0deg 360deg)'
  }
  let current = 0
  const segments = data.map((item, index) => {
    const start = (current / total) * 360
    current += item.value
    const end = (current / total) * 360
    return `${palette[index % palette.length]} ${start}deg ${end}deg`
  })
  return `conic-gradient(${segments.join(', ')})`
})

const statusTagType = (status: number) => (status === 1 ? 'success' : 'danger')
const statusText = (status: number) => (status === 1 ? '成功' : '失败')

const openDetail = (log: DashboardRecentLogItem) => {
  detailData.value = log
  detailVisible.value = true
}

const loadStats = async () => {
  loadingStats.value = true
  try {
    stats.value = await fetchDashboardStats()
  } catch {
    ElMessage.error('获取统计数据失败')
  } finally {
    loadingStats.value = false
  }
}

const loadCharts = async () => {
  loadingCharts.value = true
  try {
    charts.value = await fetchDashboardCharts()
  } catch {
    ElMessage.error('获取图表数据失败')
  } finally {
    loadingCharts.value = false
  }
}

const loadRecentLogs = async () => {
  loadingLogs.value = true
  try {
    recentLogs.value = await fetchDashboardRecentLogs(recentLimit.value)
  } catch {
    ElMessage.error('获取最新日志失败')
  } finally {
    loadingLogs.value = false
  }
}

const refreshAll = () => {
  loadStats()
  loadCharts()
  loadRecentLogs()
}

onMounted(() => {
  refreshAll()
})
</script>

<template>
  <section class="page dashboard-page">
    <div class="page-heading">
      <div>
        <h1>全景监控</h1>
        <p>一屏总览今日健康度与各应用的使用热度</p>
      </div>
      <div class="page-actions">
        <el-button
          :icon="RefreshRight"
          :loading="loadingStats || loadingCharts || loadingLogs"
          @click="refreshAll"
        >
          刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="kpi-grid">
      <el-col
        v-for="card in kpiCards"
        :key="card.label"
        :xs="24"
        :sm="12"
        :lg="6"
      >
        <el-card
          class="kpi-card"
          :class="`tone-${card.tone}`"
          :body-style="{ padding: '16px' }"
          :loading="loadingStats"
        >
          <div class="kpi-header">
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-icon">
              <el-icon>
                <component :is="card.icon" />
              </el-icon>
            </div>
          </div>
          <div class="kpi-value">
            {{ card.value }}
          </div>
          <div class="kpi-meta">
            <span>{{ card.note }}</span>
            <el-tag
              v-if="card.label === '发送成功率'"
              size="small"
              :type="isSuccessRateLow ? 'danger' : 'success'"
              effect="dark"
            >
              {{ isSuccessRateLow ? '需关注' : '健康' }}
            </el-tag>
            <el-tag
              v-else-if="card.label.includes('系统状态')"
              size="small"
              :type="stats?.lastErrorTime ? 'warning' : 'success'"
              effect="plain"
            >
              {{ stats?.lastErrorTime ? '有异常' : '正常' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :lg="16">
        <el-card class="panel-card" :body-style="{ padding: '16px' }" :loading="loadingCharts">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>近 7 天发送趋势</h3>
                <p>按日聚合的发送总量，缺失日期后端已补零</p>
              </div>
            </div>
          </template>

          <div v-if="trendPoints.length" class="chart-shell">
            <svg viewBox="0 0 100 44" preserveAspectRatio="none" class="trend-chart">
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2563eb" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path :d="trendAreaPath" fill="url(#trendFill)" />
              <path :d="trendPath" stroke="#2563eb" stroke-width="1.6" fill="none" />
              <g v-for="(p, idx) in trendPoints" :key="idx">
                <circle :cx="p.x" :cy="p.y" r="1.4" fill="#2563eb" />
                <text
                  v-if="idx === trendPoints.length - 1"
                  :x="p.x + 1.5"
                  :y="p.y - 2.5"
                  class="chart-label"
                >
                  {{ p.value }}
                </text>
              </g>
            </svg>
            <div class="trend-axis">
              <span v-for="p in trendPoints" :key="p.label">{{ p.label }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无趋势数据" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card class="panel-card" :body-style="{ padding: '16px' }" :loading="loadingCharts">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>近 30 天应用占比</h3>
                <p>Top5 应用 + 其他</p>
              </div>
            </div>
          </template>

        <div class="distribution">
          <div class="distribution-ring" :style="{ background: distributionGradient }">
            <div class="ring-center">
              <div class="ring-total">{{ distributionTotal }}</div>
              <div class="ring-label">总发送</div>
            </div>
          </div>
          <div class="distribution-legend">
            <div
              v-for="(item, idx) in charts?.distribution || []"
              :key="item.name"
              class="legend-item"
            >
              <span
                class="legend-dot"
                :style="{ background: palette[idx % palette.length] }"
              />
              <div class="legend-meta">
                <div class="legend-name">{{ item.name }}</div>
                <div class="legend-sub">
                  {{ item.value.toLocaleString() }}
                  ·
                  {{
                    distributionTotal
                      ? ((item.value / distributionTotal) * 100).toFixed(1)
                      : '0.0'
                  }}%
                </div>
              </div>
            </div>
            <el-empty
              v-if="!charts?.distribution?.length"
              description="暂无占比数据"
              :image-size="80"
            />
          </div>
        </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card
      class="panel-card recent-card"
      :body-style="{ padding: '16px' }"
      :loading="loadingLogs"
    >
      <template #header>
        <div class="panel-header">
          <div>
            <h3>最新操作日志</h3>
            <p>按时间倒序，实时展示发送记录</p>
          </div>
          <div class="panel-actions">
            <el-select
              v-model="recentLimit"
              size="small"
              style="width: 140px"
              @change="loadRecentLogs"
            >
              <el-option :value="10" label="最近 10 条" />
              <el-option :value="20" label="最近 20 条" />
              <el-option :value="50" label="最近 50 条" />
            </el-select>
            <el-button size="small" :icon="RefreshRight" @click="loadRecentLogs">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="recentLogs" style="width: 100%" v-loading="loadingLogs">
        <el-table-column label="时间" prop="time" min-width="160" />
        <el-table-column label="来源应用" prop="appName" min-width="160" />
        <el-table-column label="接收对象" prop="receiver" min-width="180" />
        <el-table-column label="状态" min-width="120">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ statusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="openDetail(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty
        v-if="!recentLogs.length && !loadingLogs"
        description="暂无日志"
      />
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="日志详情"
      width="520px"
      destroy-on-close
    >
      <pre class="detail-json">{{ JSON.stringify(detailData, null, 2) }}</pre>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kpi-grid {
  margin-bottom: 4px;
}

.kpi-card {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: linear-gradient(145deg, #f8fafc, #ffffff);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-label {
  font-size: 14px;
  color: var(--app-muted);
}

.kpi-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  margin: 10px 0 6px;
  color: #0f172a;
}

.kpi-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--app-muted);
  font-size: 13px;
}

.tone-primary .kpi-icon {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.tone-success .kpi-icon {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.tone-danger .kpi-icon {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.tone-warning .kpi-icon {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.tone-accent .kpi-icon {
  background: rgba(139, 92, 246, 0.14);
  color: #7c3aed;
}

.panel-header p {
  margin-top: 4px;
}

.chart-shell {
  position: relative;
}

.trend-chart {
  width: 100%;
  height: 240px;
}

.chart-label {
  font-size: 4px;
  fill: #2563eb;
  font-weight: 600;
}

.trend-axis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 8px;
  margin-top: 8px;
  color: var(--app-muted);
  font-size: 12px;
}

.distribution {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.distribution-ring {
  position: relative;
  width: 100%;
  max-width: 240px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 50%;
  background: conic-gradient(#e5e7eb 0deg 360deg);
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 10px #f1f5f9;
}

.ring-center {
  width: 58%;
  height: 58%;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  text-align: center;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.ring-total {
  font-size: 22px;
  font-weight: 700;
}

.ring-label {
  color: var(--app-muted);
  font-size: 12px;
}

.distribution-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.legend-name {
  font-weight: 600;
  color: #0f172a;
}

.legend-sub {
  font-size: 12px;
  color: var(--app-muted);
}

.recent-card {
  margin-top: 20px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-json {
  background: #0f172a;
  color: #e5e7eb;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  max-height: 360px;
  overflow: auto;
}

@media (max-width: 1024px) {
  .distribution {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .distribution-legend {
    width: 100%;
  }
}
</style>
