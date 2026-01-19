<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import { fetchApps } from '@/api/apps'
import { fetchMessageLogs, sendMessage } from '@/api/messages'
import type {
  PortalAppResponse,
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

const createEmptyArticle = (): PortalMessageArticle => ({
  title: '',
  url: '',
  description: '',
  picUrl: '',
})

const apps = ref<PortalAppResponse[]>([])
const logs = ref<PortalMessageLogResponse[]>([])
const isLoading = ref(false)
const isSending = ref(false)

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

const formatDate = (value?: number) => {
  if (!value) {
    return '--'
  }
  return new Date(value).toLocaleString()
}

const loadApps = async () => {
  try {
    apps.value = await fetchApps()
    if (!form.appId && apps.value.length) {
      form.appId = apps.value[0].id
    }
  } catch (error) {
    ElMessage.error('获取应用列表失败')
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
              <el-select v-model="form.appId" placeholder="选择应用">
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
</style>





