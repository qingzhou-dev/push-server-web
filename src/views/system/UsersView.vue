<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchMe, registerUser } from '@/api/me'
import type { PortalUserResponse } from '@/api/types'

const profile = ref<PortalUserResponse | null>(null)
const createdUser = ref<PortalUserResponse | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)

const registerForm = reactive({
  account: '',
  password: '',
})

const formatDate = (value?: number) => {
  if (!value) {
    return '--'
  }
  return new Date(value).toLocaleString()
}

const loadProfile = async () => {
  isLoading.value = true
  try {
    profile.value = await fetchMe()
  } catch {
    ElMessage.error('获取账号信息失败')
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  const account = registerForm.account.trim()
  if (!account || !registerForm.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  isSubmitting.value = true
  try {
    createdUser.value = await registerUser({
      account,
      password: registerForm.password,
    })
    registerForm.account = ''
    registerForm.password = ''
    ElMessage.success('账号已创建')
  } catch {
    ElMessage.error('创建账号失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>账号管理</h1>
        <p>查看当前账号信息并创建新的管理员账号</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="10">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>当前账号</h3>
                <p>登录态与账号基础信息</p>
              </div>
            </div>
          </template>

          <el-skeleton v-if="isLoading" animated :rows="4" />
          <el-descriptions v-else :column="1" border>
            <el-descriptions-item label="账号">
              {{ profile?.account ?? '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="账号 ID">
              {{ profile?.id ?? '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(profile?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDate(profile?.updatedAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="14">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>创建管理员</h3>
                <p>为企业新增登录账号</p>
              </div>
            </div>
          </template>

          <el-form :model="registerForm" label-width="90px" class="stack-form">
            <el-form-item label="账号">
              <el-input
                v-model="registerForm.account"
                placeholder="输入新账号"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="registerForm.password"
                type="password"
                show-password
                placeholder="输入初始密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="isSubmitting"
                @click="handleRegister"
              >
                创建账号
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="createdUser" class="result-panel">
            <div class="result-title">新账号已创建</div>
            <div class="result-desc">
              账号：{{ createdUser.account }}，ID：{{ createdUser.id }}
            </div>
            <div class="result-meta">
              创建时间：{{ formatDate(createdUser.createdAt) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>
