<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[1001] flex flex-col gap-3 p-4 pointer-events-none">
      <TransitionGroup
        name="notification"
        tag="div"
        class="flex flex-col gap-3"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="pointer-events-auto group flex w-[320px] cursor-pointer items-start overflow-hidden rounded-2xl bg-white/95 p-4 backdrop-blur-xl dark:bg-zinc-800/95"
          :class="[
            'transform transition-all duration-300 ease-out hover:scale-[102%]',
            'shadow-[0_5px_15px_rgba(0,0,0,0.08)]',
            'dark:shadow-[0_5px_15px_rgba(0,0,0,0.25)]',
            typeClasses[notification.type || 'info']
          ]"
          @click="close(notification.id)"
        >
          <!-- Icon -->
          <div class="flex h-8 w-8 items-center justify-center">
            <Icon 
              :icon="notification.icon" 
              class="h-5 w-5 text-current transition-all duration-300 group-hover:scale-110" 
            />
          </div>

          <!-- Content -->
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-zinc-900 dark:text-white">
              {{ notification.message }}
            </h3>
            <p v-if="notification.description" 
               class="mt-1 text-sm text-zinc-500/90 dark:text-zinc-400/90">
              {{ notification.description }}
            </p>
          </div>

          <!-- Close button -->
          <button 
            class="ml-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity duration-200 hover:bg-black/5 dark:hover:bg-white/10 group-hover:opacity-100"
          >
            <Icon icon="ph:x-bold" class="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
          </button>
          
          <!-- Progress bar -->
          <div
            v-if="notification.duration > 0"
            class="absolute bottom-0 left-0 h-[1px] w-full"
          >
            <div
              class="h-full bg-current/20"
              :style="{
                width: `${getProgress(notification)}%`,
                transition: `width ${notification.duration}ms linear`
              }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useNotification } from '@/composables/useNotification'

const { notifications, close } = useNotification()

const typeClasses = {
  success: 'border-green-500/20 text-green-500 dark:border-green-500/10',
  error: 'border-red-500/20 text-red-500 dark:border-red-500/10',
  info: 'border-blue-500/20 text-blue-500 dark:border-blue-500/10',
  warning: 'border-yellow-500/20 text-yellow-500 dark:border-yellow-500/10'
}

const getProgress = (notification: any) => {
  return 100
}
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.notification-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style> 