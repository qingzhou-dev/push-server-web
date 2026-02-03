<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import { fetchPluginActions, fetchPluginHeartbeats } from '@/api/plugins'
import type { PluginActionLogResponse, PluginHeartbeatLogResponse } from '@/api/types'

const props = defineProps<{
  pluginKey: string
  pluginName: string
  visible: boolean
}>()

const emit = defineEmits(['update:visible'])

const activeTab = ref('actions')
const actionLogs = ref<PluginActionLogResponse[]>([])
const heartbeatLogs = ref<PluginHeartbeatLogResponse[]>([])
const isLoading = ref(false)

const actionPager = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  eventId: ''
})

const heartbeatPager = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const loadActionLogs = async () => {
  if (!props.pluginKey) return
  isLoading.value = true
  try {
    const res = await fetchPluginActions(props.pluginKey, {
      eventId: actionPager.eventId || undefined,
      page: actionPager.page,
      pageSize: actionPager.pageSize
    })
    actionLogs.value = res.records
    actionPager.total = res.total
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

const loadHeartbeatLogs = async () => {
  if (!props.pluginKey) return
  isLoading.value = true
  try {
    const res = await fetchPluginHeartbeats(props.pluginKey, {
      page: heartbeatPager.page,
      pageSize: heartbeatPager.pageSize
    })
    heartbeatLogs.value = res.records
    heartbeatPager.total = res.total
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

const loadData = () => {
  if (activeTab.value === 'actions') {
    loadActionLogs()
  } else {
    loadHeartbeatLogs()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    actionPager.page = 1
    heartbeatPager.page = 1
    loadData()
  }
})

watch(activeTab, () => {
  loadData()
})

const handleClose = () => {
  emit('update:visible', false)
}

const formatDate = (value?: number) => {
  if (!value) return '--'
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

const formatUptime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`插件观测 - ${pluginName}`"
    width="900px"
    @update:model-value="handleClose"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="处理回执 (Actions)" name="actions">
        <div class="filter-bar">
          <el-input
            v-model="actionPager.eventId"
            placeholder="按 EventId 搜索"
            clearable
            style="width: 300px"
            @change="actionPager.page = 1; loadActionLogs()"
          />
          <el-button @click="loadActionLogs">刷新</el-button>
        </div>
        
        <el-table v-loading="isLoading" :data="actionLogs" style="width: 100%">
          <el-table-column type="expand">
            <template #default="scope">
              <div class="log-detail">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="应用">{{ scope.row.appName || scope.row.appId || '--' }}</el-descriptions-item>
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
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="actionPager.page"
            v-model:page-size="actionPager.pageSize"
            :total="actionPager.total"
            layout="prev, pager, next, total"
            @current-change="loadActionLogs"
          />
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="心跳日志 (Heartbeats)" name="heartbeats">
        <div class="filter-bar">
          <el-button @click="loadHeartbeatLogs">刷新</el-button>
        </div>
        
        <el-table v-loading="isLoading" :data="heartbeatLogs" style="width: 100%">
          <el-table-column label="并发任务 (Inflight)" prop="currentInflight" width="150" />
          <el-table-column label="运行时间 (Uptime)" width="150">
            <template #default="scope">
              {{ formatUptime(scope.row.uptimeSeconds) }}
            </template>
          </el-table-column>
          <el-table-column label="上报时间" min-width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="heartbeatPager.page"
            v-model:page-size="heartbeatPager.pageSize"
            :total="heartbeatPager.total"
            layout="prev, pager, next, total"
            @current-change="loadHeartbeatLogs"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style scoped>
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.log-detail {
  padding: 10px 20px;
  background-color: var(--el-fill-color-lighter);
}

.content-preview {
  margin: 0;
  padding: 8px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
  font-size: 12px;
  color: var(--el-text-color-primary);
}
</style>
