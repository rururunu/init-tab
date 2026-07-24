<template>
  <div class="settings-page transfer-page">
    <section class="settings-section">
      <div class="settings-section-head">
        <h3 class="settings-section-title">导出当前配置</h3>
        <p class="settings-section-desc">下载基础设置、背景与收藏壁纸、搜索引擎和快捷访问。</p>
      </div>
      <div class="settings-card transfer-tool">
        <Icon icon="fluent:arrow-download-24-regular" class="transfer-icon" />
        <div class="transfer-copy">
          <strong>保存为 JSON 文件</strong>
          <span>文件可能包含自定义壁纸数据和 Wallhaven API Key，请妥善保管。</span>
        </div>
        <button type="button" class="settings-btn settings-btn--primary" :disabled="isExporting" @click="exportSettings">
          <Icon icon="fluent:arrow-download-20-regular" />
          {{ isExporting ? '正在导出' : '导出配置' }}
        </button>
      </div>
    </section>

    <hr class="settings-divider" />

    <section class="settings-section">
      <div class="settings-section-head">
        <h3 class="settings-section-title">导入配置</h3>
        <p class="settings-section-desc">选择由 LaunchPad 导出的 JSON 文件，确认后覆盖当前四类配置。</p>
      </div>
      <input ref="fileInput" class="file-input" type="file" accept="application/json,.json" @change="selectFile" />
      <div class="settings-card transfer-tool">
        <Icon icon="fluent:arrow-upload-24-regular" class="transfer-icon" />
        <div class="transfer-copy">
          <strong>{{ selectedFileName || '尚未选择配置文件' }}</strong>
          <span v-if="summary">
            {{ summary.searchEngines }} 个搜索引擎 · {{ summary.quickLinks }} 个快捷访问 ·
            {{ summary.quickLinkGroups }} 个分组 · {{ summary.favoriteWallpapers }} 张收藏壁纸
          </span>
          <span v-else>导入前会检查文件格式和数据结构。</span>
        </div>
        <button type="button" class="settings-btn settings-btn--ghost" :disabled="isImporting" @click="fileInput?.click()">
          <Icon icon="fluent:folder-open-20-regular" />
          选择文件
        </button>
      </div>

      <div v-if="pendingConfig" class="import-confirm">
        <div class="import-warning">
          <Icon icon="fluent:warning-20-regular" />
          <span>导入会覆盖当前配置，此操作不会删除浏览器书签。</span>
        </div>
        <button type="button" class="settings-btn settings-btn--primary" :disabled="isImporting" @click="confirmImport">
          <Icon icon="fluent:checkmark-20-regular" />
          {{ isImporting ? '正在导入' : '确认导入' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useNotification } from '@/composables/useNotification'
import {
  createConfigExport,
  getConfigSummary,
  importConfig,
  parseConfigFile,
  type ConfigFile,
  type ConfigSummary,
} from '@/utils/configTransfer'

const { success, error } = useNotification()
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const pendingConfig = ref<ConfigFile | null>(null)
const summary = ref<ConfigSummary | null>(null)
const isExporting = ref(false)
const isImporting = ref(false)

const exportSettings = async () => {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const config = await createConfigExport()
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `LaunchPad-config-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    success('导出成功', '配置文件已开始下载')
  } catch (reason) {
    error('导出失败', reason instanceof Error ? reason.message : String(reason))
  } finally {
    isExporting.value = false
  }
}

const selectFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  pendingConfig.value = null
  summary.value = null
  selectedFileName.value = file?.name || ''
  if (!file) return

  try {
    const config = parseConfigFile(await file.text())
    pendingConfig.value = config
    summary.value = getConfigSummary(config)
  } catch (reason) {
    selectedFileName.value = ''
    input.value = ''
    error('无法导入', reason instanceof Error ? reason.message : String(reason))
  }
}

const confirmImport = async () => {
  if (!pendingConfig.value || isImporting.value) return
  isImporting.value = true
  try {
    await importConfig(pendingConfig.value)
    success('导入成功', '基础、背景、搜索引擎和快捷访问已恢复')
    pendingConfig.value = null
    summary.value = null
    selectedFileName.value = ''
    if (fileInput.value) fileInput.value.value = ''
  } catch (reason) {
    error('导入失败', reason instanceof Error ? reason.message : String(reason))
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.transfer-page {
  gap: 22px;
}

.transfer-tool {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transfer-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: var(--ui-accent);
}

.transfer-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: var(--ui-text);
}

.transfer-copy strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transfer-copy span {
  font-size: 11px;
  line-height: 1.45;
  color: var(--ui-text-muted);
}

.file-input {
  display: none;
}

.import-confirm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.import-warning {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #b45309;
  font-size: 11px;
  line-height: 1.4;
}

.import-warning svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .transfer-tool,
  .import-confirm {
    align-items: stretch;
    flex-direction: column;
  }

  .transfer-icon {
    display: none;
  }
}
</style>
