<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, onBeforeUnmount, ref, shallowRef, watch } from "vue";

const props = defineProps<{
  show: boolean;
  select: any[];
  title?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const currentSettingComponent = shallowRef<any>(props.select?.[0] ?? null);
const visibleCount = ref(props.select.length);
const moreMenuOpen = ref(false);

const visibleSelect = computed(() => props.select.slice(0, visibleCount.value));
const overflowSelect = computed(() => props.select.slice(visibleCount.value));
const overflowIsActive = computed(() =>
  overflowSelect.value.some((item) => item.key === currentSettingComponent.value?.key)
);

const updateVisibleCount = () => {
  const width = window.innerWidth;
  if (width <= 360) visibleCount.value = Math.min(2, props.select.length);
  else if (width <= 540) visibleCount.value = Math.min(3, props.select.length);
  else if (width <= 700) visibleCount.value = Math.min(4, props.select.length);
  else visibleCount.value = Math.min(5, props.select.length);
  if (!overflowSelect.value.length) moreMenuOpen.value = false;
};

onMounted(() => {
  if (props.select?.[0]) setUpClick(props.select[0].key);
  updateVisibleCount();
  window.addEventListener("resize", updateVisibleCount);
});

const handleClose = () => {
  emit("close");
};

function setUpClick(select: string) {
  const found = props.select.find((item) => item.key === select);
  if (found) currentSettingComponent.value = found;
  moreMenuOpen.value = false;
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.show) {
    e.preventDefault();
    handleClose();
  }
};

watch(
  () => props.show,
  (open) => {
    if (open) document.addEventListener("keydown", onKeydown);
    else {
      moreMenuOpen.value = false;
      document.removeEventListener("keydown", onKeydown);
    }
  }
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  window.removeEventListener("resize", updateVisibleCount);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="show" class="drawer-root">
        <!-- 遮罩 -->
        <div class="drawer-mask" @click="handleClose" />

        <!-- 左侧抽屉 -->
        <aside class="drawer-panel" role="dialog" aria-modal="true" @click.stop>
          <!-- 顶栏 -->
          <header class="drawer-header">
            <span class="drawer-title">{{ props.title || "设置" }}</span>
            <button type="button" class="drawer-close" title="关闭" @click="handleClose">
              <Icon icon="fluent:dismiss-24-filled" class="text-lg" />
            </button>
          </header>

          <!-- 导航 -->
          <nav class="drawer-nav">
            <button
              v-for="item in visibleSelect"
              :key="item.key"
              type="button"
              class="nav-item"
              :class="{ 'nav-item--active': currentSettingComponent?.key === item.key }"
              @click="setUpClick(item.key)"
            >
              <Icon :icon="item.icon" class="text-lg flex-shrink-0" />
              <span class="nav-label">{{ item.label }}</span>
            </button>
            <div v-if="overflowSelect.length" class="nav-more-wrap">
              <button
                type="button"
                class="nav-more"
                :class="{ 'nav-more--active': overflowIsActive || moreMenuOpen }"
                :aria-expanded="moreMenuOpen"
                title="更多设置"
                aria-label="更多设置"
                @click="moreMenuOpen = !moreMenuOpen"
              >
                <Icon icon="fluent:more-horizontal-24-regular" />
              </button>
              <div v-if="moreMenuOpen" class="nav-more-menu">
                <button
                  v-for="item in overflowSelect"
                  :key="item.key"
                  type="button"
                  class="nav-more-item"
                  :class="{ 'nav-more-item--active': currentSettingComponent?.key === item.key }"
                  @click="setUpClick(item.key)"
                >
                  <Icon :icon="item.icon" />
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </div>
          </nav>

          <!-- 内容 -->
          <div class="drawer-body">
            <div class="content-header" v-if="currentSettingComponent">
              <span>{{ currentSettingComponent.label }}</span>
            </div>
            <component
              v-if="currentSettingComponent"
              class="drawer-content ui-scroll"
              :is="currentSettingComponent.in"
            />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}

.drawer-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 15, 18, 0.28);
  backdrop-filter: blur(8px) saturate(130%);
  -webkit-backdrop-filter: blur(8px) saturate(130%);
  pointer-events: auto;
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  left: auto;
  bottom: 0;
  width: min(640px, 96vw);
  display: flex;
  flex-direction: column;
  background: rgba(250, 250, 250, 0.96);
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  border-right: none;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  pointer-events: auto;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.drawer-close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.drawer-nav {
  position: relative;
  z-index: 10;
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  overflow: visible;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.42);
  cursor: pointer;
  font-size: 12px;
  color: #4b5563;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
}

.nav-item:hover {
  border-color: rgba(37, 99, 235, 0.36);
  background-color: rgba(37, 99, 235, 0.06);
}

.nav-item--active {
  border-color: rgba(37, 99, 235, 0.62);
  background-color: rgba(37, 99, 235, 0.08);
  color: #2563eb;
}

.nav-item--active:hover {
  background-color: rgba(37, 99, 235, 0.12);
}

.nav-label {
  font-weight: 500;
}

.nav-more-wrap {
  position: relative;
  flex-shrink: 0;
}

.nav-more {
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.42);
  cursor: pointer;
  font-size: 18px;
}

.nav-more:hover,
.nav-more--active {
  color: #2563eb;
  border-color: rgba(37, 99, 235, 0.62);
  background: rgba(37, 99, 235, 0.08);
}

.nav-more-menu {
  position: absolute;
  top: calc(100% + 7px);
  right: 0;
  z-index: 20;
  width: 156px;
  padding: 5px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
}

.nav-more-item {
  width: 100%;
  height: 36px;
  padding: 0 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 6px;
  color: #4b5563;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}

.nav-more-item:hover,
.nav-more-item--active {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.drawer-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.45);
}

.content-header {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.drawer-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .drawer-mask {
    background: rgba(0, 0, 0, 0.45);
  }

  .drawer-panel {
    background: rgba(24, 24, 27, 0.96);
    border-left-color: rgba(255, 255, 255, 0.08);
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.4);
  }

  .drawer-header {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .drawer-title {
    color: #f3f4f6;
  }

  .drawer-close {
    color: #a1a1aa;
  }

  .drawer-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #f4f4f5;
  }

  .drawer-nav {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .nav-item {
    color: #a1a1aa;
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
  }

  .nav-item:hover {
    background-color: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  .nav-item--active,
  .nav-item--active:hover {
    color: #60a5fa;
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(59, 130, 246, 0.14);
  }

  .nav-more {
    color: #a1a1aa;
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
  }

  .nav-more-menu {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(39, 39, 42, 0.98);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  }

  .nav-more-item {
    color: #d4d4d8;
  }

  .drawer-body {
    background: rgba(255, 255, 255, 0.02);
  }

  .content-header {
    color: #f3f4f6;
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
}

/* 抽屉动画：从右侧滑入 */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.22s ease;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.drawer-enter-active .drawer-mask,
.drawer-leave-active .drawer-mask {
  transition: opacity 0.22s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 1;
}

.drawer-enter-from .drawer-mask,
.drawer-leave-to .drawer-mask {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

.drawer-enter-to .drawer-panel,
.drawer-leave-from .drawer-panel {
  transform: translateX(0);
}

@media (max-width: 560px) {
  .drawer-panel {
    width: 100vw;
  }

  .drawer-nav {
    padding-inline: 12px;
  }
}
</style>
