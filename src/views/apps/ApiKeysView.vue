<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import {
  createAppApiKey,
  deleteAppApiKey,
  fetchAppApiKey,
  fetchApps,
  updateAppApiKey,
} from '@/api/apps'
import type {
  PortalAppApiKeyResponse,
  PortalAppResponse,
} from '@/api/types'

const apps = ref<PortalAppResponse[]>([])
const selectedAppId = ref<number | null>(null)
const apiKeyInfo = ref<PortalAppApiKeyResponse | null>(null)
const isLoadingApps = ref(false)
const isKeyLoading = ref(false)
const isMutating = ref(false)
const rateLimit = ref<number | null>(null)

const selectedApp = computed(() =>
  apps.value.find((app) => app.id === selectedAppId.value),
)
const hasKey = computed(() => apiKeyInfo.value?.hasKey ?? false)
const apiKeyValue = computed(() => apiKeyInfo.value?.apiKey || '')

const formatDate = (value?: number | null) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const loadApps = async () => {
  isLoadingApps.value = true
  try {
    apps.value = await fetchApps()
    if (!selectedAppId.value && apps.value.length) {
      selectedAppId.value = apps.value[0].id
    }
  } catch {
    // Error handled by interceptor
  } finally {
    isLoadingApps.value = false
  }
}

const loadApiKey = async (appId: number) => {
  isKeyLoading.value = true
  try {
    apiKeyInfo.value = await fetchAppApiKey(appId)
    rateLimit.value = apiKeyInfo.value.rateLimitPerMinute ?? null
  } catch {
    apiKeyInfo.value = null
    rateLimit.value = null
  } finally {
    isKeyLoading.value = false
  }
}

const handleGenerate = async () => {
  if (!selectedAppId.value) {
    ElMessage.warning('请先选择应用')
    return
  }
  isMutating.value = true
  try {
    await createAppApiKey(selectedAppId.value)
    ElMessage.success('已生成新的 API Key')
    loadApiKey(selectedAppId.value)
  } catch {
    // Error handled by interceptor
  } finally {
    isMutating.value = false
  }
}

const handleDelete = async () => {
  if (!selectedAppId.value) return
  try {
    await ElMessageBox.confirm(
      '删除后该应用的开放接口将无法调用，确认删除当前密钥吗？',
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  isMutating.value = true
  try {
    await deleteAppApiKey(selectedAppId.value)
    ElMessage.success('已删除 API Key')
    apiKeyInfo.value = null
    rateLimit.value = null
  } catch {
    // Error handled by interceptor
  } finally {
    isMutating.value = false
  }
}

const handleUpdateRateLimit = async () => {
  if (!selectedAppId.value) return
  isMutating.value = true
  try {
    await updateAppApiKey(selectedAppId.value, {
      rateLimitPerMinute: rateLimit.value ?? null,
    })
    ElMessage.success('已更新限流配置')
    loadApiKey(selectedAppId.value)
  } catch {
    // Error handled by interceptor
  } finally {
    isMutating.value = false
  }
}

const handleCopyKey = async () => {
  if (!apiKeyValue.value) return
  try {
    await navigator.clipboard.writeText(apiKeyValue.value)
    ElMessage.success('已复制 API Key')
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}

onMounted(() => {
  loadApps()
})

watch(selectedAppId, (appId) => {
  if (appId) {
    loadApiKey(appId)
  } else {
    apiKeyInfo.value = null
  }
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>API 密钥</h1>
        <p>为每个应用管理开放接口的 API Key，支持生成/重置、限流和删除。</p>
      </div>
      <div class="page-actions">
        <el-button :icon="RefreshRight" @click="loadApps">刷新列表</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>选择应用</h3>
                <p>选择需要查看或操作密钥的应用</p>
              </div>
            </div>
          </template>

          <el-form label-width="100px">
            <el-form-item label="应用">
              <el-select
                v-model="selectedAppId"
                placeholder="选择应用"
                :loading="isLoadingApps"
              >
                <el-option
                  v-for="app in apps"
                  :key="app.id"
                  :label="app.name || app.agentId"
                  :value="app.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="AgentId">
              <el-input
                :model-value="selectedApp?.agentId || ''"
                disabled
                placeholder="请选择应用"
              />
            </el-form-item>
            <el-form-item label="名称">
              <el-input
                :model-value="selectedApp?.name || '--'"
                disabled
                placeholder="请选择应用"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>密钥详情</h3>
                <p>生成、复制或删除当前应用的 API Key</p>
              </div>
              <el-button
                :icon="RefreshRight"
                text
                :loading="isKeyLoading"
                @click="selectedAppId && loadApiKey(selectedAppId)"
              >
                刷新
              </el-button>
            </div>
          </template>

          <el-skeleton :loading="isKeyLoading" animated :rows="4">
            <template #default>
              <el-alert
                v-if="selectedAppId && !hasKey"
                title="当前应用尚未生成 API Key"
                type="info"
                show-icon
                class="mb-16"
                description="生成后即可通过 OpenAPI 调用消息发送接口。"
              />

              <el-alert
                v-else-if="!selectedAppId"
                title="请选择应用以查看密钥"
                type="warning"
                show-icon
                class="mb-16"
              />

              <el-form label-width="110px">
                <el-form-item label="当前 Key">
                  <el-input
                    :model-value="apiKeyValue"
                    placeholder="暂无密钥"
                    readonly
                  >
                    <template #append>
                      <el-button
                        text
                        :disabled="!apiKeyValue"
                        @click="handleCopyKey"
                      >
                        复制
                      </el-button>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="每分钟限流">
                  <el-input-number
                    v-model="rateLimit"
                    :min="0"
                    :controls="false"
                    placeholder="0 或留空表示不限流"
                  />
                  <span class="form-hint">0 或空 = 不限流</span>
                </el-form-item>

                <el-form-item label="创建时间">
                  <span>{{ formatDate(apiKeyInfo?.createdAt) }}</span>
                </el-form-item>
                <el-form-item label="更新时间">
                  <span>{{ formatDate(apiKeyInfo?.updatedAt) }}</span>
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="isMutating"
                    :disabled="!selectedAppId"
                    @click="handleGenerate"
                  >
                    {{ hasKey ? '重置/生成新 Key' : '生成 API Key' }}
                  </el-button>
                  <el-button
                    :loading="isMutating"
                    :disabled="!selectedAppId"
                    @click="handleUpdateRateLimit"
                  >
                    更新限流
                  </el-button>
                  <el-button
                    type="danger"
                    :loading="isMutating"
                    :disabled="!selectedAppId || !hasKey"
                    @click="handleDelete"
                  >
                    删除密钥
                  </el-button>
                </el-form-item>
              </el-form>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.form-hint {
  color: #909399;
  margin-left: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
