<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  RefreshRight,
  Delete,
  Refresh,
  CopyDocument,
  Box,
} from '@element-plus/icons-vue'
import {
  fetchPlugins,
  createPlugin,
  resetPluginToken,
  togglePluginStatus,
  deletePlugin,
} from '@/api/plugins'
import type { PortalPluginResponse } from '@/api/types'

const plugins = ref<PortalPluginResponse[]>([])
const isLoading = ref(false)
const dialogVisible = ref(false)
const tokenDialogVisible = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  pluginKey: '',
  name: '',
  description: '',
})

const currentToken = ref('')
const currentPluginName = ref('')

const loadPlugins = async () => {
  isLoading.value = true
  try {
    plugins.value = await fetchPlugins()
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

const openDialog = () => {
  form.pluginKey = ''
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

const handleCreate = async () => {
  if (!form.pluginKey || !form.name) {
    ElMessage.warning('请输入插件标识与名称')
    return
  }
  isSubmitting.value = true
  try {
    const token = await createPlugin({
      pluginKey: form.pluginKey,
      name: form.name,
      description: form.description,
    })
    dialogVisible.value = false
    showTokenDialog(form.name, token)
    loadPlugins()
  } catch {
    // Error handled by interceptor
  } finally {
    isSubmitting.value = false
  }
}

const showTokenDialog = (name: string, token: string) => {
  currentPluginName.value = name
  currentToken.value = token
  tokenDialogVisible.value = true
}

const handleStatusChange = async (plugin: PortalPluginResponse) => {
  const originalStatus = plugin.status
  // Optimistic update
  plugin.status = plugin.status === 1 ? 0 : 1
  try {
    await togglePluginStatus({
      id: plugin.id,
      status: plugin.status,
    })
    ElMessage.success(plugin.status === 1 ? '插件已启用' : '插件已禁用')
  } catch {
    // Revert on error
    plugin.status = originalStatus
  }
}

const handleResetToken = async (plugin: PortalPluginResponse) => {
  try {
    await ElMessageBox.confirm(
      `重置 Token 后旧 Token 将立即失效，确认重置？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '重置',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  try {
    const newToken = await resetPluginToken(plugin.id)
    showTokenDialog(plugin.name, newToken)
  } catch {
    // Error handled by interceptor
  }
}

const handleDelete = async (plugin: PortalPluginResponse) => {
  try {
    await ElMessageBox.confirm(
      `确认删除插件 ${plugin.name}？`,
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
    await deletePlugin(plugin.id)
    ElMessage.success('插件已删除')
    loadPlugins()
  } catch {
    // Error handled by interceptor
  }
}

const copyToken = async () => {
  try {
    await navigator.clipboard.writeText(currentToken.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}

onMounted(() => {
  loadPlugins()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>插件管理</h1>
        <p>管理第三方插件接入与凭证</p>
      </div>
      <div class="page-actions">
        <el-button :icon="RefreshRight" :loading="isLoading" @click="loadPlugins">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog">
          新增插件
        </el-button>
      </div>
    </div>

    <div v-loading="isLoading" class="plugin-grid-container">
      <el-row :gutter="20">
        <el-col
          v-for="plugin in plugins"
          :key="plugin.id"
          :xs="24"
          :sm="12"
          :lg="8"
          :xl="6"
        >
          <el-card class="plugin-card" shadow="hover">
            <div class="plugin-header">
              <div class="plugin-icon">
                <el-icon :size="24"><Box /></el-icon>
              </div>
              <div class="plugin-title-area">
                <div class="plugin-name">
                  {{ plugin.name }}
                  <el-tag v-if="plugin.isBuiltin" size="small" type="info" effect="plain" class="builtin-tag">内置</el-tag>
                </div>
                <div class="plugin-key">{{ plugin.pluginKey }}</div>
              </div>
              <el-switch
                :model-value="plugin.status === 1"
                inline-prompt
                active-text="开"
                inactive-text="关"
                @change="() => handleStatusChange(plugin)"
              />
            </div>
            
            <div class="plugin-desc">
              {{ plugin.description || '暂无描述' }}
            </div>

            <div class="plugin-footer">
              <div class="plugin-status-dot">
                <span
                  class="dot"
                  :class="{ connected: plugin.isConnected }"
                ></span>
                {{ plugin.isConnected ? '已连接' : '未连接' }}
              </div>
              <div class="plugin-actions">
                <el-tooltip :content="plugin.isBuiltin ? '内置插件不支持重置 Token' : '重置 Token'" placement="top">
                  <el-button
                    circle
                    size="small"
                    :icon="Refresh"
                    :disabled="plugin.isBuiltin"
                    @click="handleResetToken(plugin)"
                  />
                </el-tooltip>
                <el-tooltip :content="plugin.isBuiltin ? '内置插件不可删除' : '删除插件'" placement="top">
                  <el-button
                    circle
                    size="small"
                    type="danger"
                    :icon="Delete"
                    :disabled="plugin.isBuiltin"
                    @click="handleDelete(plugin)"
                  />
                </el-tooltip>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-empty v-if="!plugins.length && !isLoading" description="暂无插件，请点击右上角新增" />
    </div>

    <!-- Create Dialog -->
    <el-dialog v-model="dialogVisible" title="新增插件" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标识 Key">
          <el-input v-model="form.pluginKey" placeholder="唯一标识，如 weather-plugin" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="插件显示名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="插件功能描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- Token Dialog -->
    <el-dialog
      v-model="tokenDialogVisible"
      title="插件访问凭证"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="token-alert">
        <p><strong>{{ currentPluginName }}</strong> 的 Token 已生成。</p>
        <p class="warning-text">请立即复制并保存，关闭窗口后将无法再次查看！</p>
      </div>
      <div class="token-box">
        <el-input v-model="currentToken" readonly type="textarea" :rows="3" resize="none" />
        <el-button class="copy-btn" :icon="CopyDocument" @click="copyToken">
          复制
        </el-button>
      </div>
      <template #footer>
        <el-button type="primary" @click="tokenDialogVisible = false">
          我已保存
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.plugin-grid-container {
  padding: 10px 0;
}

.plugin-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s;
}

.plugin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.plugin-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.plugin-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plugin-title-area {
  flex: 1;
  overflow: hidden;
}

.plugin-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.builtin-tag {
  transform: scale(0.85);
  transform-origin: left center;
}

.plugin-key {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plugin-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  height: 40px;
  line-height: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16px;
}

.plugin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}

.plugin-status-dot {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--el-color-info-light-5);
}

.dot.connected {
  background-color: var(--el-color-success);
}

.token-alert {
  margin-bottom: 16px;
  color: var(--el-text-color-regular);
}

.warning-text {
  color: var(--el-color-danger);
  margin-top: 4px;
  font-size: 13px;
}

.token-box {
  position: relative;
}

.copy-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
}
</style>
