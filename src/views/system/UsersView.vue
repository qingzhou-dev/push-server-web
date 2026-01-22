<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchMe } from '@/api/me'
import type { PortalUserResponse } from '@/api/types'

const profile = ref<PortalUserResponse | null>(null)
const isLoading = ref(false)

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

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>账号管理</h1>
        <p>查看当前账号基础信息</p>
      </div>
    </div>

    <el-row>
      <el-col :xs="24" :lg="12">
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
    </el-row>
  </section>
</template>