<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { fetchAppApiKey, fetchApps } from '@/api/apps'
import { fetchMessageLogs, sendMessage } from '@/api/messages'
import type {
  PortalAppResponse,
  PortalAppApiKeyResponse,
  PortalMessageArticle,
  PortalMessageLogResponse,
} from '@/api/types'
import type { MessageType } from '@/api/messages'

type MessageForm = {
  appId: number
  toUser: string
  toParty: string
  toAll: boolean
  msgType: MessageType
  content: string
  title: string
  description: string
  url: string
  btnText: string
  articles: PortalMessageArticle[]
}

type SampleLanguage =
  | 'curl'
  | 'powershell'
  | 'node'
  | 'python'
  | 'java'
  | 'php'

const createEmptyArticle = (): PortalMessageArticle => ({
  title: '',
  url: '',
  description: '',
  picUrl: '',
})

const router = useRouter()
const apps = ref<PortalAppResponse[]>([])
const logs = ref<PortalMessageLogResponse[]>([])
const isLoading = ref(false)
const isSending = ref(false)
const isAppsLoading = ref(false)
const sampleAppId = ref<number | null>(null)
const sampleKeyInfo = ref<PortalAppApiKeyResponse | null>(null)
const sampleKeyLoading = ref(false)
const sampleLanguage = ref<SampleLanguage>('curl')

const form = reactive<MessageForm>({
  appId: 0,
  toUser: '',
  toParty: '',
  toAll: false,
  msgType: 'TEXT',
  content: '',
  title: '',
  description: '',
  url: '',
  btnText: '',
  articles: [createEmptyArticle()],
})

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
const openApiUrl = computed(() => `${apiBaseUrl}/v2/openapi/messages/send`)
const resolveUrlWithHost = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : ''
  if (!origin) {
    return url
  }
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
}
const resolvedApiBaseUrl = computed(() => resolveUrlWithHost(apiBaseUrl))
const resolvedOpenApiUrl = computed(() => resolveUrlWithHost(openApiUrl.value))
const sampleLanguageOptions = [
  { label: 'cURL', value: 'curl' },
  { label: 'PowerShell (Windows)', value: 'powershell' },
  { label: 'Node.js (axios)', value: 'node' },
  { label: 'Python (requests)', value: 'python' },
  { label: 'Java (HttpClient)', value: 'java' },
  { label: 'PHP (cURL)', value: 'php' },
]
const sampleApiKey = computed(() => sampleKeyInfo.value?.apiKey || '')
const hasSampleKey = computed(() => sampleKeyInfo.value?.hasKey ?? false)
const sampleRateLimit = computed(
  () => sampleKeyInfo.value?.rateLimitPerMinute ?? null,
)

const formatDate = (value?: number) => {
  if (!value) {
    return '--'
  }
  return new Date(value).toLocaleString()
}

const loadApps = async () => {
  isAppsLoading.value = true
  try {
    apps.value = await fetchApps()
    if (!form.appId && apps.value.length) {
      form.appId = apps.value[0].id
    }
    if (!sampleAppId.value && apps.value.length) {
      sampleAppId.value = apps.value[0].id
    }
  } catch (error) {
    ElMessage.error('获取应用列表失败')
  } finally {
    isAppsLoading.value = false
  }
}

const loadLogs = async () => {
  isLoading.value = true
  try {
    logs.value = await fetchMessageLogs(20)
  } catch (error) {
    ElMessage.error('获取消息日志失败')
  } finally {
    isLoading.value = false
  }
}

const loadSampleKey = async (appId: number) => {
  sampleKeyLoading.value = true
  try {
    sampleKeyInfo.value = await fetchAppApiKey(appId)
  } catch (error) {
    sampleKeyInfo.value = null
  } finally {
    sampleKeyLoading.value = false
  }
}

const resetArticles = () => {
  form.articles.splice(0, form.articles.length, createEmptyArticle())
}

const resetContentFields = () => {
  form.content = ''
  form.title = ''
  form.description = ''
  form.url = ''
  form.btnText = ''
  resetArticles()
}

const handleMsgTypeChange = () => {
  resetContentFields()
}

const addArticle = () => {
  form.articles.push(createEmptyArticle())
}

const removeArticle = (index: number) => {
  if (form.articles.length === 1) {
    form.articles.splice(index, 1, createEmptyArticle())
    return
  }
  form.articles.splice(index, 1)
}

const handleSend = async () => {
  if (!form.appId) {
    ElMessage.warning('请先选择应用')
    return
  }

  let articlesPayload: PortalMessageArticle[] | undefined

  if (form.msgType === 'TEXT' || form.msgType === 'MARKDOWN') {
    if (!form.content.trim()) {
      ElMessage.warning('请输入消息内容')
      return
    }
  }

  if (form.msgType === 'TEXT_CARD') {
    if (!form.title.trim() || !form.description.trim() || !form.url.trim()) {
      ElMessage.warning('请完善图文卡片信息')
      return
    }
  }

  if (form.msgType === 'NEWS') {
    articlesPayload = form.articles
      .map((article) => ({
        title: article.title.trim(),
        url: article.url.trim(),
        description: article.description?.trim() || undefined,
        picUrl: article.picUrl?.trim() || undefined,
      }))
      .filter(
        (article) =>
          article.title || article.url || article.description || article.picUrl,
      )

    if (!articlesPayload.length) {
      ElMessage.warning('请至少添加一条图文消息')
      return
    }

    const hasInvalidArticle = articlesPayload.some(
      (article) => !article.title || !article.url,
    )
    if (hasInvalidArticle) {
      ElMessage.warning('每条图文需要填写标题和链接')
      return
    }
  }

  isSending.value = true
  try {
    await sendMessage({
      appId: form.appId,
      toAll: form.toAll || undefined,
      toUser: form.toAll ? undefined : form.toUser.trim() || undefined,
      toParty: form.toAll ? undefined : form.toParty.trim() || undefined,
      msgType: form.msgType,
      content:
        form.msgType === 'TEXT' || form.msgType === 'MARKDOWN'
          ? form.content.trim()
          : undefined,
      title: form.msgType === 'TEXT_CARD' ? form.title.trim() : undefined,
      description:
        form.msgType === 'TEXT_CARD' ? form.description.trim() : undefined,
      url: form.msgType === 'TEXT_CARD' ? form.url.trim() : undefined,
      btnText:
        form.msgType === 'TEXT_CARD'
          ? form.btnText.trim() || undefined
          : undefined,
      articles: form.msgType === 'NEWS' ? articlesPayload : undefined,
    })
    ElMessage.success('消息已发送')
    resetContentFields()
    loadLogs()
  } catch (error) {
    ElMessage.error('消息发送失败')
  } finally {
    isSending.value = false
  }
}

const formatTargets = (row: PortalMessageLogResponse) => {
  if (row.toAll) {
    return '全员'
  }
  const targets = [row.toUser, row.toParty].filter(Boolean)
  return targets.length ? targets.join(' / ') : '--'
}

const extractNewsPreview = (row: PortalMessageLogResponse) => {
  const article = row.articles?.[0]
  return {
    title: article?.title || row.title,
    description: article?.description || row.description,
    url: article?.url || row.url,
  }
}

const formatLogContent = (row: PortalMessageLogResponse) => {
  if (row.msgType === 'NEWS') {
    const preview = extractNewsPreview(row)
    return preview.title || preview.description || preview.url || '--'
  }
  return row.content || row.title || row.description || '--'
}

const cleanPayload = (payload: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false
      }
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return true
    }),
  )

const buildSamplePayload = () => {
  const payload: Record<string, any> = {
    toAll: form.toAll,
    toUser: form.toAll ? undefined : form.toUser.trim() || 'user1|user2',
    toParty: form.toAll ? undefined : form.toParty.trim() || 'party1|party2',
    msgType: form.msgType,
  }

  if (form.msgType === 'TEXT' || form.msgType === 'MARKDOWN') {
    payload.content = form.content.trim() || '你好，这是一条示例消息'
  } else if (form.msgType === 'TEXT_CARD') {
    payload.title = form.title.trim() || '示例标题'
    payload.description =
      form.description.trim() || '这是一段图文卡片示例描述'
    payload.url = form.url.trim() || 'https://example.com'
    if (form.btnText.trim()) {
      payload.btnText = form.btnText.trim()
    }
  } else if (form.msgType === 'NEWS') {
    const articles =
      form.articles
        .map((article) => ({
          title: article.title.trim(),
          url: article.url.trim(),
          description: article.description?.trim() || undefined,
          picUrl: article.picUrl?.trim() || undefined,
        }))
        .filter((article) => article.title || article.url) || []

    payload.articles =
      articles.length > 0
        ? articles
        : [
            {
              title: '示例文章标题',
              description: '示例文章描述',
              url: 'https://example.com/news',
              picUrl: 'https://example.com/image.png',
            },
          ]
  }

  return cleanPayload(payload)
}

const samplePayload = computed(() => buildSamplePayload())
const samplePayloadJson = computed(() =>
  JSON.stringify(samplePayload.value, null, 2),
)

const sampleSnippet = computed(() => {
  const key = sampleApiKey.value || 'YOUR_API_KEY'
  const jsonBody = samplePayloadJson.value

  if (sampleLanguage.value === 'node') {
    return `import axios from 'axios'

const apiKey = '${key}'
const client = axios.create({ baseURL: '${resolvedApiBaseUrl.value}' })

async function sendMessage() {
  const payload = ${jsonBody}

  await client.post('/v2/openapi/messages/send', payload, {
    headers: { 'X-API-Key': apiKey },
  })
}

sendMessage().catch(console.error)
`
  }

  if (sampleLanguage.value === 'python') {
    return `import requests

api_key = '${key}'
url = '${resolvedOpenApiUrl.value}'

payload = ${jsonBody}

resp = requests.post(url, json=payload, headers={'X-API-Key': api_key})
print(resp.status_code, resp.text)
`
  }

  if (sampleLanguage.value === 'powershell') {
    return `$apiKey = '${key}'
$uri = '${resolvedOpenApiUrl.value}'
$body = @'
${jsonBody}
'@

Invoke-RestMethod -Method Post -Uri $uri -Headers @{ "X-API-Key" = $apiKey } -ContentType "application/json" -Body $body
`
  }

  if (sampleLanguage.value === 'java') {
    return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class SendMessage {
  public static void main(String[] args) throws Exception {
    String apiKey = "${key}";
    String json = """
${jsonBody}
""";

    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("${resolvedOpenApiUrl.value}"))
        .header("X-API-Key", apiKey)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(json))
        .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    System.out.println(response.statusCode());
    System.out.println(response.body());
  }
}
`
  }

  if (sampleLanguage.value === 'php') {
    return `<?php
$apiKey = '${key}';
$url = '${resolvedOpenApiUrl.value}';

$payloadJson = <<<'JSON'
${jsonBody}
JSON;

$payload = json_decode($payloadJson, true);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
]);

$response = curl_exec($ch);

if ($response === false) {
    throw new RuntimeException(curl_error($ch));
}

echo curl_getinfo($ch, CURLINFO_HTTP_CODE) . PHP_EOL;
echo $response;

curl_close($ch);
`
  }

  return `curl -X POST "${resolvedOpenApiUrl.value}" \\
  -H "X-API-Key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonBody.replace(/'/g, "'\\\\''")}'`
})

const copySampleKey = async () => {
  if (!sampleApiKey.value) return
  try {
    await navigator.clipboard.writeText(sampleApiKey.value)
    ElMessage.success('API Key 已复制')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const copySampleSnippet = async () => {
  try {
    await navigator.clipboard.writeText(sampleSnippet.value)
    ElMessage.success('示例已复制')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const goToApiKeys = () => {
  router.push('/apps/keys')
}

watch(sampleAppId, (appId) => {
  if (appId) {
    loadSampleKey(appId)
  } else {
    sampleKeyInfo.value = null
  }
})

watch(
  () => form.appId,
  (appId) => {
    if (!sampleAppId.value && appId) {
      sampleAppId.value = appId
    }
  },
)

onMounted(() => {
  loadApps()
  loadLogs()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>消息中心</h1>
        <p>选择应用发送企业消息，查看发送记录</p>
      </div>
      <div class="page-actions">
        <el-button :icon="RefreshRight" @click="loadLogs">刷新日志</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="10">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>消息发送</h3>
                <p>支持文本、Markdown、图文卡片和图文消息</p>
              </div>
            </div>
          </template>

          <el-form :model="form" label-width="100px" class="stack-form">
            <el-form-item label="应用">
              <el-select
                v-model="form.appId"
                placeholder="选择应用"
                :loading="isAppsLoading"
              >
                <el-option
                  v-for="app in apps"
                  :key="app.id"
                  :label="app.name || app.agentId"
                  :value="app.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="发送范围">
              <el-switch v-model="form.toAll" active-text="全员" />
            </el-form-item>
            <el-form-item label="成员">
              <el-input
                v-model="form.toUser"
                :disabled="form.toAll"
                placeholder="多个成员用 | 分隔"
              />
            </el-form-item>
            <el-form-item label="部门">
              <el-input
                v-model="form.toParty"
                :disabled="form.toAll"
                placeholder="多个部门用 | 分隔"
              />
            </el-form-item>
            <el-form-item label="消息类型">
              <el-select v-model="form.msgType" @change="handleMsgTypeChange">
                <el-option label="文本" value="TEXT" />
                <el-option label="Markdown" value="MARKDOWN" />
                <el-option label="图文卡片" value="TEXT_CARD" />
                <el-option label="图文" value="NEWS" />
              </el-select>
            </el-form-item>

            <template v-if="form.msgType === 'TEXT' || form.msgType === 'MARKDOWN'">
              <el-form-item label="内容">
                <el-input
                  v-model="form.content"
                  type="textarea"
                  rows="4"
                  placeholder="请输入消息内容"
                />
              </el-form-item>
            </template>

            <template v-else-if="form.msgType === 'TEXT_CARD'">
              <el-form-item label="标题">
                <el-input v-model="form.title" placeholder="请输入卡片标题" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  rows="3"
                  placeholder="请输入卡片描述"
                />
              </el-form-item>
              <el-form-item label="链接">
                <el-input v-model="form.url" placeholder="请输入跳转链接" />
              </el-form-item>
              <el-form-item label="按钮文案">
                <el-input v-model="form.btnText" placeholder="可选" />
              </el-form-item>
            </template>

            <template v-else>
              <div
                v-for="(article, index) in form.articles"
                :key="index"
                class="news-article"
              >
                <div class="news-article__header">
                  <span>图文 {{ index + 1 }}</span>
                  <el-button
                    v-if="form.articles.length > 1"
                    type="danger"
                    text
                    @click="removeArticle(index)"
                  >
                    删除
                  </el-button>
                </div>
                <el-form-item label="标题">
                  <el-input v-model="article.title" placeholder="请输入文章标题" />
                </el-form-item>
                <el-form-item label="链接">
                  <el-input v-model="article.url" placeholder="请输入跳转链接" />
                </el-form-item>
                <el-form-item label="描述">
                  <el-input
                    v-model="article.description"
                    type="textarea"
                    rows="3"
                    placeholder="可选，简要介绍"
                  />
                </el-form-item>
                <el-form-item label="封面">
                  <el-input v-model="article.picUrl" placeholder="可选，图片地址" />
                </el-form-item>
              </div>

              <el-form-item>
                <el-button type="primary" text @click="addArticle">
                  新增文章
                </el-button>
              </el-form-item>
            </template>

            <el-form-item>
              <el-button
                type="primary"
                :loading="isSending"
                @click="handleSend"
              >
                发送消息
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="14">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>OpenAPI 示例</h3>
                <p>基于所选应用的 API Key 生成多语言调用样例</p>
              </div>
              <el-button
                text
                :icon="RefreshRight"
                :disabled="!sampleAppId"
                :loading="sampleKeyLoading"
                @click="sampleAppId && loadSampleKey(sampleAppId)"
              >
                刷新 Key
              </el-button>
            </div>
          </template>

          <el-form label-width="90px" class="stack-form">
            <el-form-item label="应用">
              <el-select
                v-model="sampleAppId"
                placeholder="选择应用"
                :loading="isAppsLoading"
              >
                <el-option
                  v-for="app in apps"
                  :key="app.id"
                  :label="app.name || app.agentId"
                  :value="app.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="API Key">
              <el-input
                :model-value="sampleApiKey"
                placeholder="未生成"
                readonly
              >
                <template #append>
                  <el-button
                    text
                    :disabled="!sampleApiKey"
                    @click="copySampleKey"
                  >
                    复制
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>

          <el-alert
            v-if="sampleAppId && !hasSampleKey && !sampleKeyLoading"
            title="当前应用尚未生成 API Key"
            type="warning"
            show-icon
            class="mb-12"
          >
            <template #description>
              前往 API 密钥页面生成后，即可使用 OpenAPI 发送消息。
              <el-button type="primary" link @click="goToApiKeys">
                去生成
              </el-button>
            </template>
          </el-alert>

          <div class="sample-meta">
            <div>接口：{{ resolvedOpenApiUrl }}</div>
            <div>
              限流：{{ sampleRateLimit === null ? '不限' : sampleRateLimit + ' 次/分钟' }}
            </div>
          </div>

          <div class="sample-actions">
            <el-radio-group v-model="sampleLanguage" size="small">
              <el-radio-button
                v-for="lang in sampleLanguageOptions"
                :key="lang.value"
                :label="lang.value"
              >
                {{ lang.label }}
              </el-radio-button>
            </el-radio-group>

            <div class="sample-actions__right">
              <el-button text type="primary" @click="copySampleSnippet">
                复制示例
              </el-button>
            </div>
          </div>

          <pre class="code-block">{{ sampleSnippet }}</pre>
        </el-card>

        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>发送日志</h3>
                <p>最近 20 条消息记录</p>
              </div>
            </div>
          </template>

          <el-table v-loading="isLoading" :data="logs" style="width: 100%">
            <el-table-column label="应用" min-width="120">
              <template #default="scope">
                <div class="log-app">
                  <span class="log-title">{{ scope.row.agentId }}</span>
                  <span class="log-sub">{{ scope.row.appId }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="msgType" label="类型" min-width="100" />
            <el-table-column label="对象" min-width="160">
              <template #default="scope">
                {{ formatTargets(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column label="内容" min-width="240">
              <template #default="{ row }">
                <template v-if="row.msgType === 'NEWS'">
                  <div class="log-title">
                    {{ extractNewsPreview(row).title || '--' }}
                  </div>
                  <div v-if="extractNewsPreview(row).description" class="log-sub">
                    {{ extractNewsPreview(row).description }}
                  </div>
                  <el-link
                    v-if="extractNewsPreview(row).url"
                    :href="extractNewsPreview(row).url"
                    target="_blank"
                    type="primary"
                  >
                    {{ extractNewsPreview(row).url }}
                  </el-link>
                </template>
                <span v-else>
                  {{ formatLogContent(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="110">
              <template #default="scope">
                <el-tag :type="scope.row.success ? 'success' : 'danger'">
                  {{ scope.row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" min-width="160">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!logs.length && !isLoading" description="暂无日志" />
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.news-article {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.news-article__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
}

.sample-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #606266;
  font-size: 12px;
}

.sample-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sample-actions__right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.code-block {
  background: #0f172a;
  color: #e5e7eb;
  padding: 12px;
  border-radius: 8px;
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

.mb-12 {
  margin-bottom: 12px;
}
</style>








