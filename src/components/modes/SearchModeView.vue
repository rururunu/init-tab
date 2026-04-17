<template>
  <!-- 单根节点包装，Transition 必须只有一个子元素 -->
  <div class="search-mode-view w-full flex flex-col items-center relative">

<!-- 时间和日期显示 -->
    <BlurReveal
      v-if="showTime || showDate"
      :delay="0.2"
      :duration="0.75"
      class="p-8"
    >
      <template v-if="showTime">
        <h2
          class="mb-3 text-center tracking-widest select-none cursor-none"
          :style="{
            color: clockColor,
            fontFamily: `'${clockFont}', sans-serif`,
            fontSize: clockFontSize + 'px',
            fontWeight: clockFontWeight,
            textShadow: '0 2px 32px rgba(245,245,250,0.22)',
          }"
        >
          {{ time }}
        </h2>
      </template>
      <template v-else>
        <div class="mb-3" />
      </template>
      <div
        class="mb-30 text-center text-sm tracking-[0.2em] sm:mb-50 select-none cursor-none"
        :style="{
          color: clockColor,
          fontFamily: `'${clockFont}', sans-serif`,
          fontWeight: 400,
        }"
      >
        <span v-if="showDate">{{ date }}</span>
        <span v-else class="invisible">&nbsp;</span>
      </div>
    </BlurReveal>

    <!-- 搜索区域 -->
    <div
      class="w-full relative z-2 flex flex-col items-center"
      :class="{
        'h-[40vh] justify-center': !showTime && !showDate,
        'justify-start pt-4': showTime || showDate,
      }"
    >
      <div
        class="w-full transition-all duration-500 ease-in-out"
        :class="{
          'transform scale-95 translate-y-[-20px]': showTime || showDate,
          'transform scale-100 translate-y-0': !showTime && !showDate,
        }"
      >
        <SearchBar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'
import BlurReveal from '@/components/ui/blur-reveal/BlurReveal.vue'
import SearchBar from '@/components/ui/search-bar/SearchBar.vue'
import { useWallpaper } from '@/composables/useWallpaper'

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const {
  wallpaperType,
  themeColor,
  showTime,
  showSeconds,
  showDate,
  use24Hour,
  clockFont,
  clockFontSize,
  clockFontWeight,
  useCustomColor,
} = useWallpaper()

const isDark = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  isDark.value = e.matches
})

const clockColor = computed(() => {
  if (useCustomColor.value) return themeColor.value
  if (wallpaperType.value !== 'none' || isDark.value) return '#f5f5facc'
  return '#374151cc'
})

const date = ref('')
const time = ref('')

let timer: ReturnType<typeof setInterval>

const updateDateTime = () => {
  const now = dayjs()
  date.value = `${WEEKDAYS[now.day()]}  ·  ${now.format('YYYY年M月D日')}`
  if (use24Hour.value) {
    time.value = showSeconds.value ? now.format('HH:mm:ss') : now.format('HH:mm')
  } else {
    time.value = showSeconds.value ? now.format('h:mm:ss A') : now.format('h:mm A')
  }
}

onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>
