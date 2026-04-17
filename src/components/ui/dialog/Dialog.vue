<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { onMounted, ref, shallowRef } from "vue";

const currentSettingComponent = shallowRef<any>(null)

onMounted(() => {
  setUpClick(props.select[0].key)
})

const props = defineProps<{
  show: boolean;
  select: any[];
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleClose = () => {
  emit('close');
};

function setUpClick(select: string) {
  props.select.forEach((item) => {
    if (item.key === select) {
      currentSettingComponent.value = item
    }
  });
}


</script>

<template>
  <Transition name="dialog">
    <div v-if="show" class="dialog-overlay" @click="handleClose">
      <div class="dialog-content" @click.stop>
        <!-- 左侧导航栏 -->
        <div class="sidebar">
          <!-- 头部：标题 + 关闭按钮 -->
          <div class="sidebar-header">
            <span class="sidebar-title">{{ props.title || '设置' }}</span>
            <Icon
              @click="handleClose"
              icon="fluent-color:dismiss-circle-48"
              class="text-xl cursor-pointer hover:opacity-70 transition-opacity"
            />
          </div>
          <!-- 导航项 -->
          <nav class="sidebar-nav">
            <div
              v-for="(select, index) in select"
              :key="index"
              class="nav-item"
              :class="{ 'nav-item--active': currentSettingComponent.key === select.key }"
              @click="setUpClick(select.key)"
            >
              <Icon :icon="select.icon" class="text-lg flex-shrink-0" />
              <span class="nav-label">{{ select.label }}</span>
            </div>
          </nav>
        </div>

        <!-- 右侧内容区 -->
        <div class="content-area">
          <div class="content-header">
            <span>{{ currentSettingComponent.label }}</span>
          </div>
          <component class="h-[calc(100%-44px)] overflow-auto" :is="currentSettingComponent.in" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: rgba(248, 249, 250, 0.85);
  border-radius: 16px;
  width: 90%;
  max-width: 860px;
  height: 62vh;
  max-height: 580px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: row;
  overflow: hidden;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* 左侧导航栏 */
.sidebar {
  width: 190px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  background-color: rgba(255, 255, 255, 0.4);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.01em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #444;
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
}

.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav-item--active {
  background-color: #006BDF;
  color: #fff;
}

.nav-item--active:hover {
  background-color: #0060cc;
}

.nav-label {
  font-weight: 500;
}

/* 右侧内容区 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0 16px 16px 0;
  overflow: hidden;
}

.content-header {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .dialog-content {
    background-color: rgba(28, 28, 30, 0.88);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.4),
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .sidebar {
    background-color: rgba(255, 255, 255, 0.04);
    border-right-color: rgba(255, 255, 255, 0.06);
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }

  .sidebar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .sidebar-header {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .sidebar-title {
    color: #f0f0f0;
  }

  .nav-item {
    color: #bbb;
  }

  .nav-item:hover {
    background-color: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  .content-area {
    background-color: rgba(255, 255, 255, 0.04);
  }

  .content-header {
    color: #f0f0f0;
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
}

/* 对话框入场/离场动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}

.dialog-enter-to .dialog-content,
.dialog-leave-from .dialog-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}
</style>