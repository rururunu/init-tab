<template>
  <div class="search-bar-root">
    <div class="search-bar-inner">
      <!-- 搜索框（引擎图标内嵌在 pill 左侧） -->
      <VanishingInput
        v-model="ide"
        :placeholders="placeholderArray"
        @submit="submit"
        @escape="handleEscapeKey"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
        ref="vanishingInputRef"
      >
        <template #left-icon>
          <button type="button" class="engine-icon-btn" @click.stop="showEnginePicker = !showEnginePicker">
            <img
              :src="getEngineFavicon(currentEngine?.jumpUrl ?? '')"
              class="w-5 h-5 rounded-sm object-contain"
              @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
            />
          </button>
        </template>
      </VanishingInput>

      <!-- 悬浮下拉区域（不占据布局空间） -->
      <div class="dropdowns">

        <!-- 引擎选择器（图标按钮触发） -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-[-6px]"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-[-6px]"
        >
          <div
            v-if="showEnginePicker"
            class="dropdown-panel"
            @click.stop
          >
            <div class="dropdown-header">选择搜索引擎</div>
            <div class="dropdown-body">
              <div
                v-for="engine in jumpData"
                :key="engine.key[0]"
                class="dropdown-item"
                :class="{ 'dropdown-item--active': engine.key.includes(defaultKey) }"
                @click="switchEngine(engine)"
              >
                <div class="engine-item-left">
                  <img
                    :src="getEngineFavicon(engine.jumpUrl)"
                    class="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                    @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
                  />
                  <span class="dropdown-item-label">{{ engine.label }}</span>
                </div>
                <Icon
                  v-if="engine.key.includes(defaultKey)"
                  icon="material-symbols:check-rounded"
                  class="text-blue-500 text-base flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </Transition>

        <!-- 搜索建议 -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-[-6px]"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-[-6px]"
        >
          <SearchSuggestions
            v-if="showSearchSuggestions"
            :query="currentSearchQuery"
            :engine-type="currentEngineType"
            :visible="showSearchSuggestions"
            @select="handleSuggestionSelect"
            @fill="handleSuggestionFill"
            @close="showSearchSuggestions = false"
          />
        </Transition>

        <!-- 搜索引擎选择器（cd 命令） -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-[-6px]"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-[-6px]"
        >
          <div
            v-if="showEngineSelector"
            class="dropdown-panel"
          >
            <div class="dropdown-header">切换搜索引擎</div>
            <div class="dropdown-body">
              <div
                v-for="engine in jumpData"
                :key="engine.key[0]"
                @click="selectEngine(engine.key[0])"
                class="dropdown-item"
              >
                <div class="engine-item-left">
                  <img
                    :src="getEngineFavicon(engine.jumpUrl)"
                    class="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                    @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
                  />
                  <span class="dropdown-item-label">{{ engine.label }}</span>
                </div>
                <span class="dropdown-item-key">{{ engine.key.join(' / ') }}</span>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 收藏夹搜索结果（* 前缀） -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-[-6px]"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-[-6px]"
        >
          <div v-if="showBookmarkResults" class="dropdown-panel bookmark-results">
            <div class="dropdown-header">收藏夹结果</div>
            <div class="dropdown-body dropdown-body--scroll">
              <div
                v-for="(bookmark, index) in bookmarkResults.slice(0, 5)"
                :key="index"
                @click="openBookmark(bookmark.url)"
                class="dropdown-item"
                :class="{ 'dropdown-item--active': index === selectedBookmarkIndex }"
              >
                <img
                  :src="getEngineFavicon(bookmark.url)"
                  class="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                  @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
                />
                <div class="bookmark-info">
                  <div class="bookmark-title">{{ bookmark.title }}</div>
                  <div class="bookmark-url">{{ bookmark.url }}</div>
                </div>
                <span v-if="index === selectedBookmarkIndex" class="bookmark-enter">Enter</span>
              </div>
              <div v-if="bookmarkResults.length === 0" class="dropdown-empty">未找到匹配的收藏夹</div>
              <div v-if="bookmarkResults.length > 5" class="dropdown-more">
                另有 {{ bookmarkResults.length - 5 }} 条结果
              </div>
            </div>
          </div>
        </Transition>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

defineEmits<{ focus: []; blur: [] }>()
import { Icon } from '@iconify/vue'
import VanishingInput from '@/components/ui/vanishing-input/VanishingInput.vue'
import SearchSuggestions from '@/components/ui/search-suggestions/SearchSuggestions.vue'
import { storage } from '@/utils/storage'

type JumpData = { key: string[]; label: string; jumpUrl: string }

const placeholderArray = [
  'Hello!!🖐️',
  '尝试输入bd[空格]或gg[空格]和bi[空格]加上你的搜索内容吧😎',
  '输入cd[空格]加上搜索引擎的key,可以切换默认搜索引擎哦😋',
  '输入*后携带收藏标签的标题可以快速找到收藏页🌟',
]

const defaultJumpData: JumpData[] = [
  { key: ['bd', 'baidu'], label: 'BaiDu百度', jumpUrl: 'https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>' },
  { key: ['gg', 'google'], label: 'Google谷歌', jumpUrl: 'https://www.google.com/search?q=&<query>' },
  { key: ['bi', 'bing'], label: 'Bing必应', jumpUrl: 'https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN' },
]

const ide = ref('')
const jumpData = ref<JumpData[]>([])
const defaultKey = ref('bd')
const jumpToData = ref<Map<string, JumpData>>(new Map())
const vanishingInputRef = ref(null)

const showEnginePicker = ref(false)
const showEngineSelector = ref(false)
const showSearchSuggestions = ref(false)
const showBookmarkResults = ref(false)
const bookmarkResults = ref<any[]>([])
const selectedBookmarkIndex = ref(-1)
const currentEngineType = ref('bd')
const currentSearchQuery = ref('')
const suggestionsFullyClosed = ref(true)
const isKeyboardFill = ref(false)
const isSearchFocused = ref(false)

watch(isSearchFocused, (v) => {
  if (v && ide.value) showSearchSuggestions.value = true
  else if (!v) showSearchSuggestions.value = false
})

watch(showSearchSuggestions, (v) => {
  if (!v) setTimeout(() => { suggestionsFullyClosed.value = true }, 50)
  else suggestionsFullyClosed.value = false
})

watch(ide, (newValue) => {
  if (isKeyboardFill.value) { isKeyboardFill.value = false; return }
  const value = newValue?.trim()

  if (value.startsWith('cd')) {
    showEngineSelector.value = true
    showSearchSuggestions.value = false
    const engineKey = value.split(' ')[1]
    if (!engineKey) { /* 等待输入引擎key */ }
  } else {
    showEngineSelector.value = false
    if (value.startsWith('*')) {
      const q = value.slice(1).trim()
      if (q) { searchBookmarks(q); showBookmarkResults.value = true }
      else { showBookmarkResults.value = false }
    } else if (value) {
      const parts = value.split(' ')
      const engineKey = parts[0]
      let matchedEngine = false
      for (const [_, engine] of jumpToData.value) {
        if (engine.key.includes(engineKey)) { currentEngineType.value = engineKey; matchedEngine = true; break }
      }
      if (matchedEngine && parts.length > 1) {
        currentSearchQuery.value = parts.slice(1).join(' ')
        showSearchSuggestions.value = true
      } else if (!matchedEngine) {
        currentEngineType.value = defaultKey.value
        currentSearchQuery.value = value.startsWith('/') ? value.slice(1) : value
        showSearchSuggestions.value = true
      } else {
        currentSearchQuery.value = ''
      }
    }
  }

  if (!value) {
    showSearchSuggestions.value = false
    showEngineSelector.value = false
    showBookmarkResults.value = false
    currentSearchQuery.value = ''
  }
})

const loadEngines = async () => {
  try {
    const saved = await storage.get('jumpData')
    let parsed: any = saved
    if (typeof saved === 'string') {
      try { parsed = JSON.parse(saved) } catch {}
    }
    jumpData.value = (parsed && Array.isArray(parsed)) ? parsed : [...defaultJumpData]
  } catch {
    jumpData.value = [...defaultJumpData]
  }
}

const init = async () => {
  try {
    const savedKey = await storage.get('defaultKey')
    const savedJump = await storage.get('jumpData')
    defaultKey.value = (savedKey || 'bd') as string
    
    let parsed: any = savedJump
    if (typeof savedJump === 'string') {
      try { parsed = JSON.parse(savedJump) } catch {}
    }
    jumpData.value = (parsed && Array.isArray(parsed)) ? parsed : [...defaultJumpData]
    
    jumpToData.value = new Map()
    jumpData.value.forEach(d => d.key.forEach(k => {
      if (k) jumpToData.value.set(k, d)
    }))

    if (!jumpToData.value.has(defaultKey.value) && jumpData.value.length > 0 && jumpData.value[0].key.length > 0) {
      defaultKey.value = jumpData.value[0].key[0]
      await storage.set('defaultKey', defaultKey.value)
    }
  } catch (e) {
    console.error('SearchBar init error:', e)
  }
}

function segmentationContent(medium: string, content: string): string[] {
  const [first, ...rest] = content.split(medium)
  return [first, rest.join(' ')]
}

async function jumpTo(jumpType: string, toData: string) {
  if (!jumpType) jumpType = defaultKey.value
  if (jumpType === 'cd') {
    if (jumpToData.value.has(toData)) {
      defaultKey.value = toData
      await storage.set('defaultKey', toData)
    }
    return
  }
  const engine = jumpToData.value.get(jumpType)
  if (engine) {
    window.open(engine.jumpUrl.replace('&<query>', toData), '_blank', 'noopener,noreferrer')
  } else {
    const def = jumpToData.value.get(defaultKey.value) || jumpData.value[0]
    if (def) window.open(def.jumpUrl.replace('&<query>', jumpType + (toData ? ' ' + toData : '')), '_blank', 'noopener,noreferrer')
  }
}

function submit(content: string) {
  if (content.startsWith('*')) return
  if (content.startsWith('/')) { jumpTo(defaultKey.value, content.slice(1)); return }
  if (content.includes(' ')) { const [a, b] = segmentationContent(' ', content); jumpTo(a, b) }
  else jumpTo(defaultKey.value, content)
  showSearchSuggestions.value = false
  currentSearchQuery.value = ''
}

function handleSuggestionSelect(suggestion: string) {
  if (currentEngineType.value === defaultKey.value) ide.value = suggestion
  else ide.value = `${currentEngineType.value} ${suggestion}`
  submit(ide.value)
}

function handleSuggestionFill(data: { suggestion: string; isFillAction: boolean; isKeyboardFill?: boolean }) {
  if (currentEngineType.value === defaultKey.value) ide.value = data.suggestion
  else ide.value = `${currentEngineType.value} ${data.suggestion}`
  if (data.isKeyboardFill) isKeyboardFill.value = true
  setTimeout(() => (vanishingInputRef.value as any)?.focus?.(), 10)
}

function handleEscapeKey() {
  showSearchSuggestions.value = false
  showEngineSelector.value = false
  showBookmarkResults.value = false
}

function selectEngine(key: string) {
  if (jumpToData.value.has(key)) { ide.value = `cd ${key}`; showEngineSelector.value = false }
}

const currentEngine = computed(() =>
  jumpToData.value.get(defaultKey.value) ?? jumpData.value[0]
)
const currentEngineName = computed(() => {
  const label = currentEngine.value?.label ?? '搜索'
  const chinese = label.match(/[\u4e00-\u9fa5]+/)
  return chinese ? chinese[0] : label.split(' ')[0]
})

function getEngineFavicon(jumpUrl: string): string {
  try { return new URL(jumpUrl).origin + '/favicon.ico' } catch { return '' }
}

async function switchEngine(engine: JumpData) {
  defaultKey.value = engine.key[0]
  await storage.set('defaultKey', engine.key[0])
  showEnginePicker.value = false
}

function onPickerOutsideClick() {
  showEnginePicker.value = false
}

watch(showEnginePicker, (open) => {
  if (open) nextTick(() => window.addEventListener('click', onPickerOutsideClick))
  else window.removeEventListener('click', onPickerOutsideClick)
})

async function searchBookmarks(query: string) {
  try {
    const w = window as any
    if (w.chrome?.bookmarks) {
      const results = await w.chrome.bookmarks.search(query)
      bookmarkResults.value = results.filter((b: any) => b.url)
    }
  } catch { bookmarkResults.value = [] }
}

function openBookmark(url: string | undefined) {
  if (url) { window.open(url, '_blank', 'noopener,noreferrer'); showBookmarkResults.value = false }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!showBookmarkResults.value) return
  const max = Math.min(bookmarkResults.value.length - 1, 4)
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedBookmarkIndex.value = selectedBookmarkIndex.value <= 0 ? max : selectedBookmarkIndex.value - 1
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedBookmarkIndex.value = selectedBookmarkIndex.value >= max ? 0 : selectedBookmarkIndex.value + 1
  } else if (e.key === 'Enter' && selectedBookmarkIndex.value >= 0) {
    e.preventDefault()
    openBookmark(bookmarkResults.value[selectedBookmarkIndex.value]?.url)
  }
}

onMounted(async () => {
  await Promise.all([loadEngines(), init()])
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('click', onPickerOutsideClick)
})
</script>

<style scoped>
.search-bar-root {
  width: 100%;
}

.search-bar-inner {
  position: relative;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.engine-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0.85;
  transition: opacity 0.15s, transform 0.15s;
}

.engine-icon-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.engine-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

/* 悬浮容器：absolute，不占布局高度 */
.dropdowns {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 通用下拉面板 */
.dropdown-panel {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.dropdown-header {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
}

.dropdown-body {
  padding: 6px;
}

.dropdown-body--scroll {
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
  gap: 12px;
}

.dropdown-item:hover,
.dropdown-item--active {
  background: rgba(59, 130, 246, 0.08);
}

.dropdown-item-label {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.dropdown-item-key {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-url {
  font-size: 11px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 1px;
}

.bookmark-enter {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 500;
  flex-shrink: 0;
}

.dropdown-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 16px 0;
}

.dropdown-more {
  text-align: center;
  color: #9ca3af;
  font-size: 11px;
  padding: 6px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 4px;
}
</style>
