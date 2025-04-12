<template>
    <div id="search-engine" class="rounded-r-[12px] p-8">
        <div class="space-y-6">
            <!-- 标题部分 -->
            <div class="space-y-1">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">搜索引擎设置</h3>
                <p class="text-sm text-gray-500 dark:text-zinc-400">
                    管理您的搜索引擎快捷方式
                </p>
            </div>

            <!-- 搜索引擎列表 -->
            <div class="space-y-4">
                <div v-for="(engine, index) in jumpData" :key="index"
                    class="p-5 bg-white/50 dark:bg-zinc-800/50 rounded-xl border border-gray-200/50 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div class="flex flex-col space-y-4">
                        <!-- 名称和删除按钮 -->
                        <div class="flex items-center justify-between">
                            <MacInput v-model="engine.label" placeholder="搜索引擎名称" class="flex-1 max-w-[200px]" />
                            <MacButton @click="removeEngine(index)" icon="material-symbols:delete-outline"
                                class="!bg-transparent hover:!bg-red-500/10 !text-red-500 hover:!text-red-600">
                                删除
                            </MacButton>
                        </div>

                        <!-- URL输入 -->
                        <div class="flex items-center">
                            <MacInput v-model="engine.jumpUrl" placeholder="搜索URL" class="flex-1" />
                        </div>

                        <!-- 快捷键输入 -->
                        <div class="flex items-center space-x-3">
                            <MacInput v-model="engine.key[0]" placeholder="主要快捷键" class="flex-1" />
                            <MacInput v-model="engine.key[1]" placeholder="备用快捷键" class="flex-1" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex items-center justify-end space-x-3 mt-6">
                <!-- 添加新搜索引擎按钮 -->
                <MacButton @click="addNewEngine" icon="material-symbols:add"
                    class="!bg-gray-100 hover:!bg-gray-200 !text-gray-700 dark:!bg-zinc-700 dark:hover:!bg-zinc-600 dark:!text-gray-200 flex items-center space-x-1.5">
                    <span>添加新搜索引擎</span>
                </MacButton>

                <!-- 保存按钮 -->
                <MacButton @click="saveEngines" icon="material-symbols:save"
                    class="!bg-blue-500 hover:!bg-blue-600 !text-white shadow-sm hover:shadow-md flex items-center space-x-1.5">
                    <span>保存设置</span>
                </MacButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MacInput from '@/components/ui/MacInput.vue';
import MacButton from '@/components/ui/MacButton.vue';
import { useNotification } from '@/composables/useNotification';
import { storage } from '@/utils/storage';

const { success, error } = useNotification();

// 定义搜索引擎数据类型
interface JumpData {
    key: string[];
    label: string;
    jumpUrl: string;
}

// 响应式搜索引擎数据
const jumpData = ref<JumpData[]>([]);

// 加载保存的搜索引擎数据
const loadEngines = async () => {
    try {
        const savedEngines = await storage.get('jumpData');
        jumpData.value = JSON.parse(savedEngines as any);
    } catch (e) {
        console.error('Failed to load engines:', e);
    }
};

// 保存搜索引擎数据
const saveEngines = async () => {
    try {
        await storage.set('jumpData', JSON.stringify(jumpData.value));
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                action: 'UPDATE_JUMP_DATA',
                data: jumpData.value
            });
        }

        success('保存成功', '搜索引擎设置已更新');
    } catch (e) {
        error('保存失败', e?.toString());
    }
};

// 添加新搜索引擎
const addNewEngine = () => {
    jumpData.value.push({
        key: ['', ''],
        label: '',
        jumpUrl: ''
    });
};

// 删除搜索引擎
const removeEngine = (index: number) => {
    jumpData.value.splice(index, 1);
};

// 组件挂载时加载数据
onMounted(() => {
    loadEngines();
});
</script>

<style scoped>
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}

/* 自定义滚动条样式 */
#search-engine {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

#search-engine::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

#search-engine::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
}

#search-engine::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    transition: background-color 0.2s ease;
}

#search-engine::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

/* 暗色模式下的滚动条样式 */
@media (prefers-color-scheme: dark) {
    #search-engine {
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    #search-engine::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
    }

    #search-engine::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.3);
    }
}

/* 输入框和按钮的悬停效果 */
:deep(.mac-input),
:deep(.mac-button) {
    transition: all 0.2s ease;
}

:deep(.mac-input:hover),
:deep(.mac-button:hover) {
    transform: translateY(-1px);
}

/* 卡片悬停效果 */
.bg-white\/50:hover,
.bg-zinc-800\/50:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 按钮悬停效果 */
:deep(.mac-button) {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    line-height: 1.25rem;
    border: none;
}

:deep(.mac-button:hover) {
    transform: translateY(-1px);
}

/* 灰色按钮样式 */
:deep(.mac-button.bg-gray-100) {
    background-color: rgb(243, 244, 246) !important;
    color: rgb(55, 65, 81) !important;
}

:deep(.mac-button.bg-gray-100:hover) {
    background-color: rgb(229, 231, 235) !important;
}

/* 蓝色按钮样式 */
:deep(.mac-button.bg-blue-500) {
    background-color: rgb(59, 130, 246) !important;
    color: white !important;
}

:deep(.mac-button.bg-blue-500:hover) {
    background-color: rgb(37, 99, 235) !important;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

/* 按钮图标样式 */
:deep(.mac-button .iconify) {
    transition: transform 0.2s ease;
}

:deep(.mac-button:hover .iconify) {
    transform: scale(1.1);
}

/* 暗色模式下的按钮样式 */
@media (prefers-color-scheme: dark) {
    :deep(.mac-button.bg-gray-100) {
        background-color: rgb(63, 63, 70) !important;
        color: rgb(228, 228, 231) !important;
    }

    :deep(.mac-button.bg-gray-100:hover) {
        background-color: rgb(82, 82, 91) !important;
    }

    :deep(.mac-button.bg-blue-500) {
        background-color: rgb(59, 130, 246) !important;
    }

    :deep(.mac-button.bg-blue-500:hover) {
        background-color: rgb(37, 99, 235) !important;
        box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2);
    }
}
</style>