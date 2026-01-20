<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Expand, Fold } from '@element-plus/icons-vue'

import { navigation } from '@/config/navigation'
import { useAppStore } from '@/stores/app'

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
