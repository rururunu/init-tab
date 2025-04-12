<template>
    <div id="background" class="rounded-r-[12px] p-8">
        <div class="space-y-4">
            <!-- 背景选项组 -->
            <div class="space-y-2">
                <MacCheckbox
                    v-model="wallpaperType"
                    value="none"
                    name="background-type"
                    :checked="wallpaperType === 'none'"
                >
                    不使用壁纸
                </MacCheckbox>

                <MacCheckbox
                    v-model="wallpaperType"
                    value="source"
                    name="background-type"
                    :checked="wallpaperType === 'source'"
                >
                    使用壁纸源
                </MacCheckbox>

                <MacCheckbox
                    v-model="wallpaperType"
                    value="custom"
                    name="background-type"
                    :checked="wallpaperType === 'custom'"
                >
                    自定义背景
                </MacCheckbox>
            </div>

            <!-- 自定义背景选项 -->
            <div v-if="wallpaperType === 'custom'" class="space-y-3">
                <div class="flex flex-row items-center space-x-2">
                    <MacInput
                        v-model="backgroundUrl"
                        placeholder="请输入图片url"
                        class="flex-1"
                    />
                    <MacButton
                        @click="handleUploadClick"
                        icon="material-symbols:upload"
                    >
                        上传
                    </MacButton>
                    <input 
                        type="file" 
                        @change="fileUp" 
                        id="fileInput" 
                        class="hidden"
                        accept=".jpg,.png,.jpeg,.gif,.webp,.mp4"
                    >
                </div>

                <!-- 图片预览部分 -->
                <div v-if="recentImage" class="mt-4">
                    <p class="text-sm text-gray-600 dark:text-zinc-400 mb-2">最近上传的图片：</p>
                    <div class="relative group">
                        <img 
                            :src="recentImage"
                            class="w-full max-w-[300px] h-[168px] object-cover rounded-lg border border-gray-200 dark:border-zinc-700"
                            alt="最近上传的背景图片"
                        />
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                            <MacButton
                                @click="applyBackground"
                                class="!bg-white/90 hover:!bg-white text-gray-900"
                            >
                                应用为背景
                            </MacButton>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 壁纸源选项 -->
            <div v-if="wallpaperType === 'source'" class="space-y-3">
                <p class="text-sm text-gray-600 dark:text-zinc-400 mb-2">
                    使用在线壁纸源，壁纸将定期自动更新
                </p>
                <div class="flex flex-row items-center space-x-2">
                    <MacInput
                        v-model="sourceUrlInput"
                        placeholder="请输入壁纸源URL"
                        class="flex-1"
                    />
                    <MacButton
                        @click="applySourceUrl"
                        icon="material-symbols:check"
                    >
                        应用
                    </MacButton>
                </div>
                <div class="text-xs text-gray-500 dark:text-zinc-500">
                    默认使用 Picsum 随机图片服务
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { Icon } from "@iconify/vue";
import { useNotification } from '@/composables/useNotification';
import { useWallpaper } from '@/composables/useWallpaper';
import { ref, watch, onMounted, onUnmounted } from 'vue';
import MacCheckbox from '@/components/ui/MacCheckbox.vue';
import MacInput from '@/components/ui/MacInput.vue';
import MacButton from '@/components/ui/MacButton.vue';
import { storage } from '@/utils/storage';

const { success, error } = useNotification();
const { wallpaperType, wallpaperUrl, sourceUrl, updateWallpaper, updateSourceUrl, loadState } = useWallpaper();

// 本地状态只用于临时存储
const backgroundUrl = ref('');
const recentImage = ref('');
const sourceUrlInput = ref(sourceUrl.value || 'https://picsum.photos/1920/1080');

// 监听壁纸类型变化
watch(wallpaperType, async (newType) => {
    if (newType === 'custom') {
        // 如果切换到自定义背景，使用当前的背景URL
        backgroundUrl.value = wallpaperUrl.value;
    } else if (newType === 'source') {
        // 如果切换到壁纸源，使用源URL
        await updateWallpaper('source', sourceUrl.value);
    } else {
        // 如果切换到不使用壁纸，清除URL
        backgroundUrl.value = '';
        await updateWallpaper('none');
    }
});

// 监听sourceUrl变化，同步到本地输入框
watch(sourceUrl, (newUrl) => {
  if (newUrl) {
    sourceUrlInput.value = newUrl;
  }
});

// 应用背景
const applyBackground = async () => {
    if (recentImage.value) {
        try {
            backgroundUrl.value = recentImage.value;
            await updateWallpaper('custom', recentImage.value);
            success('背景已更新', '新的背景图片已应用');
        } catch (e) {
            error('应用背景失败', e?.toString());
        }
    }
};

// 应用壁纸源
const applySourceUrl = async () => {
    try {
        // 确保URL不为空，如果为空则使用默认的随机图片服务
        if (!sourceUrlInput.value.trim()) {
            sourceUrlInput.value = 'https://picsum.photos/1920/1080';
        }
        
        await updateSourceUrl(sourceUrlInput.value);
        if (wallpaperType.value === 'source') {
            await updateWallpaper('source');
        }
        success('壁纸源已更新', '新的壁纸源已应用');
    } catch (e) {
        error('更新壁纸源失败', e?.toString());
    }
};

const handleUploadClick = () => {
    document.getElementById('fileInput')?.click();
};

const fileUp = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        error('上传失败', '请选择图片文件');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (e.target?.result) {
                // 将图片数据转换为 base64 格式
                const base64Data = e.target.result as string;
                recentImage.value = base64Data;
                
                // 保存到存储
                await storage.set('customWallpaper', base64Data);
                
                // 应用为背景
                await updateWallpaper('custom', base64Data);
                success('上传成功', '图片已保存并应用为背景');
            }
        };
        reader.readAsDataURL(file);
    } catch (e) {
        error('文件处理失败', e?.toString());
        recentImage.value = '';
    }
};

// 组件挂载时加载状态
onMounted(async () => {
    await loadState();
    // 如果是自定义背景，从存储中加载图片
    if (wallpaperType.value === 'custom') {
        const savedImage = await storage.get('customWallpaper') as string;
        if (savedImage) {
            recentImage.value = savedImage;
            backgroundUrl.value = savedImage;
        }
    }
});

// 组件卸载时清理
onUnmounted(() => {
    if (recentImage.value && recentImage.value.startsWith('blob:')) {
        URL.revokeObjectURL(recentImage.value);
    }
});
</script>

<style scoped>
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}

/* 确保禁用状态的样式正确应用 */
input:disabled, button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
    input:disabled, button:disabled {
        background-color: rgb(39, 39, 42);
    }
}

/* 确保复选框可以正常点击 */
input[type="checkbox"] {
    cursor: pointer;
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    margin: 0;
    padding: 0;
}

/* 添加图片预览相关样式 */
.group:hover button {
    transform: scale(1.05);
}

button {
    transition: all 0.2s ease;
}
</style>