/// <reference types="chrome" />
<script setup lang="ts">
import { onMounted, ref, shallowRef, computed } from 'vue'
import { Icon } from '@iconify/vue'
import Dialog from './components/ui/dialog/Dialog.vue'
import NotificationContainer from './components/ui/notification/NotificationContainer.vue'
import BackgroundSettings from '@/components/settings/BackgroundSettings.vue'
import SearchEngineSettings from '@/components/settings/SearchEngineSettings.vue'
import TutorialSettings from '@/components/settings/TutorialSettings.vue'
import BasicSettings from '@/components/settings/BasicSettings.vue'
import SearchModeView from '@/components/modes/SearchModeView.vue'
import { useWallpaper } from './composables/useWallpaper'
import { storage } from '@/utils/storage'
import { hydrateFaviconCache, refreshStaleFavicons } from '@/utils/iconCache'

const {
  wallpaperType,
  wallpaperUrl,
  backgroundColor,
  loadState,
  showMask,
  getWallpaperStyle,
  refreshSourceWallpaper,
} = useWallpaper()

const isLoading = ref(false)
const isRefreshingWallpaper = ref(false)

// 顶部图标颜色：有壁纸或暗色 → 亮白；亮色无壁纸 → 深灰
const isDark = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  isDark.value = e.matches
})
const topIconColor = computed(() => {
  if (wallpaperType.value !== 'none' || isDark.value) return '#f5f5facc'
  return '#374151cc'
})

const setup = ref({ show: false })
const setUpSelect = shallowRef([
  { key: 'basic',    icon: 'fluent-color:settings-48',        label: '基础设置', in: BasicSettings },
  { key: 'img',      icon: 'fluent-color:image-48',           label: '背景设置', in: BackgroundSettings },
  { key: 'jump',     icon: 'fluent-color:link-multiple-24',   label: '搜索引擎', in: SearchEngineSettings },
  { key: 'tutorial', icon: 'fluent-color:book-open-48',       label: '使用教程', in: TutorialSettings },
])

function onSetup() {
  setup.value.show = true
}

async function onRefreshWallpaper() {
  if (isRefreshingWallpaper.value || wallpaperType.value !== 'source') return
  isRefreshingWallpaper.value = true
  try {
    await refreshSourceWallpaper()
  } catch (e) {
    console.error('刷新壁纸失败:', e)
  } finally {
    isRefreshingWallpaper.value = false
  }
}

onMounted(async () => {
  try {
    isLoading.value = false

    // 恢复 favicon 内存缓存，供搜索栏瞬间命中
    await hydrateFaviconCache()

    // 预缓存书签，供搜索模式的 SearchBar / Alt+S 使用
    let bookmarkUrls: string[] = []
    if ((window as any).chrome?.bookmarks) {
      const all = await (window as any).chrome.bookmarks.search({})
      const valid = all.filter((b: any) => b.url)
      bookmarkUrls = valid.map((b: any) => b.url as string)
      await storage.set('cachedBookmarks', JSON.stringify(valid))
    }

    // 进入标签页：缺失或超过 7 天的收藏夹图标后台重新拉取（不阻塞首屏）
    if (bookmarkUrls.length) {
      refreshStaleFavicons(bookmarkUrls).catch(() => {})
    }

    await loadState()

    // 兼容旧壁纸存储格式
    const savedType = await storage.get('wallpaperType')
    const savedUrl  = await storage.get('wallpaperUrl')
    if (savedType && savedUrl) {
      wallpaperType.value = savedType as 'none' | 'source' | 'custom'
      if (wallpaperType.value !== 'none') {
        wallpaperUrl.value = savedUrl as string
      }
    }

    // 监听 chrome.storage 变化（设置面板写入后实时生效）
    if ((window as any).chrome?.storage?.local?.onChanged) {
      ;(window as any).chrome.storage.local.onChanged.addListener(
        (changes: Record<string, { newValue: any }>) => {
          if (changes.appConfig) loadState()
        }
      )
    }
  } catch (e) {
    console.error('App init error:', e)
  }
})
</script>

<template>
  <div class="relative min-h-screen w-full transition-all duration-300">
    <!-- 加载中遮罩 -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading"
        class="fixed inset-0 z-50 flex items-center justify-center"
        :style="wallpaperType === 'color' ? { backgroundColor } : {}"
        :class="{ 'bg-slate-100 dark:bg-zinc-900': wallpaperType === 'none' }"
      >
        <div
          v-if="wallpaperType === 'custom' || wallpaperType === 'source'"
          class="absolute inset-0 bg-cover bg-center"
          :style="{ backgroundImage: `url('${wallpaperUrl}')` }"
        >
          <div class="absolute inset-0 bg-black bg-opacity-30" />
        </div>
        <div class="text-center relative z-10">
          <div class="inline-block w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <p class="mt-2 text-white text-shadow-sm">加载中...</p>
        </div>
      </div>
    </Transition>

    <!-- 主内容 -->
    <div class="relative z-10">
      <div
        id="base"
        class="text-slate-700 dark:text-zinc-400 transition-all duration-500 ease-in-out"
        :class="{ 'has-background': wallpaperType !== 'none' }"
        :style="getWallpaperStyle()"
      >
        <!-- 壁纸遮罩 -->
        <Transition
          enter-active-class="transition-opacity duration-500 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-300 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="wallpaperType !== 'none' && showMask" id="mask" class="z-0" />
        </Transition>

        <!-- 右上角操作区 -->
        <div id="setup" class="z-[200]">
          <button
            type="button"
            class="setup-btn"
            :style="{ color: topIconColor }"
            title="设置"
            @click="onSetup"
          >
            <Icon icon="fluent:settings-24-filled" class="text-[22px]" />
          </button>
        </div>

        <!-- 壁纸源：右下角刷新 -->
        <button
          v-if="wallpaperType === 'source'"
          type="button"
          id="wallpaper-refresh"
          class="setup-btn z-[200]"
          :style="{ color: topIconColor }"
          :disabled="isRefreshingWallpaper"
          title="换一张壁纸"
          @click="onRefreshWallpaper"
        >
          <Icon
            icon="fluent:arrow-sync-24-filled"
            class="text-[22px]"
            :class="{ 'is-spinning': isRefreshingWallpaper }"
          />
        </button>

        <SearchModeView />

        <!-- 设置弹窗 -->
        <Dialog
          :show="setup.show"
          :select="setUpSelect"
          title="设置"
          @close="setup.show = false"
        />
      </div>
      <NotificationContainer />
    </div>
  </div>
</template>

<style scoped>
#base {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f4f4f5;
  transition: all 0.5s ease-in-out;
}

@media (prefers-color-scheme: dark) {
  #base {
    background-color: #18181b;
  }
}

#base.has-background {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease-in-out;
}

#mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background-color: rgba(0, 0, 0, 0.15);
  transition: background-color 0.3s ease-in-out;
}

#setup {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 200;
}

#wallpaper-refresh {
  position: fixed;
  right: 18px;
  bottom: 18px;
}

.setup-btn {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.setup-btn:hover:not(:disabled) {
  opacity: 0.7;
  transform: scale(1.08);
}

.setup-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.setup-btn:disabled {
  cursor: wait;
  opacity: 0.85;
}

.is-spinning {
  animation: wallpaper-spin 0.8s linear infinite;
}

@keyframes wallpaper-spin {
  to { transform: rotate(360deg); }
}
</style>
