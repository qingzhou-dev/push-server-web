import type { RouteRecordRaw } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'
import AppsView from '@/views/apps/AppsView.vue'
import ApiKeysView from '@/views/apps/ApiKeysView.vue'
import MessagesView from '@/views/messages/MessagesView.vue'
import LoginView from '@/views/LoginView.vue'
import UsersView from '@/views/system/UsersView.vue'
import SettingsView from '@/views/system/SettingsView.vue'
import LogsView from '@/views/system/LogsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export const adminRoutes: RouteRecordRaw = {
  path: '/',
  component: AdminLayout,
  redirect: '/login',
  children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          title: '控制台',
          icon: 'DataBoard',
          affix: true,
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
      path: 'apps/keys',
      name: 'ApiKeys',
      component: ApiKeysView,
      meta: {
        title: 'API 密钥',
        group: '业务管理',
      },
    },
    {
      path: 'plugins',
      name: 'Plugins',
      component: () => import('@/views/plugins/PluginsView.vue'),
      meta: {
        title: '插件管理',
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
        title: '账户管理',
        group: '系统管理',
      },
    },
    {
      path: 'system/logs',
      name: 'Logs',
      component: LogsView,
      meta: {
        title: '日志审计',
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
    {
      path: 'system/proxy',
      name: 'Proxy',
      component: () => import('@/views/system/ProxyView.vue'),
      meta: {
        title: '代理配置',
        group: '系统管理',
      },
    },
  ],
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/init',
    name: 'Init',
    component: () => import('@/views/InitView.vue'),
    meta: {
      title: '系统初始化',
    },
  },
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

