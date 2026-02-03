<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, QuestionFilled } from '@element-plus/icons-vue'
import { deleteAppPlugin, fetchAppPlugins, updateAppPlugin } from '@/api/apps'
import type { AppPluginResponse, PluginConfigField } from '@/api/types'

const props = defineProps<{
  appId: number
  appName: string
  visible: boolean
}>()

const emit = defineEmits(['update:visible'])

const plugins = ref<AppPluginResponse[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const configDialogVisible = ref(false)
const currentPlugin = ref<AppPluginResponse | null>(null)
const configForm = ref<Record<string, any>>({})

const loadPlugins = async () => {
  if (!props.appId || !props.visible) return
  isLoading.value = true
  try {
    plugins.value = await fetchAppPlugins(props.appId)
  } catch {
    // Error handled by interceptor
  } finally {
    isLoading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    loadPlugins()
  } else {
    plugins.value = []
  }
}, { immediate: true })

const handleClose = () => {
  emit('update:visible', false)
}

const openConfig = (plugin: AppPluginResponse) => {
  currentPlugin.value = plugin
  try {
    configForm.value = plugin.configJson ? JSON.parse(plugin.configJson) : {}
  } catch (e) {
    configForm.value = {}
  }
  
  // Initialize with default values if empty
  if (plugin.meta?.configFields) {
    plugin.meta.configFields.forEach((field: PluginConfigField) => {
      if (configForm.value[field.name] === undefined && field.defaultValue !== undefined) {
        let val = field.defaultValue
        if (field.type === 'BOOLEAN') {
          val = field.defaultValue === 'true' || field.defaultValue === true
        } else if (field.type === 'NUMBER') {
          val = Number(field.defaultValue)
        }
        configForm.value[field.name] = val
      }
    })
  }
  
  configDialogVisible.value = true
}

const handleStatusChange = async (plugin: AppPluginResponse) => {
  try {
    await updateAppPlugin(props.appId, {
      pluginKey: plugin.pluginKey,
      configJson: plugin.configJson || '{}',
      status: plugin.status
    })
    ElMessage.success(`${plugin.name} 已${plugin.status === 1 ? '启用' : '禁用'}`)
  } catch {
    // Revert status on failure
    plugin.status = plugin.status === 1 ? 0 : 1
  }
}

const saveConfig = async () => {
  if (!currentPlugin.value) return
  
  isSubmitting.value = true
  try {
    const configJson = JSON.stringify(configForm.value)
    await updateAppPlugin(props.appId, {
      pluginKey: currentPlugin.value.pluginKey,
      configJson,
      status: currentPlugin.value.status
    })
    ElMessage.success('配置已保存')
    configDialogVisible.value = false
    loadPlugins()
  } catch {
    // Error handled by interceptor
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (plugin: AppPluginResponse) => {
  try {
    await deleteAppPlugin(props.appId, plugin.pluginKey)
    ElMessage.success('已解除绑定')
    loadPlugins()
  } catch {
    // Error handled by interceptor
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`应用插件管理 - ${appName}`"
    width="800px"
    @update:model-value="handleClose"
  >
    <el-table v-loading="isLoading" :data="plugins" style="width: 100%">
      <el-table-column label="插件名称" prop="name" min-width="120" />
      <el-table-column label="说明" prop="description" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button
            size="small"
            text
            :icon="Setting"
            @click="openConfig(scope.row)"
          >
            配置
          </el-button>
          <el-button
            size="small"
            text
            type="danger"
            @click="handleDelete(scope.row)"
          >
            卸载
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="configDialogVisible"
      :title="`配置插件 - ${currentPlugin?.name}`"
      width="550px"
      append-to-body
    >
      <el-form v-if="currentPlugin" :model="configForm" label-width="140px">
        <template v-if="currentPlugin.meta?.configFields?.length">
          <el-form-item
            v-for="field in currentPlugin.meta.configFields"
            :key="field.name"
            :rules="field.required ? [{ required: true, message: `${field.label}不能为空`, trigger: 'blur' }] : []"
          >
            <template #label>
              <span>{{ field.label }}</span>
              <el-tooltip v-if="field.description" :content="field.description" placement="top">
                <el-icon class="field-info-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>

            <el-input
              v-if="field.type === 'TEXT'"
              v-model="configForm[field.name]"
              :placeholder="field.defaultValue || ''"
            />
            <el-input
              v-else-if="field.type === 'PASSWORD'"
              v-model="configForm[field.name]"
              show-password
            />
            <el-input
              v-else-if="field.type === 'TEXTAREA'"
              v-model="configForm[field.name]"
              type="textarea"
              :rows="3"
            />
            <el-input-number
              v-else-if="field.type === 'NUMBER'"
              v-model="configForm[field.name]"
              style="width: 100%"
            />
            <el-switch
              v-else-if="field.type === 'BOOLEAN'"
              v-model="configForm[field.name]"
            />
            <el-select
              v-else-if="field.type === 'SELECT'"
              v-model="configForm[field.name]"
              style="width: 100%"
            >
              <el-option
                v-for="opt in field.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              >
                <div class="select-option-item">
                  <span>{{ opt.label }}</span>
                  <small v-if="opt.description" class="option-desc">{{ opt.description }}</small>
                </div>
              </el-option>
            </el-select>
            <!-- Fallback for unknown types -->
            <el-input
              v-else
              v-model="configForm[field.name]"
              :placeholder="`暂不支持的类型: ${field.type}`"
            />
          </el-form-item>
        </template>
        <el-empty v-else description="该插件无需配置" />
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="saveConfig">
          保存
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.field-info-icon {
  margin-left: 4px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: help;
  vertical-align: middle;
}

.select-option-item {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
  padding: 4px 0;
}

.option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
