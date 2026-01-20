<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'

import { fetchApps } from '@/api/apps'
import { fetchMessageLogsPaged } from '@/api/messages'
import type {
  PortalAppResponse,
  PortalMessageLogResponse,
} from '@/api/types'

const apps = ref<PortalAppResponse[]>([])
const logs = ref<PortalMessageLogResponse[]>([])
const total = ref(0)
const isLoading = ref(false)
const isAppsLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const filterAppId = ref<number | 'all' | null>('all')
const filterStatus = ref<'all' | 'success' | 'failed'>('all')

const appLookup = computed(() => {
  const map = new Map<number, string>()
  apps.value.forEach((app) => {
    map.set(app.id, app.name || app.agentId)
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
  } catch (error) {
    ElMessage.error('获取应用列表失败')
  } finally {
    isAppsLoading.value = false
  }
}

const loadLogs = async () => {
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
  } catch (error) {
    ElMessage.error('获取日志失败')
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

const handlePageChange = (value: number) => {
  page.value = value
  loadLogs()
}

const handlePageSizeChange = (value: number) => {
  pageSize.value = value
  page.value = 1
  loadLogs()
}

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
      <template #header>
        <div class="panel-header">
          <div>
            <h3>发送日志</h3>
            <p>支持按应用与状态筛选</p>
          </div>
        </div>
      </template>

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
    </el-card>
  </section>
</template>
