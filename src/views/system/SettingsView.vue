<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchCorp, updateCorp } from '@/api/corp'
import { updatePassword } from '@/api/me'

const corpForm = reactive({
  corpId: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
})

const isLoading = ref(false)
const isSavingCorp = ref(false)
const isSavingPassword = ref(false)

const loadCorp = async () => {
  isLoading.value = true
  try {
    const response = await fetchCorp()
    corpForm.corpId = response.corpId ?? ''
  } catch (error) {
    ElMessage.error('获取企业配置失败')
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
  } catch (error) {
    ElMessage.error('企业配置更新失败')
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
  } catch (error) {
    ElMessage.error('密码更新失败')
  } finally {
    isSavingPassword.value = false
  }
}

onMounted(() => {
  loadCorp()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>企业配置</h1>
        <p>管理企业 CorpId 与账号安全设置</p>
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
