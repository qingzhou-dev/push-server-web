# push-server-web

企业级推送管理后台前端，基于 Vue 3 + Vite + Element Plus。

## Features

- 登录：验证码 + Session 登录（`/api/captcha` + `/api/login`）
- 应用管理：新增、同步、删除应用
- 消息中心：发送消息、查看发送日志
- 账号管理：查看当前账号、创建管理员
- 企业配置：CorpId 配置、修改密码

## Requirements

- Node.js 18+
- Push Server API：`http://localhost:8000`

## Project Setup

```sh
npm install
```

### Development

```sh
npm run dev
```

默认 API 地址：`http://localhost:8000/api`

如需代理模式（避免跨域），可在 `.env.local` 设置：

```env
VITE_API_BASE_URL=/api
```

并在 `vite.config.js` 配置代理到 `http://localhost:8000`。

### Build

```sh
npm run build
```

## API Notes

- 认证：Session Cookie（JSESSIONID）
- 登录流程：`GET /api/captcha` 获取验证码并建立 session，`POST /api/login` 使用 JSON 体
- 跨域调用：需要 `withCredentials: true`
- CSRF：调用 `/api/v2/**` 写操作前先 `GET /api/v2/auth/csrf`，随后携带 `X-XSRF-TOKEN`

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur).
