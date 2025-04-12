<template>
  <div
    class="relative flex min-h-[64px] w-80 cursor-pointer items-center gap-3 overflow-hidden rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-800"
    :class="[
      'transform transition-all duration-200 ease-in-out hover:scale-[102%]',
      typeClasses[type]
    ]"
    @click="$emit('close')"
  >
    <Icon :icon="icon" class="h-5 w-5" />
    <div class="flex flex-col overflow-hidden">
      <div class="flex items-center text-sm font-medium">
        <span>{{ message }}</span>
        <span v-if="description" class="mx-1">·</span>
        <span v-if="description" class="text-xs text-gray-500">{{ description }}</span>
      </div>
    </div>
    
    <!-- Progress bar -->
    <div
      v-if="duration > 0"
      class="absolute bottom-0 left-0 h-1 bg-current opacity-20"
      :style="{
        width: `${progress}%`,
        transition: `width ${duration}ms linear`
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref, onMounted } from 'vue'

const props = defineProps<{
  message: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  icon?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const progress = ref(100)
const typeClasses = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500'
}

onMounted(() => {
  if (props.duration && props.duration > 0) {
    // Start progress animation
    requestAnimationFrame(() => {
      progress.value = 0
    })
  }
})
</script> 