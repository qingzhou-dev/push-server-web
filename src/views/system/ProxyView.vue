<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { deleteProxyConfig, fetchProxyConfig, saveProxyConfig, type ProxyConfig } from '@/api/proxy'

const formRef = ref<FormInstance>()
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const form = reactive<Omit<ProxyConfig, 'id' | 'createdAt' | 'updatedAt'>>({
  host: '',
  port: 8080,
  username: '',
  password: '',
  type: 'HTTP',
  exitIp: '',
  active: false,
})

// Validation rules
const rules = reactive<FormRules>({
  host: [{ required: true, message: '请输入代理服务器地址', trigger: 'blur' }],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口范围 1-65535', trigger: 'blur' },
  ],
})

const loadConfig = async () => {
  isLoading.value = true
  try {
    const data = await fetchProxyConfig()
    if (data) {
      form.host = data.host
      form.port = data.port
      form.username = data.username || ''
      form.password = data.password || ''
      form.type = data.type
      form.exitIp = data.exitIp || ''
      form.active = data.active
    } else {
      // Reset to defaults if no config exists
      form.host = ''
      form.port = 8080
      form.username = ''
      form.password = ''
      form.type = 'HTTP'
      form.exitIp = ''
      form.active = false
    }
  } catch {
    // Error handled by interceptor or api wrapper
  } finally {
    isLoading.value = false
  }
}

const handleSave = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      isSaving.value = true
      try {
        await saveProxyConfig(form)
        ElMessage.success('代理配置已保存')
        // Reload to ensure we have the latest state (though local state is updated)
        await loadConfig()
      } catch {
        // Error handled
      } finally {
        isSaving.value = false
      }
    }
  })
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除代理配置吗？删除后将直接连接互联网。',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    isDeleting.value = true
    await deleteProxyConfig()
    ElMessage.success('代理配置已删除')
    await loadConfig() // Reset form
  } catch (error) {
    if (error !== 'cancel') {
      // Error handled
    }
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <h1>代理配置</h1>
        <p>配置系统对外的 HTTP 代理服务</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="16" :xl="12">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <div>
                <h3>代理服务器设置</h3>
                <p>保存配置时会自动测试连通性</p>
              </div>
              <el-tag v-if="form.active" type="success">已启用</el-tag>
              <el-tag v-else type="info">未启用</el-tag>
            </div>
          </template>

          <el-skeleton v-if="isLoading" animated :rows="5" />
          
          <el-form
            v-else
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
            class="stack-form"
          >
            <el-form-item label="代理类型" prop="type">
              <el-radio-group v-model="form.type" disabled>
                <el-radio label="HTTP" value="HTTP">HTTP</el-radio>
                <!-- Future support for SOCKS5 etc -->
              </el-radio-group>
            </el-form-item>

            <el-form-item label="服务器地址" prop="host">
              <el-input v-model="form.host" placeholder="例如: 192.168.1.100 或 proxy.example.com" />
            </el-form-item>

            <el-form-item label="端口" prop="port">
              <el-input-number v-model="form.port" :min="1" :max="65535" />
            </el-form-item>

            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="可选" autocomplete="off" />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" show-password placeholder="可选" autocomplete="off" />
            </el-form-item>

            <el-form-item label="出口 IP 备注" prop="exitIp">
               <el-input v-model="form.exitIp" placeholder="可选，用于记录该代理的固定出口 IP" />
            </el-form-item>

            <el-form-item label="启用代理" prop="active">
              <el-switch v-model="form.active" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="isSaving" @click="handleSave(formRef)">
                保存配置
              </el-button>
              <el-button type="danger" plain :loading="isDeleting" @click="handleDelete">
                删除配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
</style>
