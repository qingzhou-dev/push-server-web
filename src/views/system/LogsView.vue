<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'

import { fetchApps } from '@/api/apps'
import { fetchMessageLogsPaged } from '@/api/messages'
import { fetchPluginActions, fetchPlugins } from '@/api/plugins'
import type {
  PortalAppResponse,
  PortalMessageLogResponse,
  PluginActionLogResponse,
  PortalPluginResponse,
} from '@/api/types'

const activeTab = ref('messages')
const apps = ref<PortalAppResponse[]>([])
const plugins = ref<PortalPluginResponse[]>([])
const logs = ref<PortalMessageLogResponse[]>([])
const actionLogs = ref<PluginActionLogResponse[]>([])
const total = ref(0)
const actionTotal = ref(0)
const isLoading = ref(false)
const isAppsLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const actionPage = ref(1)
const actionPageSize = ref(20)
const filterAppId = ref<number | 'all' | null>('all')
const filterStatus = ref<'all' | 'success' | 'failed'>('all')
const filterPluginKey = ref<string | 'all'>('all')
const filterEventId = ref('')

const appLookup = computed(() => {
  const map = new Map<number, string>()
  apps.value.forEach((app) => {
    map.set(app.id, app.name || app.agentId)
  })
  return map
})

const pluginLookup = computed(() => {
  const map = new Map<string, string>()
  plugins.value.forEach((p) => {
    map.set(p.pluginKey, p.name)
  })
  return map
})

const filteredLogs = computed(() =>
  logs.value.filter((log) => {
    const matchApp =
      filterAppId.value === 'all' ||
      filterAppId.value === null ||
      log.appId === filterAppId.value
    const matchStatus =
      filterStatus.value === 'all' ||
      (filterStatus.value === 'success' ? log.success : !log.success)
    return matchApp && matchStatus
  }),
)

const formatDate = (value?: number) => {
  if (!value) {
    return '--'
  }
  return new Date(value).toLocaleString()
}

const getStatusType = (status: string | number) => {
  if (status === undefined || status === null) return 'info'
  const s = String(status).toLowerCase()
  if (s === '2' || s.includes('success') || s === 'ok') return 'success'
  if (s === '3' || s.includes('fail') || s.includes('error')) return 'danger'
  if (s === '1' || s.includes('processing')) return 'warning'
  return 'info' // 0: RECEIVED
}

const formatStatusLabel = (status: string | number) => {
  const s = String(status)
  switch (s) {
    case '0': return '已接收'
    case '1': return '处理中'
    case '2': return '成功'
    case '3': return '失败'
    default: return s
  }
}

const formatTargets = (row: PortalMessageLogResponse) => {
  if (row.toAll) {
    return '全员'
  }
  const targets = [row.toUser, row.toParty].filter(Boolean)
  return targets.length ? targets.join(' / ') : '--'
}

const extractNewsPreview = (row: PortalMessageLogResponse) => {
  const article = row.articles?.[0]
  return {
    title: article?.title || row.title,
    description: article?.description || row.description,
    url: article?.url || row.url,
  }
}

const formatLogContent = (row: PortalMessageLogResponse) => {
  if (row.msgType === 'NEWS') {
    const preview = extractNewsPreview(row)
    return preview.title || preview.description || preview.url || '--'
  }
  return row.content || row.title || row.description || '--'
}

const loadApps = async () => {
  isAppsLoading.value = true
  try {
    apps.value = await fetchApps()
  } catch {
    // Error handled by interceptor
  } finally {
    isAppsLoading.value = false
  }
}

const loadPlugins = async () => {
  try {
    plugins.value = await fetchPlugins()
    if (filterPluginKey.value === 'all' && plugins.value.length > 0) {
      filterPluginKey.value = plugins.value[0].pluginKey
      loadActionLogs()
    }
  } catch {
    // Error handled by interceptor
  }
}

const loadActionLogs = async () => {
  if (filterPluginKey.value === 'all' && !filterEventId.value) {
    actionLogs.value = []
    actionTotal.value = 0
    return
  }

  isLoading.value = true
  try {
    const key = filterPluginKey.value === 'all' ? '' : filterPluginKey.value
    // Note: If filterPluginKey is 'all', we might need a general action log API 
    // but based on plugin-integration.md it's per pluginKey.
    // If the user hasn't selected a plugin, we'll just show empty or we pick the first one.
    if (!key) {
        // If no plugin selected, we can't really call the API as defined
        actionLogs.value = []
        actionTotal.value = 0
        return
    }

    const result = await fetchPluginActions(key, {
      page: actionPage.value,
      pageSize: actionPageSize.value,
      eventId: filterEventId.value || undefined
    })
    actionLogs.value = result.records
    actionTotal.value = result.total
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

const loadLogs = async () => {
  if (activeTab.value === 'plugins') {
    loadActionLogs()
    return
  }

  isLoading.value = true
  try {
    const result = await fetchMessageLogsPaged({
      page: page.value,
      pageSize: pageSize.value,
      appId:
        filterAppId.value === 'all' ? undefined : filterAppId.value || undefined,
      success:
        filterStatus.value === 'all'
          ? undefined
          : filterStatus.value === 'success',
    })
    logs.value = result.records
    total.value = result.total
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

const handleAppChange = () => {
  page.value = 1
  loadLogs()
}

const handleStatusChange = () => {
  page.value = 1
  loadLogs()
}

const handlePluginChange = () => {
  actionPage.value = 1
  loadActionLogs()
}

const handlePageChange = (value: number) => {
  page.value = value
  loadLogs()
}

const handlePageSizeChange = (value: number) => {
  pageSize.value = value
  page.value = 1
  loadLogs()
}

const handleActionPageChange = (value: number) => {
  actionPage.value = value
  loadActionLogs()
}

watch(activeTab, (val) => {
  if (val === 'plugins') {
    if (!plugins.value.length) {
      loadPlugins()
    } else if (filterPluginKey.value !== 'all') {
      loadActionLogs()
    }
  } else {
    loadLogs()
  }
})

onMounted(() => {
  loadApps()
  loadLogs()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>日志审计</h1>
        <p>集中查看消息发送日志</p>
      </div>
      <div class="page-actions">
        <el-button :icon="RefreshRight" :loading="isLoading" @click="loadLogs">
          刷新
        </el-button>
      </div>
    </div>

    <el-card class="panel-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="消息发送日志" name="messages">
          <div class="table-toolbar">
            <el-select
              v-model="filterAppId"
              placeholder="全部应用"
              :loading="isAppsLoading"
              clearable
              style="width: 180px"
              @change="handleAppChange"
            >
              <el-option label="全部应用" value="all" />
              <el-option
                v-for="app in apps"
                :key="app.id"
                :label="app.name || app.agentId"
                :value="app.id"
              />
            </el-select>

            <el-select
              v-model="filterStatus"
              placeholder="状态"
              style="width: 140px"
              @change="handleStatusChange"
            >
              <el-option label="全部状态" value="all" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>

            <el-button
              type="primary"
              :icon="RefreshRight"
              :loading="isLoading"
              @click="loadLogs"
            >
              重新获取
            </el-button>
          </div>

          <el-table v-loading="isLoading" :data="filteredLogs" style="width: 100%">
            <el-table-column label="应用" min-width="140">
              <template #default="scope">
                <div class="log-app">
                  <span class="log-title">
                    {{ appLookup.get(scope.row.appId) || scope.row.agentId }}
                  </span>
                  <span class="log-sub">
                    Agent: {{ scope.row.agentId }} · ID: {{ scope.row.appId }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="msgType" label="类型" min-width="100" />
            <el-table-column label="对象" min-width="160">
              <template #default="scope">
                {{ formatTargets(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column label="内容" min-width="220">
              <template #default="{ row }">
                <template v-if="row.msgType === 'NEWS'">
                  <div class="log-title">
                    {{ extractNewsPreview(row).title || '--' }}
                  </div>
                  <div v-if="extractNewsPreview(row).description" class="log-sub">
                    {{ extractNewsPreview(row).description }}
                  </div>
                  <el-link
                    v-if="extractNewsPreview(row).url"
                    :href="extractNewsPreview(row).url"
                    target="_blank"
                    type="primary"
                  >
                    {{ extractNewsPreview(row).url }}
                  </el-link>
                </template>
                <span v-else>
                  {{ formatLogContent(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="140">
              <template #default="scope">
                <div style="display: flex; align-items: center; gap: 8px">
                  <el-tag :type="scope.row.success ? 'success' : 'danger'">
                    {{ scope.row.success ? '成功' : '失败' }}
                  </el-tag>
                  <span v-if="!scope.row.success && scope.row.errorMessage" class="log-sub">
                    {{ scope.row.errorMessage }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="时间" min-width="160">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty
            v-if="!filteredLogs.length && !isLoading"
            description="暂无日志记录"
          />

          <div class="table-footer">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handlePageSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="插件处理回执" name="plugins">
          <div class="table-toolbar">
            <el-select
              v-model="filterPluginKey"
              placeholder="选择插件"
              style="width: 200px"
              @change="handlePluginChange"
            >
              <el-option label="选择插件..." value="all" disabled />
              <el-option
                v-for="plugin in plugins"
                :key="plugin.pluginKey"
                :label="plugin.name"
                :value="plugin.pluginKey"
              />
            </el-select>

            <el-input
              v-model="filterEventId"
              placeholder="按 EventId 搜索"
              clearable
              style="width: 240px"
              @change="handlePluginChange"
            />

            <el-button
              type="primary"
              :icon="RefreshRight"
              :loading="isLoading"
              @click="loadActionLogs"
            >
              刷新
            </el-button>
          </div>

          <el-table v-loading="isLoading" :data="actionLogs" style="width: 100%">
            <el-table-column type="expand">
              <template #default="scope">
                <div class="log-detail">
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="应用">{{ scope.row.appName || appLookup.get(scope.row.appId) || scope.row.appId || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="发送人">{{ scope.row.userId || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="消息类型">{{ scope.row.type || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="事件 ID">{{ scope.row.eventId }}</el-descriptions-item>
                    <el-descriptions-item label="消息内容" :span="2">
                      <pre class="content-preview">{{ scope.row.content || '--' }}</pre>
                    </el-descriptions-item>
                    <el-descriptions-item label="运行时配置 (快照)" :span="2">
                      <pre class="content-preview">{{ scope.row.pluginConfig || '--' }}</pre>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="插件" width="150">
              <template #default="scope">
                {{ pluginLookup.get(scope.row.pluginKey) || scope.row.pluginKey }}
              </template>
            </el-table-column>
            <el-table-column label="Event ID" prop="eventId" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ formatStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="消息" prop="message" min-width="200" show-overflow-tooltip />
            <el-table-column label="时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty
            v-if="!actionLogs.length && !isLoading"
            :description="filterPluginKey === 'all' ? '请选择插件查看回执' : '暂无回执记录'"
          />

          <div class="table-footer">
            <el-pagination
              v-model:current-page="actionPage"
              v-model:page-size="actionPageSize"
              layout="total, prev, pager, next"
              :total="actionTotal"
              @current-change="handleActionPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </section>
</template>
