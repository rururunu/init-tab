<template>
  <div class="tutorial-root">

    <!-- 欢迎引导 -->
    <div class="welcome-banner">
      <div class="welcome-icon">
        <Icon icon="fluent-color:rocket-24" class="text-3xl" />
      </div>
      <div>
        <p class="welcome-title">快速上手</p>
        <p class="welcome-sub">通过搜索框前缀命令，即可快速访问各项功能</p>
      </div>
    </div>

    <!-- 命令速查表 -->
    <section class="section">
      <div class="section-header">
        <Icon icon="fluent-color:keyboard-24" class="text-xl" />
        <h3 class="section-title">命令速查</h3>
      </div>
      <div class="command-table">
        <div class="command-row" v-for="cmd in commands" :key="cmd.prefix">
          <div class="command-prefix-cell">
            <kbd class="cmd-prefix">{{ cmd.prefix }}</kbd>
            <span v-if="cmd.suffix" class="cmd-suffix">{{ cmd.suffix }}</span>
          </div>
          <div class="command-arrow">→</div>
          <div class="command-desc">
            <span class="command-desc-text">{{ cmd.desc }}</span>
            <span v-if="cmd.example" class="command-example">例：{{ cmd.example }}</span>
          </div>
          <span class="command-badge" :class="cmd.color">{{ cmd.badge }}</span>
        </div>
      </div>
    </section>

    <!-- 功能说明 -->
    <div class="features-grid">

      <!-- 搜索引擎 -->
      <section class="feature-card card-blue">
        <div class="feature-card-header">
          <Icon icon="fluent-color:search-24" class="text-xl" />
          <h4 class="feature-title">切换搜索引擎</h4>
        </div>
        <ol class="step-list">
          <li class="step-item">
            <span class="step-num">1</span>
            <span>输入 <kbd class="inline-kbd">cd</kbd> 并按空格</span>
          </li>
          <li class="step-item">
            <span class="step-num">2</span>
            <span>从弹出列表中选择引擎，或直接输入 Key</span>
          </li>
          <li class="step-item">
            <span class="step-num">3</span>
            <span>按 <kbd class="inline-kbd">Enter</kbd> 确认切换</span>
          </li>
        </ol>
        <div class="tip-box">
          <Icon icon="fluent:info-12-filled" class="text-xs flex-shrink-0 mt-0.5" />
          <span>切换后立即生效，直接输入内容将使用新默认引擎</span>
        </div>
      </section>

      <!-- 收藏夹 -->
      <section class="feature-card card-amber">
        <div class="feature-card-header">
          <Icon icon="fluent-color:bookmark-24" class="text-xl" />
          <h4 class="feature-title">收藏夹搜索</h4>
        </div>
        <ol class="step-list">
          <li class="step-item">
            <span class="step-num step-amber">1</span>
            <span>输入 <kbd class="inline-kbd">*</kbd> 后紧跟关键词</span>
          </li>
          <li class="step-item">
            <span class="step-num step-amber">2</span>
            <span>用 <kbd class="inline-kbd">↑</kbd> <kbd class="inline-kbd">↓</kbd> 切换结果</span>
          </li>
          <li class="step-item">
            <span class="step-num step-amber">3</span>
            <span>按 <kbd class="inline-kbd">Enter</kbd> 在新标签打开</span>
          </li>
        </ol>
        <div class="tip-box tip-amber">
          <Icon icon="fluent:info-12-filled" class="text-xs flex-shrink-0 mt-0.5" />
          <span>支持按书签标题和 URL 同时匹配</span>
        </div>
      </section>

      <!-- 搜索建议 -->
      <section class="feature-card card-purple">
        <div class="feature-card-header">
          <Icon icon="fluent-color:lightbulb-24" class="text-xl" />
          <h4 class="feature-title">搜索建议交互</h4>
        </div>
        <div class="shortcut-list">
          <div class="shortcut-row" v-for="s in shortcuts" :key="s.key">
            <div class="shortcut-keys">
              <kbd class="inline-kbd" v-for="k in s.keys" :key="k">{{ k }}</kbd>
            </div>
            <span class="shortcut-action">{{ s.action }}</span>
          </div>
        </div>
        <div class="tip-box tip-purple">
          <Icon icon="fluent:info-12-filled" class="text-xs flex-shrink-0 mt-0.5" />
          <span>左键点击建议填充到输入框；右键或 Enter 直接跳转搜索</span>
        </div>
      </section>

      <!-- 界面定制 -->
      <section class="feature-card card-green">
        <div class="feature-card-header">
          <Icon icon="fluent-color:paint-brush-24" class="text-xl" />
          <h4 class="feature-title">界面定制</h4>
        </div>
        <ul class="customize-list">
          <li v-for="item in customizeItems" :key="item.label" class="customize-item">
            <Icon :icon="item.icon" class="text-base flex-shrink-0" :class="item.color" />
            <div>
              <span class="customize-label">{{ item.label }}</span>
              <span class="customize-note">{{ item.note }}</span>
            </div>
          </li>
        </ul>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

const commands = [
  {
    prefix: "bd ",
    suffix: "关键词",
    desc: "百度搜索",
    example: "bd Vue3教程",
    badge: "搜索",
    color: "badge-blue",
  },
  {
    prefix: "gg ",
    suffix: "关键词",
    desc: "谷歌搜索",
    example: "gg Vue3 docs",
    badge: "搜索",
    color: "badge-blue",
  },
  {
    prefix: "bi ",
    suffix: "关键词",
    desc: "必应搜索",
    example: "bi 天气预报",
    badge: "搜索",
    color: "badge-blue",
  },
  {
    prefix: "cd ",
    suffix: "引擎Key",
    desc: "切换默认搜索引擎",
    example: "cd gg",
    badge: "设置",
    color: "badge-green",
  },
  {
    prefix: "*",
    suffix: "关键词",
    desc: "搜索浏览器收藏夹",
    example: "*GitHub",
    badge: "收藏",
    color: "badge-amber",
  },
];

const shortcuts = [
  { keys: ["↑", "↓"], action: "上下切换建议项" },
  { keys: ["→"], action: "用选中建议填充输入框" },
  { keys: ["Enter"], action: "用选中建议直接搜索" },
  { keys: ["Esc"], action: "关闭搜索建议" },
];

const customizeItems = [
  {
    icon: "fluent:image-24-filled",
    color: "text-blue-500",
    label: "壁纸",
    note: "在线壁纸源 / 自定义图片 / 纯色背景",
  },
  {
    icon: "fluent:paint-bucket-24-filled",
    color: "text-purple-500",
    label: "主色调",
    note: "自定义时间与图标的颜色",
  },
  {
    icon: "fluent:clock-24-filled",
    color: "text-green-500",
    label: "时间与日期",
    note: "显示控制 / 秒数 / 12·24小时制",
  },
  {
    icon: "fluent:drop-24-filled",
    color: "text-amber-500",
    label: "背景遮罩",
    note: "半透明遮罩，改善文字可读性",
  },
];
</script>

<style scoped>
.tutorial-root {
  padding: 20px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 欢迎横幅 */
.welcome-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.06));
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.welcome-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.welcome-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.welcome-sub {
  font-size: 12px;
  color: #6b7280;
}

/* 分区通用 */
.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  letter-spacing: 0.02em;
}

/* 命令速查表 */
.command-table {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.command-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  background: rgba(255, 255, 255, 0.55);
  transition: background 0.15s;
}

.command-row:hover {
  background: rgba(255, 255, 255, 0.85);
}

.command-prefix-cell {
  display: flex;
  align-items: center;
  gap: 3px;
  width: 120px;
  flex-shrink: 0;
}

.cmd-prefix {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
  background: #1a1a1a;
  color: #fff;
  letter-spacing: 0.03em;
  box-shadow: 0 1px 0 0 rgba(0,0,0,0.3), inset 0 -1px 0 0 rgba(0,0,0,0.2);
}

.cmd-suffix {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

.command-arrow {
  font-size: 13px;
  color: #d1d5db;
  flex-shrink: 0;
}

.command-desc {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.command-desc-text {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.command-example {
  font-size: 11px;
  color: #9ca3af;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.command-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.badge-blue { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
.badge-green { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
.badge-amber { background: rgba(245, 158, 11, 0.1); color: #d97706; }

/* 功能卡片网格 */
.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.feature-card {
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-blue  { background: rgba(59,130,246,0.05);  border-color: rgba(59,130,246,0.12);  }
.card-amber { background: rgba(245,158,11,0.05);  border-color: rgba(245,158,11,0.15);  }
.card-purple{ background: rgba(139,92,246,0.05);  border-color: rgba(139,92,246,0.12);  }
.card-green { background: rgba(34,197,94,0.05);   border-color: rgba(34,197,94,0.12);   }

.feature-card-header {
  display: flex;
  align-items: center;
  gap: 7px;
}

.feature-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

/* 步骤列表 */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.5;
}

.step-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-amber {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

/* 内联 kbd */
.inline-kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(0,0,0,0.07);
  color: #374151;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 1px 0 rgba(0,0,0,0.12);
}

/* 提示框 */
.tip-box {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: #3b82f6;
  background: rgba(59,130,246,0.07);
  border-radius: 7px;
  padding: 7px 10px;
  line-height: 1.5;
}

.tip-amber {
  color: #d97706;
  background: rgba(245,158,11,0.07);
}

.tip-purple {
  color: #7c3aed;
  background: rgba(139,92,246,0.07);
}

/* 快捷键列表 */
.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-keys {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
  min-width: 68px;
}

.shortcut-action {
  font-size: 12px;
  color: #4b5563;
}

/* 定制列表 */
.customize-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.customize-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 12px;
}

.customize-label {
  font-weight: 600;
  color: #1f2937;
  display: block;
  margin-bottom: 1px;
}

.customize-note {
  font-size: 11px;
  color: #6b7280;
  display: block;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .welcome-banner {
    background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08));
    border-color: rgba(59,130,246,0.15);
  }

  .welcome-icon {
    background: rgba(255,255,255,0.06);
  }

  .welcome-title { color: #f3f4f6; }
  .welcome-sub   { color: #6b7280; }

  .section-title { color: #d1d5db; }

  .command-table {
    border-color: rgba(255,255,255,0.06);
  }

  .command-row {
    background: rgba(255,255,255,0.04);
  }

  .command-row:hover {
    background: rgba(255,255,255,0.08);
  }

  .cmd-prefix {
    background: #e5e7eb;
    color: #111827;
  }

  .command-desc-text { color: #d1d5db; }
  .command-example   { color: #6b7280; }
  .command-arrow     { color: #4b5563; }

  .feature-title { color: #f3f4f6; }
  .step-item     { color: #9ca3af; }
  .shortcut-action { color: #9ca3af; }

  .inline-kbd {
    background: rgba(255,255,255,0.1);
    color: #e5e7eb;
    border-color: rgba(255,255,255,0.12);
  }

  .customize-label { color: #f3f4f6; }
  .customize-note  { color: #6b7280; }

  .card-blue   { background: rgba(59,130,246,0.08);  border-color: rgba(59,130,246,0.15);  }
  .card-amber  { background: rgba(245,158,11,0.08);  border-color: rgba(245,158,11,0.18);  }
  .card-purple { background: rgba(139,92,246,0.08);  border-color: rgba(139,92,246,0.15);  }
  .card-green  { background: rgba(34,197,94,0.08);   border-color: rgba(34,197,94,0.15);   }
}
</style>
