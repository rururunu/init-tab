<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  show: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <Transition name="dialog">
    <div v-if="show" class="dialog-overlay" @click="handleClose">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3 class="text-xl font-bold">{{ title }}</h3>
          <Icon @click="handleClose" icon="mdi:close" class="text-2xl cursor-pointer"></Icon>
        </div>
        <div class="dialog-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  height: 60vh;
  max-height: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #1a1a1a;
  flex-shrink: 0;
}

.dialog-body {
  color: #1a1a1a;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 深色模式下的样式 */
@media(prefers-color-scheme: dark) {
  .dialog-content {
    background-color: rgba(30, 30, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .dialog-header, .dialog-body {
    color: #ffffff;
  }
}

/* 对话框动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.95);
  opacity: 0;
}

.dialog-enter-to .dialog-content,
.dialog-leave-from .dialog-content {
  transform: scale(1);
  opacity: 1;
}
</style> 