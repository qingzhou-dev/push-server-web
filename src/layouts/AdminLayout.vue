<script setup lang="ts">
import { computed, onMounted, h } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Expand, Fold } from '@element-plus/icons-vue'
import { ElNotification, ElButton } from 'element-plus'

import { navigation } from '@/config/navigation'
import { useAppStore } from '@/stores/app'
import { getCurrentVersion, getIgnoredVersion, ignoreVersion } from '@/api/system'
import { compareVersions } from '@/utils/version'

const appStore = useAppStore()
const route = useRoute()

const activeMenu = computed(
  () => (route.meta.activeMenu as string | undefined) ?? route.path,
)

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

const checkVersion = async () => {
  try {
    // 1. 从 GitHub 获取最新版本
    const githubRes = await fetch('https://api.github.com/repos/qingzhou-dev/push-server/releases/latest')
    if (!githubRes.ok) return
    const githubData = await githubRes.json()
    const latestVersion = githubData.tag_name

    // 2. 从后端获取当前版本
    const currentRes = await getCurrentVersion()
    const currentVersion = currentRes.data.version

    // 3. 从后端获取已忽略的版本
    const ignoreRes = await getIgnoredVersion()
    const ignoredVersion = ignoreRes.data.version

    // 4. 比对版本
    // 如果 最新版本 > 当前版本 且 最新版本 != 已忽略版本
    if (compareVersions(latestVersion, currentVersion) > 0 && latestVersion !== ignoredVersion) {
      const notification = ElNotification({
        title: '发现新版本',
        message: h('div', [
          h('p', { style: 'margin-bottom: 8px' }, `检测到新后端版本 ${latestVersion} (当前: ${currentVersion})`),
          h('div', { style: 'display: flex; gap: 8px; justify-content: flex-end' }, [
            h(ElButton, {
              size: 'small',
              onClick: async () => {
                try {
                  await ignoreVersion(latestVersion)
                  notification.close()
                } catch (e) {
                  console.error('Failed to ignore version', e)
                }
              }
            }, () => '忽略此版本'),
            h(ElButton, {
              type: 'primary',
              size: 'small',
              onClick: () => {
                window.open(githubData.html_url, '_blank')
                notification.close()
              }
            }, () => '前往更新')
          ])
        ]),
        type: 'info',
        duration: 0, // 手动关闭
        position: 'bottom-right',
      })
    }
  } catch (e) {
    console.error('Version check failed:', e)
  }
}

onMounted(() => {
  checkVersion()
})
</script>

<template>
  <el-container class="app-shell">
    <el-aside
      class="app-aside"
      :width="appStore.sidebarCollapsed ? '76px' : '240px'"
    >
      <div class="app-logo">
        <img src="/logo.png" alt="Logo" class="logo-image" />
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
      </el-header>

      <el-main class="app-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>
