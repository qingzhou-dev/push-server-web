<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  CaretBottom,
  Expand,
  Fold,
  Search,
} from '@element-plus/icons-vue'

import { navigation } from '@/config/navigation'
import { useAppStore } from '@/stores/app'
import { fetchMe, logout } from '@/api/me'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const userName = ref('管理员')
const userInitial = computed(() => userName.value.trim().charAt(0) || '管')

const activeMenu = computed(() => {
  return (route.meta.activeMenu as string | undefined) ?? route.path
})

const breadcrumbs = computed(() => {
  const items: string[] = []
  if (route.meta.group) {
    items.push(String(route.meta.group))
  }
  if (route.meta.title) {
    items.push(String(route.meta.title))
  }
  return items
})

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const loadProfile = async () => {
  try {
    const profile = await fetchMe()
    if (profile?.account) {
      userName.value = profile.account
    }
  } catch (error) {
    // Keep fallback name when session is not ready.
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }

  try {
    await logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  } catch (error) {
    ElMessage.error('退出失败，请稍后重试')
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <el-container class="app-shell">
    <el-aside
      class="app-aside"
      :width="appStore.sidebarCollapsed ? '76px' : '240px'"
    >
      <div class="app-logo">
        <span class="logo-mark">PS</span>
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">
          Push Server
        </span>
      </div>

      <el-menu
        class="app-menu"
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        router
      >
        <template v-for="item in navigation" :key="item.path">
          <el-sub-menu v-if="item.children?.length" :index="item.path">
            <template #title>
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon v-if="child.icon">
                <component :is="child.icon" />
              </el-icon>
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>

      <div v-if="!appStore.sidebarCollapsed" class="aside-footer">
        <div class="aside-meta">
          <p class="meta-title">在线节点</p>
          <p class="meta-value">128</p>
        </div>
        <div class="aside-meta">
          <p class="meta-title">消息积压</p>
          <p class="meta-value warning">24</p>
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-button
            class="icon-button"
            :icon="appStore.sidebarCollapsed ? Expand : Fold"
            circle
            @click="toggleSidebar"
          />
          <div class="header-breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item
                v-for="item in breadcrumbs"
                :key="item"
              >
                {{ item }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="header-right">
          <el-input
            class="header-search"
            placeholder="搜索任务、消息、用户"
            clearable
          >
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>

          <el-badge :value="3" class="header-badge">
            <el-button class="icon-button" :icon="Bell" circle />
          </el-badge>

          <el-dropdown>
            <div class="user-entry">
              <el-avatar size="small">{{ userInitial }}</el-avatar>
              <span class="user-name">{{ userName }}</span>
              <el-icon>
                <CaretBottom />
              </el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item>偏好设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="app-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>
