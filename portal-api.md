# Portal 管理后台 API 文档

本文档介绍了 Push Server 管理后台（Portal）的核心 API 接口，供前端开发对接使用。

## 基础信息
*   **基础路径**: `/api` (假设所有接口都在 /api 下，具体看 nginx/boot 配置，Spring Boot 代码中是 `@RequestMapping("/v2/...")`，通常前端会代理 `/api` 到后端)
*   **认证方式**: 基于 Session 的 Cookie 认证（登录后自动携带 `JSESSIONID`）。
*   **通用响应格式**:
    ```json
    {
      "success": true,   // true 表示成功，false 表示失败
      "message": "成功",  // 提示信息
      "data": { ... }    // 业务数据
    }
    ```

---

## 1. 代理配置 (Proxy)
用于配置服务器访问企业微信时使用的代理，解决动态 IP 问题。

### 1.1 获取代理配置
*   **URL**: `/v2/proxy`
*   **Method**: `GET`
*   **Response**:
    ```json
    {
      "success": true,
      "message": "成功",
      "data": {
        "id": 1,
        "host": "1.2.3.4",
        "port": 8080,
        "username": "user",     // 掩码或明文
        "password": "***",      // 通常不返回或掩码
        "type": "HTTP",         // HTTP 或 SOCKS5
        "exitIp": "1.2.3.4",    // 出口IP备注
        "active": true,
        "createdAt": 1700000000000,
        "updatedAt": 1700000000000
      }
    }
    ```
    *注: 若未配置返回 data 为 null*

### 1.2 保存/更新代理配置
设置或更新代理。**如果启用 (`active: true`)，后端会尝试连接测试，测试不通过会返回 success: false 但配置会保存（需前端根据 message 提示用户）。**

*   **URL**: `/v2/proxy`
*   **Method**: `PUT`
*   **Body**:
    ```json
    {
      "host": "1.2.3.4",      // 必填
      "port": 8080,           // 必填 (1-65535)
      "username": "user",     // 选填
      "password": "pass",     // 选填
      "type": "HTTP",         // 选填，默认 HTTP，支持 SOCKS5
      "exitIp": "备注IP",      // 选填
      "active": true          // 选填，默认 true
    }
    ```
*   **Response**: 成功返回配置对象。

### 1.3 删除代理配置
*   **URL**: `/v2/proxy`
*   **Method**: `DELETE`
*   **Response**: `data` 为 `null`。

---

## 2. 企业配置 (Corp)
配置企业微信的企业 ID (CorpId)。

### 2.1 获取企业配置
*   **URL**: `/v2/corp`
*   **Method**: `GET`
*   **Response**:
    ```json
    {
      "success": true,
      "message": "成功",
      "data": {
        "corpId": "ww12345678"
      }
    }
    ```

### 2.2 更新企业配置
*   **URL**: `/v2/corp`
*   **Method**: `PUT`
*   **Body**:
    ```json
    {
      "corpId": "ww12345678" // 必填
    }
    ```

---

## 3. 应用管理 (Apps)
管理企业微信自建应用 (Agent)。

### 3.1 应用列表
*   **URL**: `/v2/apps`
*   **Method**: `GET`
*   **Response**:
    ```json
    {
      "success": true,
      "message": "成功",
      "data": [
        {
          "id": 1,
          "agentId": "1000001",
          "name": "应用名称",
          "avatarUrl": "http://...",
          "description": "...",
          "createdAt": 1700000000000
        }
      ]
    }
    ```

### 3.2 创建应用
*   **URL**: `/v2/apps`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "agentId": "1000001", // 必填
      "secret": "xxxxxx"    // 必填
    }
    ```

### 3.3 更新应用
*   **URL**: `/v2/apps/{appId}`
*   **Method**: `PUT`
*   **Body**:
    ```json
    {
      "secret": "new_secret",         // 选填
      "token": "new_token",           // 选填 (回调配置)
      "encodingAesKey": "new_key"     // 选填 (回调配置)
    }
    ```

### 3.4 同步应用详情
从企业微信服务器同步应用名称、头像等信息。
*   **URL**: `/v2/apps/{appId}/sync`
*   **Method**: `POST`

### 3.5 删除应用
*   **URL**: `/v2/apps/{appId}`
*   **Method**: `DELETE`

---

## 4. API Key 管理
为应用生成用于调用 Open API 的密钥。

### 4.1 获取 API Key 信息
*   **URL**: `/v2/apps/{appId}/api-key`
*   **Method**: `GET`
*   **Response**:
    ```json
    {
      "success": true,
      "message": "成功",
      "data": {
        "appId": 1,
        "hasKey": true,
        "apiKey": "sk_....", // 仅在创建/重置时返回明文，此处可能掩码
        "rateLimitPerMinute": 60
      }
    }
    ```

### 4.2 创建/重置 API Key
*   **URL**: `/v2/apps/{appId}/api-key` (创建) 或 `/v2/apps/{appId}/api-key/reset` (重置)
*   **Method**: `POST`
*   **Response**: 返回包含 **明文 API Key** 的信息，**请提示用户立即保存**。

### 4.3 更新限流策略
*   **URL**: `/v2/apps/{appId}/api-key`
*   **Method**: `PUT`
*   **Body**:
    ```json
    {
      "rateLimitPerMinute": 120 // 每分钟允许的请求数
    }
    ```

### 4.4 删除 API Key
*   **URL**: `/v2/apps/{appId}/api-key`
*   **Method**: `DELETE`
