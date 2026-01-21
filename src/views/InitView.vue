<script setup lang="ts">
import {
  ArrowRight,
  Lock,
  OfficeBuilding,
  Key,
  SetUp,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { initSystem } from '@/api/init'
import { useSystemStore } from '@/stores/system'

const router = useRouter()
const systemStore = useSystemStore()

const username = ref('admin')
const password = ref('')
const confirmPassword = ref('')
const turnstileEnabled = ref(false)
const turnstileSiteKey = ref('')
const turnstileSecretKey = ref('')
const isSubmitting = ref(false)

const handleInit = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (password.value !== confirmPassword.value) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  if (turnstileEnabled.value) {
    if (!turnstileSiteKey.value || !turnstileSecretKey.value) {
      ElMessage.warning('开启 Turnstile 需要填写 Site Key 和 Secret Key')
      return
    }
  }

  isSubmitting.value = true
  try {
    await initSystem({
      username: username.value,
      password: password.value,
      turnstileEnabled: turnstileEnabled.value,
      turnstileSiteKey: turnstileEnabled.value ? turnstileSiteKey.value : undefined,
      turnstileSecretKey: turnstileEnabled.value ? turnstileSecretKey.value : undefined,
    })
    ElMessage.success('系统初始化成功，请登录')
    systemStore.setInitialized(true)
    router.replace('/login')
  } catch (error: any) {
    // Error is handled by http interceptor usually, but safe catch here
    console.error('Init failed', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="init-page">
    <section class="init-hero">
      <div class="hero-brand">
        <span class="brand-icon">
          <el-icon>
            <OfficeBuilding />
          </el-icon>
        </span>
        <span class="brand-text">WeCom Enterprise</span>
      </div>

      <div class="hero-content">
        <h1>
          系统初始化
          <span>Welcome to Push Server</span>
        </h1>
        <p>
          配置您的管理员账户与安全设置，开启高效推送服务之旅。
        </p>
      </div>

      <div class="hero-foot">
        © 2024 WeCom Enterprise System. All rights reserved.
      </div>
      
      <!-- Background elements reused from LoginView style if possible, simplified here -->
      <div class="hero-globe"></div>
    </section>

    <section class="init-panel">
      <div class="init-card">
        <div class="card-header">
          <h2>初始化设置</h2>
          <p>请设置管理员密码及安全选项</p>
        </div>

        <div class="init-form">
          <div class="form-field">
            <label>管理员用户名</label>
            <el-input v-model="username" placeholder="默认为 admin" disabled>
              <template #prefix>
                <el-icon><SetUp /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="form-field">
            <label>管理员密码</label>
            <el-input
              v-model="password"
              placeholder="设置登录密码"
              type="password"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="form-field">
            <label>确认密码</label>
            <el-input
              v-model="confirmPassword"
              placeholder="再次输入密码"
              type="password"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="form-divider"></div>

          <div class="form-field switch-field">
            <div class="switch-label">
              <label>开启 Turnstile 验证</label>
              <span class="sub-label">登录时启用 Cloudflare Turnstile 验证</span>
            </div>
            <el-switch v-model="turnstileEnabled" />
          </div>

          <template v-if="turnstileEnabled">
            <div class="form-field">
              <label>Site Key</label>
              <el-input v-model="turnstileSiteKey" placeholder="输入 Turnstile Site Key">
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="form-field">
              <label>Secret Key</label>
              <el-input v-model="turnstileSecretKey" placeholder="输入 Turnstile Secret Key" type="password" show-password>
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </div>
          </template>

          <el-button
            type="primary"
            class="init-button"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="handleInit"
          >
            完成初始化
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.init-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 520px);
  background: linear-gradient(120deg, #e8edf4 0%, #f3f6fa 45%, #f6f9fc 100%);
}

.init-hero {
  position: relative;
  padding: 52px 56px;
  color: #eef5ff;
  background: radial-gradient(circle at 25% 20%, #3f6ea6 0%, #1f4166 55%, #10263f 100%);
  overflow: hidden;
}

.hero-brand {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.brand-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.92);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 460px;
  margin-top: 120px;
}

.hero-content h1 {
  font-size: 40px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 1px;
}

.hero-content h1 span {
  display: block;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
  font-size: 30px;
  margin-top: 8px;
}

.hero-content p {
  margin-top: 18px;
  color: rgba(233, 242, 255, 0.75);
  font-size: 14px;
  line-height: 1.8;
}

.hero-foot {
  position: absolute;
  left: 56px;
  bottom: 32px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  z-index: 2;
}

.hero-globe {
  position: absolute;
  right: -18%;
  bottom: -30%;
  width: 540px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent 60%);
  opacity: 0.75;
  z-index: 1;
}

.init-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 52px 56px;
  gap: 22px;
}

.init-card {
  padding: 32px 34px 28px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 42px rgba(15, 23, 42, 0.16);
  border: 1px solid #e5edf5;
}

.card-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: #101418;
}

.card-header p {
  margin-top: 8px;
  color: #5c708a;
  font-size: 13px;
}

.init-form {
  margin-top: 24px;
  display: grid;
  gap: 18px;
}

.form-field label {
  display: block;
  font-size: 13px;
  color: #101418;
  margin-bottom: 8px;
  font-weight: 600;
}

.form-divider {
  height: 1px;
  background: #eef2f6;
  margin: 8px 0;
}

.switch-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-label label {
  margin-bottom: 4px;
}

.sub-label {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.init-button {
  width: 100%;
  height: 46px;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .init-page {
    grid-template-columns: 1fr;
  }
  .init-hero {
    min-height: 200px;
    padding: 32px;
  }
  .hero-content {
    margin-top: 40px;
  }
}
</style>
