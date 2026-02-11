<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { fetchCorp, updateCorp } from '@/api/corp'
import { updatePassword } from '@/api/me'
import { fetchTurnstileConfig, updateTurnstileConfig } from '@/api/system'
import type { TurnstileConfig } from '@/api/system'

const corpForm = reactive({
  corpId: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
})

const turnstileForm = reactive<TurnstileConfig>({
  enabled: false,
  siteKey: '',
  secretKey: '',
})

const isLoading = ref(false)
const isSavingCorp = ref(false)
const isSavingPassword = ref(false)
const isSavingTurnstile = ref(false)

const loadSettings = async () => {
  isLoading.value = true
  try {
    const [corp, turnstile] = await Promise.all([
      fetchCorp(),
      fetchTurnstileConfig()
    ])
    corpForm.corpId = corp.corpId ?? ''
    
    turnstileForm.enabled = turnstile.enabled
    turnstileForm.siteKey = turnstile.siteKey
    turnstileForm.secretKey = turnstile.secretKey
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

const handleSaveCorp = async () => {
  const corpId = corpForm.corpId.trim()
  if (!corpId) {
    ElMessage.warning('请输入企业 CorpId')
    return
  }
  isSavingCorp.value = true
  try {
    await updateCorp(corpId)
    ElMessage.success('企业配置已更新')
  } catch {
    // Error handled by interceptor
  } finally {
    isSavingCorp.value = false
  }
}

const handleUpdatePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请输入旧密码与新密码')
    return
  }
  isSavingPassword.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    ElMessage.success('密码已更新')
  } catch {
    // Error handled by interceptor
  } finally {
    isSavingPassword.value = false
  }
}

const handleSaveTurnstile = async () => {
  if (turnstileForm.enabled && (!turnstileForm.siteKey || !turnstileForm.secretKey)) {
    ElMessage.warning('启用 Turnstile 时必须填写 Site Key 与 Secret Key')
    return
  }
  
  isSavingTurnstile.value = true
  try {
    await updateTurnstileConfig({ ...turnstileForm })
    ElMessage.success('Turnstile 配置已更新')
    // Reload to get the masked secret key if it was changed
    const turnstile = await fetchTurnstileConfig()
    turnstileForm.siteKey = turnstile.siteKey
    turnstileForm.secretKey = turnstile.secretKey
  } catch {
    // Error handled by interceptor
  } finally {
    isSavingTurnstile.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>系统设置</h1>
        <p>管理企业信息、账号安全与人机验证</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>企业基本信息</h3>
                <p>用于绑定企业微信与推送服务</p>
              </div>
            </div>
          </template>

          <el-skeleton v-if="isLoading" animated :rows="3" />
          <el-form v-else :model="corpForm" label-width="100px" class="stack-form">
            <el-form-item label="CorpId">
              <el-input
                v-model="corpForm.corpId"
                placeholder="请输入企业 CorpId"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="isSavingCorp"
                @click="handleSaveCorp"
              >
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="panel-card" style="margin-top: 20px">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>人机验证 (Turnstile)</h3>
                <p>配置 Cloudflare Turnstile 以防止恶意登录</p>
              </div>
            </div>
          </template>

          <el-skeleton v-if="isLoading" animated :rows="4" />
          <el-form v-else :model="turnstileForm" label-width="100px" class="stack-form">
            <el-form-item label="启用验证">
              <el-switch v-model="turnstileForm.enabled" />
              <span class="item-tip">开启后，登录页面将要求完成人机验证</span>
            </el-form-item>
            
            <el-form-item label="Site Key">
              <template #label>
                <span>Site Key</span>
                <el-tooltip content="Cloudflare Turnstile 提供的站点密钥" placement="top">
                  <el-icon class="field-info-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input
                v-model="turnstileForm.siteKey"
                placeholder="0x4AAAAAAABBBBBBBBBBBBB"
                :disabled="!turnstileForm.enabled"
              />
            </el-form-item>

            <el-form-item label="Secret Key">
              <template #label>
                <span>Secret Key</span>
                <el-tooltip content="Cloudflare Turnstile 提供的通信密钥" placement="top">
                  <el-icon class="field-info-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input
                v-model="turnstileForm.secretKey"
                type="password"
                show-password
                placeholder="0x4AAAAAAABBBBBBBBBBBBBBBBBBBBBBBBB"
                :disabled="!turnstileForm.enabled"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="isSavingTurnstile"
                @click="handleSaveTurnstile"
              >
                保存验证配置
              </el-button>
              <el-link 
                href="https://dash.cloudflare.com/?to=/:account/turnstile" 
                target="_blank" 
                type="info" 
                style="margin-left: 15px; font-size: 13px"
              >
                获取 Key
              </el-link>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>账号安全</h3>
                <p>更新登录密码，保障账号安全</p>
              </div>
            </div>
          </template>
          <el-form :model="passwordForm" label-width="100px" class="stack-form">
            <el-form-item label="旧密码">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入旧密码"
              />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="请输入新密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="isSavingPassword"
                @click="handleUpdatePassword"
              >
                更新密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.item-tip {
  margin-left: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.field-info-icon {
  margin-left: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: help;
  vertical-align: middle;
}
</style>
