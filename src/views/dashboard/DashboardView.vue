<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Connection,
  Cpu,
  DataAnalysis,
  TrendCharts,
} from '@element-plus/icons-vue'

const kpis = [
  {
    label: '今日推送',
    value: '12,480',
    trend: '+8.2%',
    direction: 'up',
    note: '较昨日',
  },
  {
    label: '活跃通道',
    value: '36',
    trend: '+3',
    direction: 'up',
    note: '过去 7 天',
  },
  {
    label: '失败率',
    value: '0.84%',
    trend: '-0.12%',
    direction: 'down',
    note: '稳定下降',
  },
  {
    label: '队列积压',
    value: '248',
    trend: '+18',
    direction: 'up',
    note: '当前峰值',
  },
] as const

const services = [
  {
    name: '消息投递',
    desc: '推送链路与投递队列',
    status: '运行中',
    tag: 'success',
    icon: Connection,
  },
  {
    name: '限流策略',
    desc: '峰值与黑名单控制',
    status: '可用',
    tag: 'success',
    icon: Cpu,
  },
  {
    name: '数据分析',
    desc: '报表聚合与归档',
    status: '校验中',
    tag: 'warning',
    icon: DataAnalysis,
  },
] as const

const activities = [
  { time: '09:12', content: '完成今日高优先级模板同步' },
  { time: '10:05', content: '华东节点触发自动扩容策略' },
  { time: '11:18', content: '新建短信通道并通过验证' },
  { time: '12:40', content: '运营报表导出任务完成' },
] as const
</script>

<template>
  <section class="page dashboard-page">
    <div class="page-heading">
      <div>
        <h1>运营总览</h1>
        <p>核心指标、流量走势与系统健康状态</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" :icon="Bell">创建推送</el-button>
        <el-button :icon="TrendCharts">导出报表</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="kpi-grid">
      <el-col
        v-for="kpi in kpis"
        :key="kpi.label"
        :xs="24"
        :sm="12"
        :lg="6"
      >
        <el-card class="kpi-card">
          <div class="kpi-title">{{ kpi.label }}</div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-meta">
            <el-tag
              size="small"
              :type="kpi.direction === 'up' ? 'success' : 'danger'"
              effect="light"
            >
              <el-icon>
                <component :is="kpi.direction === 'up' ? ArrowUp : ArrowDown" />
              </el-icon>
              {{ kpi.trend }}
            </el-tag>
            <span class="kpi-note">{{ kpi.note }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :lg="16">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>实时流量</h3>
                <p>近 24 小时推送趋势</p>
              </div>
              <el-button text>查看详情</el-button>
            </div>
          </template>
          <div class="chart-placeholder">
            <div class="chart-grid"></div>
            <div class="chart-line"></div>
            <div class="chart-hint">图表接入后将展示实时曲线</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>服务健康</h3>
                <p>核心模块运行状态</p>
              </div>
              <el-tag type="success" effect="light">正常</el-tag>
            </div>
          </template>
          <div class="service-list">
            <div v-for="service in services" :key="service.name" class="service-item">
              <div class="service-meta">
                <el-icon>
                  <component :is="service.icon" />
                </el-icon>
                <div>
                  <div class="service-name">{{ service.name }}</div>
                  <div class="service-desc">{{ service.desc }}</div>
                </div>
              </div>
              <el-tag :type="service.tag" effect="plain" size="small">
                {{ service.status }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <el-card class="panel-card activity-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>最新动态</h3>
                <p>系统关键操作</p>
              </div>
            </div>
          </template>
          <div class="activity-list">
            <div
              v-for="activity in activities"
              :key="activity.time + activity.content"
              class="activity-item"
            >
              <span class="activity-time">{{ activity.time }}</span>
              <span class="activity-content">{{ activity.content }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>
