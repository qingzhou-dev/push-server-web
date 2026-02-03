<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument, Connection, Plus, RefreshRight, Setting } from '@element-plus/icons-vue'
import { createApp, deleteApp, fetchApps, syncApp, updateApp } from '@/api/apps'
import type { PortalAppResponse } from '@/api/types'
import AppPluginsDialog from './AppPluginsDialog.vue'

const apps = ref<PortalAppResponse[]>([])
const isLoading = ref(false)
const dialogVisible = ref(false)
const editDialogVisible = ref(false)
const pluginsDialogVisible = ref(false)
const isSubmitting = ref(false)
const syncingAppId = ref<number | null>(null)
const selectedApp = ref<PortalAppResponse | null>(null)

const form = reactive({
  agentId: '',
  secret: '',
})

const editForm = reactive({
  id: 0,
  agentId: '',
  secret: '',
  token: '',
  encodingAesKey: '',
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

const openEditDialog = (app: PortalAppResponse) => {
  editForm.id = app.id
  editForm.agentId = app.agentId
  editForm.secret = '' // Reset secret, only update if provided
  editForm.token = '' // These are not in the response usually, or we don't know
  editForm.encodingAesKey = ''
  editDialogVisible.value = true
}

const openPluginsDialog = (app: PortalAppResponse) => {
  selectedApp.value = app
  pluginsDialogVisible.value = true
}

const getCallbackUrl = (id: number) => {
  return `${window.location.origin}/api/v2/wecom/callback/${id}`
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
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

const handleUpdate = async () => {
  isSubmitting.value = true
  try {
    const payload: any = {
      token: editForm.token,
      encodingAesKey: editForm.encodingAesKey,
    }
    if (editForm.secret) {
      payload.secret = editForm.secret
    }
    await updateApp(editForm.id, payload)
    ElMessage.success('配置已更新')
    editDialogVisible.value = false
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
              :icon="Setting"
              @click="openEditDialog(scope.row)"
            >
              配置
            </el-button>
            <el-button
              size="small"
              text
              :icon="Connection"
              @click="openPluginsDialog(scope.row)"
            >
              插件
            </el-button>
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

    <el-dialog v-model="editDialogVisible" title="应用配置" width="560px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="AgentId">
          <el-input v-model="editForm.agentId" disabled />
        </el-form-item>
        <el-form-item label="Secret">
          <el-input v-model="editForm.secret" placeholder="不更新请留空" show-password />
        </el-form-item>
        <el-divider content-position="left">接收消息配置</el-divider>
        <el-form-item label="Token">
          <el-input v-model="editForm.token" placeholder="企业微信后台生成的 Token" />
        </el-form-item>
        <el-form-item label="EncodingAESKey">
          <el-input v-model="editForm.encodingAesKey" placeholder="企业微信后台生成的 EncodingAESKey" />
        </el-form-item>
        <el-form-item label="回调 URL">
          <div class="callback-url-container">
            <el-input :value="getCallbackUrl(editForm.id)" readonly>
              <template #append>
                <el-button :icon="CopyDocument" @click="copyToClipboard(getCallbackUrl(editForm.id))" />
              </template>
            </el-input>
          </div>
        </el-form-item>

        <el-collapse class="guide-collapse">
          <el-collapse-item title="配置指引" name="1">
            <div class="guide-content">
              <ol>
                <li>登录 <a href="https://work.weixin.qq.com/" target="_blank">企业微信管理后台</a>。</li>
                <li>进入 <strong>应用管理</strong> -> 选择对应的应用。</li>
                <li>找到 <strong>接收消息</strong> -> 点击 <strong>设置 API 接收</strong>。</li>
                <li>在配置页面：
                  <ul>
                    <li><strong>URL</strong>: 复制上方本系统提供的 <strong>回调 URL</strong>。</li>
                    <li><strong>Token</strong>: 点击“随机获取”，并同步填写到本页面的 <strong>Token</strong> 输入框中。</li>
                    <li><strong>EncodingAESKey</strong>: 点击“随机获取”，并同步填写到本页面的 <strong>EncodingAESKey</strong> 输入框中。</li>
                  </ul>
                </li>
                <li><strong>重要顺序</strong>: 先在本页面点击 <strong>保存配置</strong>，然后再在企业微信后台点击 <strong>保存</strong> 进行验证。</li>
              </ol>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleUpdate">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <AppPluginsDialog
      v-if="selectedApp"
      v-model:visible="pluginsDialogVisible"
      :app-id="selectedApp.id"
      :app-name="selectedApp.name || selectedApp.agentId"
    />
  </section>
</template>

<style scoped>
.app-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.app-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.callback-url-container {
  width: 100%;
}

.guide-collapse {
  margin-top: 20px;
  border: none;
}

:deep(.guide-collapse .el-collapse-item__header) {
  font-size: 13px;
  color: var(--el-color-primary);
  background: transparent;
  border: none;
}

:deep(.guide-collapse .el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

.guide-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.guide-content ol {
  padding-left: 18px;
  margin: 0;
}

.guide-content ul {
  padding-left: 18px;
  margin: 4px 0;
  list-style-type: circle;
}
</style>
