import type { RouteRecordRaw } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import AppsView from '@/views/apps/AppsView.vue'
import MessagesView from '@/views/messages/MessagesView.vue'
import LoginView from '@/views/LoginView.vue'
import UsersView from '@/views/system/UsersView.vue'
import SettingsView from '@/views/system/SettingsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export const adminRoutes: RouteRecordRaw = {
  path: '/',
  component: AdminLayout,
  redirect: '/login',
  children: [
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: DashboardView,
      meta: {
        title: '运营总览',
      },
    },
    {
      path: 'apps',
      name: 'Apps',
      component: AppsView,
      meta: {
        title: '应用管理',
        group: '业务管理',
      },
    },
    {
      path: 'messages',
      name: 'Messages',
      component: MessagesView,
      meta: {
        title: '消息中心',
        group: '业务管理',
      },
    },
    {
      path: 'system/users',
      name: 'Users',
      component: UsersView,
      meta: {
        title: '账号管理',
        group: '系统管理',
      },
    },
    {
      path: 'system/settings',
      name: 'Settings',
      component: SettingsView,
      meta: {
        title: '企业配置',
        group: '系统管理',
      },
    },
  ],
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      title: '登录',
    },
  },
  adminRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: {
      title: '页面不存在',
    },
  },
]
