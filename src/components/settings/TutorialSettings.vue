<template>
  <div class="tutorial-settings px-6 py-6">
    <div class="space-y-8">
      <!-- 快速搜索 -->
      <div class="tutorial-section">
        <div class="flex items-center gap-3 mb-4">
          <Icon icon="fluent:search-24-filled" class="text-2xl text-blue-500" />
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">快速搜索</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="tutorial-card">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="fluent:keyboard-24-filled" class="text-lg text-blue-500" />
              <span class="font-medium text-gray-700 dark:text-gray-300">搜索引擎快捷方式</span>
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">bd</kbd>
                <span>百度搜索</span>
              </div>
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">gg</kbd>
                <span>谷歌搜索</span>
              </div>
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">bi</kbd>
                <span>必应搜索</span>
              </div>
            </div>
          </div>
          <div class="tutorial-card">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="fluent:arrow-swap-24-filled" class="text-lg text-blue-500" />
              <span class="font-medium text-gray-700 dark:text-gray-300">切换默认引擎</span>
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">cd</kbd>
                <span>输入后选择要切换的搜索引擎</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                例如：输入 <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">cd gg</kbd> 切换到谷歌
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 收藏夹搜索 -->
      <div class="tutorial-section">
        <div class="flex items-center gap-3 mb-4">
          <Icon icon="fluent:bookmark-24-filled" class="text-2xl text-blue-500" />
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">收藏夹搜索</h3>
        </div>
        <div class="tutorial-card">
          <div class="flex items-center gap-2 mb-2">
            <Icon icon="fluent:star-24-filled" class="text-lg text-blue-500" />
            <span class="font-medium text-gray-700 dark:text-gray-300">快速查找收藏</span>
          </div>
          <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-2">
              <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">*</kbd>
              <span>输入星号后跟关键词搜索收藏夹</span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              支持标题和URL搜索
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索建议 -->
      <div class="tutorial-section">
        <div class="flex items-center gap-3 mb-4">
          <Icon icon="fluent:lightbulb-24-filled" class="text-2xl text-blue-500" />
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">搜索建议</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="tutorial-card">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="fluent:keyboard-24-filled" class="text-lg text-blue-500" />
              <span class="font-medium text-gray-700 dark:text-gray-300">键盘操作</span>
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
                <span>上下选择建议</span>
              </div>
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd>
                <span>确认选择</span>
              </div>
              <div class="flex items-center gap-2">
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd>
                <span>关闭建议</span>
              </div>
            </div>
          </div>
          <div class="tutorial-card">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="fluent:mouse-24-filled" class="text-lg text-blue-500" />
              <span class="font-medium text-gray-700 dark:text-gray-300">鼠标操作</span>
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <Icon icon="fluent:hand-right-24-filled" class="text-lg text-blue-500" />
                <span>右键点击：直接搜索</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 界面定制 -->
      <div class="tutorial-section">
        <div class="flex items-center gap-3 mb-4">
          <Icon icon="fluent:color-24-filled" class="text-2xl text-blue-500" />
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">界面定制</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="tutorial-card">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="fluent:image-24-filled" class="text-lg text-blue-500" />
              <span class="font-medium text-gray-700 dark:text-gray-300">背景设置</span>
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <Icon icon="fluent:image-24-regular" class="text-lg text-blue-500" />
                <span>自定义背景图片</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="fluent:color-24-regular" class="text-lg text-blue-500" />
                <span>纯色背景</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="fluent:blur-24-regular" class="text-lg text-blue-500" />
                <span>毛玻璃效果</span>
              </div>
            </div>
          </div>
          <div class="tutorial-card">
            <div class="flex items-center gap-2 mb-2">
              <Icon icon="fluent:time-24-filled" class="text-lg text-blue-500" />
              <span class="font-medium text-gray-700 dark:text-gray-300">时间显示</span>
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <Icon icon="fluent:clock-24-regular" class="text-lg text-blue-500" />
                <span>显示/隐藏时间</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="fluent:calendar-24-regular" class="text-lg text-blue-500" />
                <span>显示/隐藏日期</span>
              </div>
              <div class="flex items-center gap-2">
                <Icon icon="fluent:settings-24-regular" class="text-lg text-blue-500" />
                <span>自定义时间格式</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
</script>

<style scoped>
.tutorial-settings {
  max-width: 1200px;
  margin: 0 auto;
}

.tutorial-section {
  animation: fadeIn 0.5s ease-out;
}

.tutorial-card {
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(229, 231, 235, 1);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.dark .tutorial-card {
  background-color: rgba(31, 41, 55, 0.5);
  border-color: rgba(75, 85, 99, 1);
}

.tutorial-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 添加响应式间距 */
@media (max-width: 768px) {
  .tutorial-settings {
    padding: 1rem;
  }
  
  .tutorial-section {
    margin-bottom: 2rem;
  }
}
</style>