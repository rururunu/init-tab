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
        <div class="w-[20%] h-[100%] border-r-1 border-[#B2B2B2] select-none px-2 dark:border-[#000000]">
          <div class="h-[10%] flex flex-row items-center">
            <Icon @click="handleClose" icon="fluent-color:dismiss-circle-48" class="text-2xl cursor-pointer ml-2">
            </Icon>
          </div>
          <div v-for="(select, index) in select" :key="index"
            class="flex flex-row content-center items-center w-[100%] p-1.5 rounded-xl text-gray-900 pl-[18%] mt-1 dark:text-white"
            :style="currentSettingComponent.key == select.key ? { backgroundColor: '#006BDF', color: 'white' } : {}"
            @click="setUpClick(select.key)">
            <Icon :icon="select.icon"></Icon>
            <span class="ml-2">{{ select.label }}</span>
          </div>
        </div>
        <div
          class="w-[80%] h-[100%] bg-[color:rgba(255,255,255,0.5)] dark:bg-[color:rgba(30,30,30,0.5)] rounded-r-[12px] ">
          <div class="h-[10%] border-b-1 border-[#B2B2B2] dark:text-white flex flex-row items-center pl-3 dark:border-[#000000]">{{
            currentSettingComponent.label }}</div>
          <component class="h-[90%] overflow-auto" :is="currentSettingComponent.in" />
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
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  height: 60vh;
  max-height: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

/* 自定义滚动条样式 */
.dialog-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.dialog-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 左侧菜单滚动条 */
.w-\[20\%\] {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  overflow-y: auto;
}

.w-\[20\%\]::-webkit-scrollbar {
  width: 4px;
}

.w-\[20\%\]::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 2px;
}

.w-\[20\%\]::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.w-\[20\%\]::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 暗色模式下的滚动条样式 */
@media (prefers-color-scheme: dark) {
  .dialog-content {
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .dialog-content::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .dialog-content::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .w-\[20\%\] {
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .w-\[20\%\]::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .w-\[20\%\]::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
}

.dialog-header {
  padding-top: 20px;
  padding-left: 20px;
  padding-right: 20px;
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
  padding-bottom: 20px;
}

/* 深色模式下的样式 */
@media(prefers-color-scheme: dark) {
  .dialog-content {
    background-color: rgba(30, 30, 30, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dialog-header,
  .dialog-body {
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