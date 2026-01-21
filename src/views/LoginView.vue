<script setup lang="ts">
import {
  ArrowRight,
  Key,
  Lock,
  OfficeBuilding,
  RefreshRight,
  User,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { type CaptchaConfig, fetchCaptcha, getCaptchaConfig, login } from '@/api/login'
import TurnstileWidget from '@/components/TurnstileWidget.vue'

const router = useRouter()
const activeTab = ref('account')
const account = ref('')
const password = ref('')
const captcha = ref('')
const autoLogin = ref(false)
const isSubmitting = ref(false)
const captchaImage = ref('')
const turnstileEnabled = ref(false)
const turnstileSiteKey = ref('')
const turnstileToken = ref('')
const codeCaptchaVisible = ref(true) // Controls visibility of legacy image captcha
const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
const normalizedApiBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase
let captchaObjectUrl: string | null = null

const setCaptchaImage = (blob: Blob) => {
  if (captchaObjectUrl) {
    URL.revokeObjectURL(captchaObjectUrl)
  }
  captchaObjectUrl = URL.createObjectURL(blob)
  captchaImage.value = captchaObjectUrl
}

const refreshCaptcha = async () => {
  // If Turnstile is enabled, we don't need image captcha (or we reset the widget)
  if (turnstileEnabled.value) {
    turnstileToken.value = ''
    captcha.value = '' // Clear internal captcha value
    return
  }
  
  captcha.value = ''
  try {
    const blob = await fetchCaptcha()
    // If the response is actually JSON (config) instead of blob, it might mean image captcha is disabled
    if (blob.type === 'application/json') {
       codeCaptchaVisible.value = false
       return
    }
    setCaptchaImage(blob)
    codeCaptchaVisible.value = true
  } catch {
    // Fallback or error handling
    captchaImage.value = `${normalizedApiBase}/captcha?t=${Date.now()}`
  }
}

const loadCaptchaConfig = async () => {
  try {
    const res = await getCaptchaConfig()
    // Check if the response matches the config structure
    if (res && typeof res.enabled === 'boolean') {
      turnstileEnabled.value = res.enabled
      turnstileSiteKey.value = res.siteKey
      
      if (res.enabled) {
        codeCaptchaVisible.value = false
      } else {
        // Fallback to legacy check
        refreshCaptcha()
      }
    } else {
       // Unexpected response, try legacy
       refreshCaptcha()
    }
  } catch (e) {
    // API might not exist or network error, fallback to legacy
    refreshCaptcha()
  }
}

const handleTurnstileVerify = (token: string) => {
  turnstileToken.value = token
  captcha.value = token // Bind to the same model used for submission
}

const handleLogin = async () => {
  const trimmedAccount = account.value.trim()
  const trimmedCaptcha = captcha.value.trim()
  
  if (!trimmedAccount || !password.value) {
     ElMessage.warning('请输入账号和密码')
     return
  }
  
  if ((turnstileEnabled.value || codeCaptchaVisible.value) && !trimmedCaptcha) {
    ElMessage.warning(turnstileEnabled.value ? '请完成验证' : '请输入验证码')
    return
  }

  isSubmitting.value = true
  try {
    const response = await login({
      account: trimmedAccount,
      password: password.value,
      captcha: trimmedCaptcha,
    })
    if (response.code === 200) {
      ElMessage.success(response.msg || '登录成功')
      router.replace('/dashboard')
    } else {
      ElMessage.error(response.msg || '登录失败')
      refreshCaptcha()
    }
  } catch {
    ElMessage.error('登录失败，请稍后重试')
    refreshCaptcha()
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadCaptchaConfig()
})

onBeforeUnmount(() => {
  if (captchaObjectUrl) {
    URL.revokeObjectURL(captchaObjectUrl)
  }
})
</script>

<template>
  <div class="login-page">
    <section class="login-hero">
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
          连接创造价值
          <span>协同驱动未来</span>
        </h1>
        <p>
          为企业打造高效、安全的数字化办公环境。统一管理，无缝协作，赋能每一位员工。
        </p>
        <div class="hero-tags">
          <span class="hero-tag">
            <el-icon>
              <Lock />
            </el-icon>
            企业级安全
          </span>
          <span class="hero-tag">
            <el-icon>
              <RefreshRight />
            </el-icon>
            实时同步
          </span>
          <span class="hero-tag">
            <el-icon>
              <User />
            </el-icon>
            智能协作
          </span>
        </div>
      </div>

      <div class="hero-foot">
        © 2024 WeCom Enterprise System. All rights reserved.
      </div>

      <div class="hero-globe"></div>
      <div class="hero-orbit"></div>
    </section>

    <section class="login-panel">
      <div class="mobile-brand">
        <el-icon>
          <OfficeBuilding />
        </el-icon>
        <span>WeCom</span>
      </div>

      <div class="login-card">
        <div class="qr-corner">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="6" height="6" rx="1"></rect>
            <rect x="15" y="3" width="6" height="6" rx="1"></rect>
            <rect x="3" y="15" width="6" height="6" rx="1"></rect>
            <rect x="15" y="15" width="2" height="2"></rect>
            <rect x="19" y="15" width="2" height="2"></rect>
            <rect x="15" y="19" width="2" height="2"></rect>
            <rect x="19" y="19" width="2" height="2"></rect>
          </svg>
          <span class="qr-tip">扫码快捷登录</span>
        </div>

        <div class="card-header">
          <h2>管理后台登录</h2>
          <p>请选择登录方式进入企业微信管理系统</p>
        </div>

        <el-tabs v-model="activeTab" class="login-tabs">
          <el-tab-pane label="账号登录" name="account">
            <div class="login-form">
              <div class="form-field">
                <label>用户名 / 邮箱</label>
                <el-input
                  v-model="account"
                  placeholder="请输入您的企业账号"
                  @keyup.enter="handleLogin"
                >
                  <template #prefix>
                    <el-icon>
                      <User />
                    </el-icon>
                  </template>
                </el-input>
              </div>

              <div class="form-field">
                <label>密码</label>
                <el-input
                  v-model="password"
                  placeholder="请输入密码"
                  type="password"
                  show-password
                  @keyup.enter="handleLogin"
                >
                  <template #prefix>
                    <el-icon>
                      <Lock />
                    </el-icon>
                  </template>
                </el-input>
              </div>

                <div class="form-field" v-if="turnstileEnabled">
                  <label>安全验证</label>
                  <TurnstileWidget
                    :site-key="turnstileSiteKey"
                    @verify="handleTurnstileVerify"
                    @expire="turnstileToken = ''; captcha = ''"
                  />
                </div>

                <div class="form-field" v-else-if="codeCaptchaVisible">
                  <label>验证码</label>
                  <div class="captcha-row">
                    <el-input
                      v-model="captcha"
                      placeholder="输入右侧验证码"
                      @keyup.enter="handleLogin"
                    >
                      <template #prefix>
                        <el-icon>
                          <Key />
                        </el-icon>
                      </template>
                    </el-input>
                    <button
                      class="captcha-box"
                      type="button"
                      aria-label="点击更换验证码"
                      @click="refreshCaptcha"
                    >
                      <img class="captcha-image" :src="captchaImage" alt="验证码图片" />
                    </button>
                    <button class="captcha-refresh" type="button" @click="refreshCaptcha">
                      <el-icon>
                        <RefreshRight />
                      </el-icon>
                    </button>
                  </div>
                </div>

              <div class="form-meta">
                <el-checkbox v-model="autoLogin">自动登录</el-checkbox>
                <a class="text-link" href="#">忘记密码?</a>
              </div>

              <el-button
                type="primary"
                class="login-button"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="handleLogin"
              >
                登 录
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="扫码登录" name="qr">
            <div class="qr-panel">
              <div class="qr-code">
                <div class="qr-grid"></div>
              </div>
              <p>打开企业微信扫一扫</p>
              <p class="qr-tip-text">支持管理员扫码快速登录</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="panel-footer">
        <span>还没有账号?</span>
        <a class="text-link" href="#">联系管理员开通</a>
      </div>
      <div class="panel-links">
        <a href="#">隐私政策</a>
        <span class="divider"></span>
        <a href="#">服务条款</a>
        <span class="divider"></span>
        <a href="#">帮助中心</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 520px);
  background: linear-gradient(120deg, #e8edf4 0%, #f3f6fa 45%, #f6f9fc 100%);
}

.login-hero {
  position: relative;
  padding: 52px 56px;
  color: #eef5ff;
  background: radial-gradient(circle at 25% 20%, #3f6ea6 0%, #1f4166 55%, #10263f 100%);
  overflow: hidden;
}

.login-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 32px 32px, 14px 14px;
  background-position: 0 0, 6px 6px;
  opacity: 0.45;
}

.login-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(12, 28, 45, 0.1), rgba(8, 18, 30, 0.6));
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
  animation: hero-rise 0.8s ease both;
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

.hero-tags {
  display: flex;
  gap: 12px;
  margin-top: 26px;
  flex-wrap: wrap;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 12px;
  animation: tag-fade 0.8s ease both;
}

.hero-tag:nth-child(2) {
  animation-delay: 0.1s;
}

.hero-tag:nth-child(3) {
  animation-delay: 0.2s;
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
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent 60%),
    radial-gradient(circle at 50% 65%, rgba(255, 255, 255, 0.08), transparent 58%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 30px 60px rgba(6, 24, 45, 0.45),
    inset 0 0 40px rgba(255, 255, 255, 0.08);
  opacity: 0.75;
  z-index: 1;
}

.hero-globe::after {
  content: '';
  position: absolute;
  inset: 16%;
  border-radius: 50%;
  background:
    radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 14px 14px;
  opacity: 0.7;
}

.hero-orbit {
  position: absolute;
  right: -10%;
  bottom: -8%;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  opacity: 0.35;
  z-index: 1;
}

.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 52px 56px;
  gap: 22px;
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 8px;
  color: #2c5281;
  font-weight: 700;
  font-size: 18px;
}

.login-card {
  position: relative;
  padding: 32px 34px 28px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 42px rgba(15, 23, 42, 0.16);
  border: 1px solid #e5edf5;
  overflow: hidden;
  animation: card-rise 0.7s ease both;
}

.qr-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #2c5281;
}

.qr-corner::before {
  content: '';
  position: absolute;
  top: -12px;
  right: -12px;
  width: 82px;
  height: 82px;
  background: linear-gradient(140deg, rgba(44, 82, 129, 0.12), transparent);
  border-bottom-left-radius: 28px;
}

.qr-corner svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
  position: relative;
  z-index: 1;
  transition: transform 0.2s ease;
}

.qr-corner:hover svg {
  transform: scale(1.08);
}

.qr-tip {
  position: absolute;
  top: 22px;
  right: 72px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #2c5281;
  color: #ffffff;
  font-size: 11px;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}

.qr-corner:hover .qr-tip {
  opacity: 1;
  transform: translateX(0);
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

.login-form {
  margin-top: 18px;
  display: grid;
  gap: 16px;
}

.form-field label {
  display: block;
  font-size: 13px;
  color: #101418;
  margin-bottom: 8px;
  font-weight: 600;
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
}

.captcha-box {
  height: 44px;
  min-width: 100px;
  padding: 0 12px;
  border-radius: 10px;
  background: #eef2f6;
  border: 1px solid #d4dbe2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.captcha-image {
  height: 32px;
  width: auto;
  display: block;
}

.captcha-refresh {
  width: 40px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #5c708a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.captcha-refresh:hover {
  color: #2c5281;
  background: rgba(44, 82, 129, 0.08);
}

.form-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
}

.login-button {
  width: 100%;
  height: 46px;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  gap: 8px;
}

.qr-panel {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 22px 12px 6px;
}

.qr-code {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  background: #eef2f6;
  border: 1px dashed #cbd5f5;
  display: grid;
  place-items: center;
  position: relative;
}

.qr-grid {
  width: 120px;
  height: 120px;
  background-image:
    linear-gradient(90deg, rgba(148, 163, 184, 0.4) 1px, transparent 1px),
    linear-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px);
  background-size: 12px 12px;
  opacity: 0.6;
}

.qr-panel p {
  font-size: 14px;
  color: #1f2937;
}

.qr-tip-text {
  font-size: 12px;
  color: #94a3b8;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.panel-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.panel-links a {
  color: inherit;
}

.divider {
  width: 1px;
  height: 12px;
  background: #d4dbe2;
}

.text-link {
  color: #2c5281;
  font-weight: 600;
}

.text-link:hover {
  color: #234166;
}

:deep(.login-tabs .el-tabs__nav-wrap::after) {
  background-color: #e5e9ee;
}

:deep(.login-tabs .el-tabs__item) {
  font-size: 14px;
  color: #5c708a;
  padding: 0 8px;
  font-weight: 600;
}

:deep(.login-tabs .el-tabs__item.is-active) {
  color: #2c5281;
  font-weight: 700;
}

:deep(.login-tabs .el-tabs__active-bar) {
  height: 3px;
  background: #2c5281;
  border-radius: 999px;
}

:deep(.login-tabs .el-tabs__header) {
  margin-top: 24px;
  margin-bottom: 8px;
}

:deep(.login-card .el-input__wrapper) {
  padding: 6px 12px;
  background: #f5f7fb;
  border: 1px solid #d4dbe2;
  border-radius: 10px;
  box-shadow: none;
}

:deep(.login-card .el-input__wrapper.is-focus) {
  border-color: #2c5281;
  box-shadow: 0 0 0 4px rgba(44, 82, 129, 0.12);
}

:deep(.login-card .el-input__inner) {
  color: #101418;
}

:deep(.el-checkbox__label) {
  color: #5c708a;
  font-size: 12px;
  font-weight: 500;
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tag-fade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1100px) {
  .login-page {
    grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
  }

  .login-hero {
    padding: 44px;
  }

  .login-panel {
    padding: 44px 32px;
  }
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-hero {
    min-height: 320px;
  }

  .hero-content {
    margin-top: 80px;
  }

  .hero-foot {
    position: static;
    margin-top: 60px;
  }

  .mobile-brand {
    display: inline-flex;
  }
}

@media (max-width: 640px) {
  .login-hero {
    display: none;
  }

  .login-panel {
    min-height: 100vh;
    padding: 32px 20px;
  }

  .login-card {
    padding: 28px 20px 22px;
  }

  .captcha-box {
    min-width: 88px;
    height: 42px;
    padding: 0 10px;
  }

  .captcha-refresh {
    width: 36px;
    height: 42px;
  }
}
</style>
