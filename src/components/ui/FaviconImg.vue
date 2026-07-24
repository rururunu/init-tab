<template>
  <span class="favicon-img-root" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- 加载态：轻微闪烁占位 -->
    <span
      v-if="loading"
      class="favicon-placeholder"
      :class="placeholderClass"
      :style="{ width: size + 'px', height: size + 'px', borderRadius: rounded ? '4px' : '0' }"
    />
    <!-- 成功：显示 favicon -->
    <img
      v-else-if="dataUrl"
      :src="dataUrl"
      :width="size"
      :height="size"
      :class="imgClass"
      :style="{ borderRadius: rounded ? '4px' : '0' }"
      @error="onImgError"
    />
    <!-- 失败：显示域名首字母 -->
    <span
      v-else
      class="favicon-fallback"
      :style="{
        width: size + 'px',
        height: size + 'px',
        borderRadius: rounded ? '4px' : '0',
        fontSize: Math.max(size * 0.5, 10) + 'px'
      }"
    >
      {{ fallbackLetter }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { getCachedFavicon, loadFavicon, getDomain } from '@/utils/iconCache'

const props = withDefaults(defineProps<{
  /** 完整页面 URL（从中提取域名加载 favicon） */
  url: string
  /** 图标尺寸 */
  size?: number
  /** 是否圆角 */
  rounded?: boolean
}>(), {
  size: 16,
  rounded: true,
})

const dataUrl = ref<string>('')
const loading = ref(false)
let loadId = 0

const fallbackLetter = computed(() => {
  const domain = getDomain(props.url).replace(/^www\./i, '')
  return domain ? domain.charAt(0).toUpperCase() : '?'
})

const imgClass = computed(() =>
  `favicon-img object-contain flex-shrink-0 ${props.rounded ? 'rounded-sm' : ''}`
)
const placeholderClass = computed(() =>
  `bg-gray-200 dark:bg-zinc-700 animate-pulse flex-shrink-0 ${props.rounded ? 'rounded-sm' : ''}`
)

async function doLoad() {
  const currentLoadId = ++loadId
  dataUrl.value = ''
  if (!props.url) {
    loading.value = false
    return
  }

  // 1. 同步检查内存缓存（瞬间命中）
  const cached = getCachedFavicon(props.url)
  if (cached) {
    dataUrl.value = cached
    loading.value = false
    return
  }

  // 2. 异步加载
  loading.value = true
  try {
    const result = await loadFavicon(props.url, Math.max(props.size, 32))
    if (currentLoadId !== loadId) return
    if (result) {
      dataUrl.value = result
    }
  } catch {
    // Keep dataUrl empty so the default website icon is rendered.
  } finally {
    if (currentLoadId === loadId) loading.value = false
  }
}

function onImgError() {
  dataUrl.value = ''
}

watch(() => props.url, () => {
  doLoad()
})

onMounted(() => {
  doLoad()
})
</script>

<style scoped>
.favicon-img-root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.favicon-img {
  display: block;
}

.favicon-placeholder {
  display: block;
}

.favicon-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #6b7280;
  background: rgba(0, 0, 0, 0.06);
  user-select: none;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .favicon-fallback {
    color: #a1a1aa;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
