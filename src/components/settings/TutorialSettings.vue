<template>
  <div class="tutorial-container p-4">
    <h2 class="text-2xl font-bold mb-4">使用教程</h2>
    
    <div class="space-y-6">
      <!-- 基本搜索 -->
      <div class="tutorial-section">
        <h3 class="text-xl font-semibold mb-2">基本搜索</h3>
        <div class="space-y-2">
          <p>1. 直接输入搜索内容，将使用默认搜索引擎进行搜索</p>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">搜索内容</span>
          </div>
        </div>
      </div>

      <!-- 指定搜索引擎搜索 -->
      <div class="tutorial-section">
        <h3 class="text-xl font-semibold mb-2">指定搜索引擎搜索</h3>
        <div class="space-y-2">
          <p>1. 输入搜索引擎的 key，然后输入搜索内容</p>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">bd 搜索内容</span>
            <span class="text-gray-500 ml-2">使用百度搜索</span>
          </div>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">gg 搜索内容</span>
            <span class="text-gray-500 ml-2">使用谷歌搜索</span>
          </div>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">bi 搜索内容</span>
            <span class="text-gray-500 ml-2">使用必应搜索</span>
          </div>
        </div>
      </div>

      <!-- 收藏夹搜索 -->  <!-- 新增的教程区块 -->
      <div class="tutorial-section">
        <h3 class="text-xl font-semibold mb-2">收藏夹搜索</h3>
        <div class="space-y-2">
          <p>输入 "*" 符号开头，后面跟要搜索的内容</p>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">*项目文档</span>
            <span class="text-gray-500 ml-2">搜索标题/URL包含"项目文档"的书签</span>
          </div>
        </div>
      </div>

      <!-- 搜索建议操作 -->
      <div class="tutorial-section">
        <h3 class="text-xl font-semibold mb-2">搜索建议操作</h3>
        <div class="space-y-2">
          <p>输入搜索内容时，会根据当前搜索引擎显示建议列表，可以通过以下方式操作：</p>
          <div class="space-y-3 pl-4">
            <div>
              <p class="font-medium">键盘操作：</p>
              <div class="example-box">
                <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">↑↓</span>
                <span class="text-gray-500 ml-2">上下键选择建议</span>
              </div>
              <div class="example-box">
                <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">←</span>
                <span class="text-gray-500 ml-2">左方向键将建议填充到搜索框，不执行搜索</span>
              </div>
              <div class="example-box">
                <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">→</span>
                <span class="text-gray-500 ml-2">右方向键将建议填充到搜索框并执行搜索</span>
              </div>
              <div class="example-box">
                <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Enter</span>
                <span class="text-gray-500 ml-2">回车键选中当前建议并执行搜索</span>
              </div>
            </div>
            <div>
              <p class="font-medium">鼠标操作：</p>
              <div class="example-box">
                <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">鼠标悬停</span>
                <span class="text-gray-500 ml-2">鼠标悬停在建议上会选中该建议</span>
              </div>
              <div class="example-box">
                <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">左键点击</span>
                <span class="text-gray-500 ml-2">点击建议将执行搜索</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 切换默认搜索引擎 -->  <!-- 原有区块保持不变 -->
      <div class="tutorial-section">
        <h3 class="text-xl font-semibold mb-2">切换默认搜索引擎</h3>
        <div class="space-y-2">
          <p>1. 输入 "cd" 查看可用的搜索引擎</p>
          <p>2. 输入 "cd key" 切换默认搜索引擎</p>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">cd</span>
            <span class="text-gray-500 ml-2">显示所有可用的搜索引擎</span>
          </div>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">cd bd</span>
            <span class="text-gray-500 ml-2">将百度设置为默认搜索引擎</span>
          </div>
        </div>
      </div>

      <!-- 快捷键 -->
      <div class="tutorial-section">
        <h3 class="text-xl font-semibold mb-2">快捷键</h3>
        <div class="space-y-2">
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Alt + S</span>
            <span class="text-gray-500 ml-2">打开全局搜索框</span>
          </div>
          <div class="example-box">
            <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Esc</span>
            <span class="text-gray-500 ml-2">关闭搜索框</span>
          </div>
        </div>
      </div>

      <!-- 自定义搜索引擎 -->
      <div class="tutorial-section">
        <h3 class="text-xl font-semibold mb-2">自定义搜索引擎</h3>
        <div class="space-y-2">
          <p>1. 在设置页面的"搜索引擎"选项中添加或修改搜索引擎</p>
          <p>2. 每个搜索引擎需要设置：</p>
          <ul class="list-disc pl-4 space-y-1">
            <li>关键词（key）：用于快速调用搜索引擎</li>
            <li>标签（label）：搜索引擎的显示名称</li>
            <li>搜索链接（jumpUrl）：搜索的URL模板，使用 &&lt;query&gt; 作为搜索内容的占位符</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
.tutorial-container {
  max-width: 800px;
  margin: 0 auto;
}

.tutorial-section {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.example-box {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
}

@media (prefers-color-scheme: dark) {
  .tutorial-section {
    background-color: rgba(0, 0, 0, 0.2);
  }
}
</style>