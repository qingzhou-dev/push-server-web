import type { Component } from 'vue'
import {
  Bell,
  Connection,
  DataAnalysis,
  Key,
  Document,
  Setting,
  Tools,
  UserFilled,
} from '@element-plus/icons-vue'

export type NavItem = {
  title: string
  path: string
  icon?: Component
  children?: NavItem[]
}

export const navigation: NavItem[] = [
  {
    title: '控制台',
    path: '/dashboard',
    icon: DataAnalysis,
  },
  {
    title: '应用管理',
    path: '/apps',
    icon: Connection,
  },
  {
    title: 'API 密钥',
    path: '/apps/keys',
    icon: Key,
  },
  {
    title: '消息中心',
    path: '/messages',
    icon: Bell,
  },
  {
    title: '系统管理',
    path: '/system',
    icon: Setting,
    children: [
      {
        title: '账户管理',
        path: '/system/users',
        icon: UserFilled,
      },
      {
        title: '日志审计',
        path: '/system/logs',
        icon: Document,
      },
      {
        title: '企业配置',
        path: '/system/settings',
        icon: Tools,
      },
    ],
  },
]



