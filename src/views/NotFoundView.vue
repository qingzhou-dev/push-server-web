<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Warning } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}
</script>

<template>
  <section class="page not-found">
    <div class="not-found-card">
      <el-icon size="64" color="#f56c6c" style="margin-bottom: 16px">
        <Warning />
      </el-icon>
      <p class="not-found-code">404</p>
      <h1>页面未找到</h1>
      <p>请检查访问地址，或返回控制台首页。</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </section>
</template>
