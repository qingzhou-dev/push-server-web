<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshRight } from '@element-plus/icons-vue'
import { createApp, deleteApp, fetchApps, syncApp } from '@/api/apps'
import type { PortalAppResponse } from '@/api/types'

const apps = ref<PortalAppResponse[]>([])
const isLoading = ref(false)
const dialogVisible = ref(false)
const isSubmitting = ref(false)
const syncingAppId = ref<number | null>(null)

const form = reactive({
  agentId: '',
  secret: '',
})

const formatDate = (value?: number) => {
  if (!value) {
    return '--'
  }
  return new Date(value).toLocaleString()
}

const loadApps = async () => {
  isLoading.value = true
  try {
    apps.value = await fetchApps()
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

const openDialog = () => {
  dialogVisible.value = true
}

const handleCreate = async () => {
  const agentId = form.agentId.trim()
  if (!agentId || !form.secret) {
    ElMessage.warning('请输入 AgentId 与 Secret')
    return
  }
  isSubmitting.value = true
  try {
    await createApp({
      agentId,
      secret: form.secret,
    })
    ElMessage.success('应用已创建')
    dialogVisible.value = false
    form.agentId = ''
    form.secret = ''
    loadApps()
  } catch {
    // Error handled by interceptor
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (app: PortalAppResponse) => {
  try {
    await ElMessageBox.confirm(
      `确认删除应用 ${app.name || app.agentId}？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  try {
    await deleteApp(app.id)
    ElMessage.success('应用已删除')
    loadApps()
  } catch {
    // Error handled by interceptor
  }
}

const handleSync = async (app: PortalAppResponse) => {
  syncingAppId.value = app.id
  try {
    await syncApp(app.id)
    ElMessage.success('应用已同步')
    loadApps()
  } catch {
    // Error handled by interceptor
  } finally {
    syncingAppId.value = null
  }
}

onMounted(() => {
  loadApps()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>应用管理</h1>
        <p>接入企业微信应用并同步基础信息</p>
      </div>
      <div class="page-actions">
        <el-button :icon="RefreshRight" :loading="isLoading" @click="loadApps">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog">
          新增应用
        </el-button>
      </div>
    </div>

    <el-card class="panel-card">
      <el-table v-loading="isLoading" :data="apps" style="width: 100%">
        <el-table-column label="应用" min-width="200">
          <template #default="scope">
            <div class="app-cell">
              <el-avatar size="small" :src="scope.row.avatarUrl">
                {{ scope.row.name?.charAt(0) || 'A' }}
              </el-avatar>
              <div>
                <div class="app-name">{{ scope.row.name || '未命名应用' }}</div>
                <div class="app-meta">AgentId：{{ scope.row.agentId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="描述" min-width="200">
          <template #default="scope">
            <span>{{ scope.row.description || '暂无描述' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="160">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="160">
          <template #default="scope">
            <el-button
              size="small"
              text
              :loading="syncingAppId === scope.row.id"
              @click="handleSync(scope.row)"
            >
              同步
            </el-button>
            <el-button
              size="small"
              text
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!apps.length && !isLoading" description="暂无应用数据" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增应用" width="420px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="AgentId">
          <el-input v-model="form.agentId" placeholder="请输入 AgentId" />
        </el-form-item>
        <el-form-item label="Secret">
          <el-input v-model="form.secret" placeholder="请输入 Secret" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>
