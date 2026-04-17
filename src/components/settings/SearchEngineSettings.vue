<template>
  <div class="se-root">

    <!-- 引擎列表 -->
    <div class="engine-list">
      <TransitionGroup name="engine-card" tag="div" class="engine-list-inner">
        <div
          v-for="(engine, index) in jumpData"
          :key="engine._id"
          class="engine-card"
        >
          <!-- 卡片头部：名称 + 删除 -->
          <div class="card-header">
            <div class="engine-avatar" :style="{ backgroundColor: getAvatarColor(engine.label) }">
              {{ getAvatarLetter(engine.label) }}
            </div>
            <input
              v-model="engine.label"
              class="engine-name-input"
              placeholder="搜索引擎名称"
            />
            <button class="delete-btn" @click="removeEngine(index)" title="删除">
              <Icon icon="fluent:dismiss-24-filled" class="text-sm" />
            </button>
          </div>

          <!-- URL 区域 -->
          <div class="field-group">
            <label class="field-label">搜索链接</label>
            <input
              v-model="engine.jumpUrl"
              class="url-input"
              placeholder="https://example.com/search?q=&<query>"
            />
            <p class="field-hint">
              <Icon icon="fluent:info-16-filled" class="text-xs" />
              用 <code>&amp;&lt;query&gt;</code> 表示查询词的位置
            </p>
          </div>

          <!-- 快捷词 -->
          <div class="field-group">
            <label class="field-label">快捷指令</label>
            <div class="keys-row">
              <div class="key-input-wrapper">
                <span class="key-badge-icon">#</span>
                <input
                  v-model="engine.key[0]"
                  class="key-input"
                  placeholder="主指令（如 bd）"
                  spellcheck="false"
                />
              </div>
              <div class="key-input-wrapper">
                <span class="key-badge-icon">#</span>
                <input
                  v-model="engine.key[1]"
                  class="key-input"
                  placeholder="别名（可选）"
                  spellcheck="false"
                />
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="jumpData.length === 0" class="empty-state">
        <Icon icon="fluent:search-off-24-regular" class="text-3xl text-gray-300 dark:text-zinc-600" />
        <p class="text-sm text-gray-400 dark:text-zinc-500 mt-2">暂无搜索引擎，点击下方按钮添加</p>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <button class="btn-add" @click="addNewEngine">
        <Icon icon="fluent:add-24-filled" class="text-sm" />
        添加搜索引擎
      </button>
      <button class="btn-save" @click="saveEngines">
        <Icon icon="fluent:save-24-filled" class="text-sm" />
        保存设置
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useNotification } from '@/composables/useNotification';
import { storage } from '@/utils/storage';

const { success, error } = useNotification();

interface JumpData {
  _id: number;
  key: string[];
  label: string;
  jumpUrl: string;
}

const defaultEngines = [
  { key: ['bd', 'baidu'], label: 'BaiDu百度',   jumpUrl: 'https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>' },
  { key: ['gg', 'google'], label: 'Google谷歌', jumpUrl: 'https://www.google.com/search?q=&<query>' },
  { key: ['bi', 'bing'],   label: 'Bing必应',   jumpUrl: 'https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN' },
];

const jumpData = ref<JumpData[]>([]);
let nextId = 0;

const loadEngines = async () => {
  try {
    const saved = await storage.get('jumpData');
    let data: any[];
    if (Array.isArray(saved)) {
      data = saved;
    } else if (typeof saved === 'string') {
      data = JSON.parse(saved);
    } else {
      data = defaultEngines;
    }
    jumpData.value = data.map((e: any) => ({ ...e, _id: nextId++ }));
  } catch {
    jumpData.value = defaultEngines.map((e) => ({ ...e, _id: nextId++ }));
  }
};

const saveEngines = async () => {
  try {
    const toSave = jumpData.value.map(({ _id, ...rest }) => rest);
    await storage.set('jumpData', JSON.stringify(toSave));
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ action: 'UPDATE_JUMP_DATA', data: toSave });
    }
    success('保存成功', '搜索引擎设置已更新');
  } catch (e) {
    error('保存失败', e?.toString());
  }
};

const addNewEngine = () => {
  jumpData.value.push({ _id: nextId++, key: ['', ''], label: '', jumpUrl: '' });
};

const removeEngine = (index: number) => {
  jumpData.value.splice(index, 1);
};

// 根据名称生成头像首字母
const getAvatarLetter = (label: string) => {
  return label?.trim()?.[0]?.toUpperCase() || '?';
};

// 根据名称生成固定颜色（哈希）
const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#ef4444', '#6366f1',
];
const getAvatarColor = (label: string) => {
  if (!label?.trim()) return '#9ca3af';
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

onMounted(loadEngines);
</script>

<style scoped>
.se-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 引擎列表 */
.engine-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}

.engine-list::-webkit-scrollbar { width: 4px; }
.engine-list::-webkit-scrollbar-track { background: transparent; }
.engine-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

.engine-list-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 引擎卡片 */
.engine-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s ease;
}

.engine-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.engine-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  letter-spacing: 0;
  transition: background-color 0.3s ease;
}

.engine-name-input {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  background: transparent;
  border: none;
  outline: none;
  padding: 2px 0;
  border-bottom: 1.5px solid transparent;
  transition: border-color 0.15s;
}

.engine-name-input:focus {
  border-bottom-color: #3b82f6;
}

.engine-name-input::placeholder {
  font-weight: 400;
  color: #d1d5db;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* 字段组 */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.url-input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #374151;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 7px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.url-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.url-input::placeholder {
  color: #d1d5db;
}

.field-hint {
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-hint code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  color: #6b7280;
}

/* 快捷键输入行 */
.keys-row {
  display: flex;
  gap: 8px;
}

.key-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 7px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.key-input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.key-badge-icon {
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  border-right: 1px solid rgba(0,0,0,0.07);
  height: 34px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.key-input {
  flex: 1;
  height: 34px;
  padding: 0 8px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #374151;
  background: transparent;
  border: none;
  outline: none;
}

.key-input::placeholder {
  font-weight: 400;
  color: #d1d5db;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

/* 底部操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
  background: rgba(255,255,255,0.5);
}

.btn-add, .btn-save {
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
}

.btn-add {
  background: rgba(0,0,0,0.05);
  color: #374151;
}

.btn-add:hover {
  background: rgba(0,0,0,0.09);
}

.btn-save {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 1px 4px rgba(37,99,235,0.3);
}

.btn-save:hover {
  background: #1d4ed8;
  box-shadow: 0 2px 8px rgba(37,99,235,0.4);
}

.btn-add:active, .btn-save:active {
  transform: scale(0.97);
}

/* 列表动画 */
.engine-card-enter-active,
.engine-card-leave-active {
  transition: all 0.25s ease;
}

.engine-card-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.engine-card-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .engine-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }

  .engine-card {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.07);
  }

  .engine-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  .engine-name-input {
    color: #f3f4f6;
  }

  .engine-name-input::placeholder { color: #4b5563; }

  .url-input {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
    color: #e5e7eb;
  }

  .url-input::placeholder { color: #4b5563; }

  .field-hint { color: #6b7280; }
  .field-hint code { background: rgba(255,255,255,0.08); color: #9ca3af; }

  .key-input-wrapper {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
  }

  .key-badge-icon {
    color: #6b7280;
    border-right-color: rgba(255,255,255,0.07);
  }

  .key-input { color: #e5e7eb; }
  .key-input::placeholder { color: #4b5563; }

  .action-bar {
    border-top-color: rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
  }

  .btn-add {
    background: rgba(255,255,255,0.07);
    color: #e5e7eb;
  }

  .btn-add:hover {
    background: rgba(255,255,255,0.1);
  }
}
</style>
