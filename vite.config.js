import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // 默认端口，可以根据需要改
    port: 5173,
    proxy: {
      // 捕获所有以 /api 开头的请求
      '/api': {
        // 后端服务的真实地址
        target: 'http://localhost:8000',

        // 关键参数：设置为 true 时，代理服务会把 Origin 请求头修改为 target 的地址
        // 这就是解决跨域的核心
        changeOrigin: true,

        // 路径重写（可选）：
        // 如果你的后端接口就是 /api/v2/corp，那么不需要 rewrite。
        // 如果你的后端接口是 /v2/corp (没有 /api 前缀)，则需要取消下面这行的注释：
        // rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
