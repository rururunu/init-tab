<template>
  <div id="background" class="rounded-r-[12px] p-8">
    <div class="space-y-4">
      <!-- 背景选项组 -->
      <div class="space-y-2">
        <MacCheckbox v-model="wallpaperType" type="radio" value="none" name="background-type"
          :checked="wallpaperType === 'none'" :disabled="isLoading">
          <span class="text-sm">不使用壁纸</span>
        </MacCheckbox>

        <MacCheckbox v-model="wallpaperType" type="radio" value="source" name="background-type"
          :checked="wallpaperType === 'source'" :disabled="isLoading">
          <span class="text-sm">使用壁纸源</span>
        </MacCheckbox>

        <MacCheckbox v-model="wallpaperType" type="radio" value="custom" name="background-type"
          :checked="wallpaperType === 'custom'" :disabled="isLoading">
          <span class="text-sm">自定义背景</span>
        </MacCheckbox>

        <!-- 添加蒙版控制选项 -->
        <div v-if="wallpaperType !== 'none'" class="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <MacCheckbox type="checkbox" :checked="showMask" @update:checked="toggleMask">
            <span class="text-sm">显示背景遮罩</span>
          </MacCheckbox>
          <p class="text-xs text-gray-500 dark:text-zinc-500 mt-1 ml-7">
            遮罩可以改善文字在背景上的可读性
          </p>
        </div>
      </div>

      <!-- 自定义背景选项 -->
      <div v-if="wallpaperType === 'custom'" class="space-y-3">
        <div class="flex flex-row items-center space-x-2">
          <MacInput v-model="backgroundUrl" placeholder="请输入图片链接" class="flex-1" />
          <MacButton @click="applyBackgroundUrl" class="p-2" icon="line-md:circle-twotone-to-confirm-circle-transition">
            应用
          </MacButton>
          <MacButton @click="handleUploadClick" class="p-2" icon="material-symbols:upload">
            上传
          </MacButton>
          <input type="file" @change="fileUp" id="fileInput" class="hidden" accept=".jpg,.png,.jpeg,.gif,.webp,.mp4" />
        </div>

        <!-- 上传加载动画 -->
        <Transition enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in" leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0">
          <div v-if="isUploading"
            class="mt-4 p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <div class="flex items-center space-x-3">
              <div class="loading-spinner"></div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  <span>正在上传图片...</span>
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  上传进度：{{ Math.floor(uploadProgress) }}%
                </p>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 当前背景预览 -->
        <div v-if="recentImage || backgroundUrl" class="mt-4">
          <p class="text-sm text-gray-600 dark:text-zinc-400 mb-2">
            <span>当前背景：</span>
          </p>
          <div class="relative group">
            <img :src="wallpaperUrl"
              class="w-full max-w-[300px] h-[168px] object-cover rounded-lg border-2 border-transparent transition-all duration-300"
              :class="{'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]': true}"
              alt="当前背景图片" />
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="historyList.filter(item => item.url !== wallpaperUrl).length > 0" class="mt-4">
          <p class="text-sm text-gray-600 dark:text-zinc-400 mb-2">
            <span>历史记录：</span>
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="item in historyList.filter(item => item.url !== wallpaperUrl)" :key="item.url" class="relative group">
              <!-- 图片容器 -->
              <div class="relative overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-700">
                <img :src="item.url"
                  class="w-full h-[120px] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  alt="历史背景图片" @click="() => {
                    switchFromHistory(item.url);
                    recentImage = item.url;
                    backgroundUrl = item.url;
                  }" />
                
                <!-- 删除按钮 -->
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button @click.stop="removeFromHistory(item.url)" 
                    class="flex items-center justify-center text-red-400 hover:text-red-500 backdrop-blur-sm bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 overflow-hidden">
                    <span class="w-6 h-6 flex items-center justify-center text-base">×</span>
                    <span class="w-0 group-hover:w-16 transition-all duration-200 whitespace-nowrap overflow-hidden text-xs px-1">
                      删除壁纸
                    </span>
                  </button>
                </div>
                
                <!-- 日期标签 -->
                <div class="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                  {{ new Date(item.timestamp).toLocaleDateString('zh-CN') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 壁纸源选项 -->
      <div v-if="wallpaperType === 'source'" class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-zinc-400 mb-2">
          <span>使用在线壁纸源，壁纸将定期自动更新</span>
        </p>
        <div class="flex flex-row items-center space-x-2">
          <MacInput v-model="sourceUrlInput" placeholder="请输入壁纸源链接" class="flex-1" />
          <MacButton @click="applySourceUrl" class="p-2" icon="line-md:circle-twotone-to-confirm-circle-transition">
            应用
          </MacButton>
        </div>
        <div class="text-xs text-gray-500 dark:text-zinc-500 ml-7">
          默认使用随机图片服务
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { useNotification } from "@/composables/useNotification";
import { useWallpaper } from "@/composables/useWallpaper";
import { ref, watch, onMounted, onUnmounted } from "vue";
import MacCheckbox from "@/components/ui/MacCheckbox.vue";
import MacInput from "@/components/ui/MacInput.vue";
import MacButton from "@/components/ui/MacButton.vue";
import { storage } from "@/utils/storage";
import COS from "cos-js-sdk-v5";
import { useDebounceFn } from "@vueuse/core";

const { success, error } = useNotification();
const {
  wallpaperType,
  wallpaperUrl,
  sourceUrl,
  showMask,
  historyList,
  updateWallpaper,
  updateSourceUrl,
  loadState,
  toggleMask,
  removeFromHistory,
  switchFromHistory
} = useWallpaper();

// 本地状态只用于临时存储
const backgroundUrl = ref("");
const recentImage = ref("");
const sourceUrlInput = ref(
  sourceUrl.value || "https://picsum.photos/1920/1080"
);
const isLoading = ref(false);

// 添加上传状态
const isUploading = ref(false);
const uploadProgress = ref(0);

// 腾讯云COS
const cos = new COS({
  SecretId: "123",
  SecretKey: "123",
});

// 使用防抖优化壁纸类型切换
const debouncedWatchWallpaperType = useDebounceFn(async (newType: string) => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    if (newType === "custom") {
      backgroundUrl.value = wallpaperUrl.value;
      // 确保 historyList 是一个数组
      if (!Array.isArray(historyList.value)) {
        historyList.value = []; // 或者根据需要初始化
      }
    } else if (newType === "source") {
      await updateWallpaper("source", sourceUrl.value);
    } else {
      backgroundUrl.value = "";
      await updateWallpaper("none");
    }
  } catch (e) {
    error("切换背景失败", e?.toString());
  } finally {
    isLoading.value = false;
  }
}, 300);

// 监听壁纸类型变化
watch(wallpaperType, debouncedWatchWallpaperType);

// 监听sourceUrl变化，同步到本地输入框
watch(sourceUrl, (newUrl) => {
  if (newUrl) {
    sourceUrlInput.value = newUrl;
  }
});

// 应用背景URL
const applyBackgroundUrl = async () => {
  if (isLoading.value || !backgroundUrl.value) return;

  isLoading.value = true;
  try {
    // 清除存储中的旧壁纸信息
    await storage.remove("customWallpaper");
    // 设置新的壁纸
    recentImage.value = backgroundUrl.value;
    await updateWallpaper("custom", backgroundUrl.value);
    success("背景已更新", "新的背景图片已应用");
  } catch (e) {
    error("应用背景失败", e?.toString());
  } finally {
    isLoading.value = false;
  }
};

// 应用壁纸源
const applySourceUrl = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    // 确保URL不为空，如果为空则使用默认的随机图片服务
    if (!sourceUrlInput.value.trim()) {
      sourceUrlInput.value = "https://picsum.photos/1920/1080";
    }
    await updateSourceUrl(sourceUrlInput.value);
    if (wallpaperType.value === "source") {
      await updateWallpaper("source");
    }
    success("壁纸源已更新", "新的壁纸源已应用");
  } catch (e) {
    error("更新壁纸源失败", e?.toString());
  } finally {
    isLoading.value = false;
  }
};

const handleUploadClick = () => {
  document.getElementById("fileInput")?.click();
};

const fileUp = async (event: any) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    error('上传失败', '请选择图片文件');
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  let progressInterval: number | undefined;

  try {
    // 模拟上传进度
    progressInterval = window.setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value = Math.min(90, uploadProgress.value + Math.floor(Math.random() * 10));
      }
    }, 200);

    // 上传到腾讯云
    cos.putObject(
      {
        Bucket: "ba-1324114126",
        Region: "ap-guangzhou",
        Key: `wallpapers/${Date.now()}_${file.name}`,
        StorageClass: "STANDARD",
        Body: file,
      },
      async (err, data) => {
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        if (err) {
          isUploading.value = false;
          uploadProgress.value = 0;
          error('上传失败', err.message || '上传文件失败');
          return;
        }

        if (data.statusCode === 200 && data.Location) {
          const url = "https://" + data.Location;
          try {
            // 更新本地状态
            recentImage.value = url;
            backgroundUrl.value = url;
            // 更新壁纸
            await updateWallpaper('custom', url);
            
            // 完成上传
            uploadProgress.value = 100;
            setTimeout(() => {
              isUploading.value = false;
              uploadProgress.value = 0;
            }, 500);
            
            success('上传成功', '新的背景图片已应用');
          } catch (storageError) {
            isUploading.value = false;
            uploadProgress.value = 0;
            error('上传失败', '保存图片URL失败，请重试');
          }
        } else {
          isUploading.value = false;
          uploadProgress.value = 0;
          error('上传失败', '上传文件失败');
        }
      }
    );
  } catch (e) {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    isUploading.value = false;
    uploadProgress.value = 0;
    error('上传失败', e?.toString() || '未知错误，请重试');
  }
};

// 组件挂载时加载状态
onMounted(async () => {
  await loadState();

  // 根据当前壁纸类型设置相应的状态
  if (wallpaperType.value === "custom") {
    // 如果是自定义背景，使用当前的壁纸URL
    backgroundUrl.value = wallpaperUrl.value;
    recentImage.value = wallpaperUrl.value;
  } else if (wallpaperType.value === "source") {
    // 如果是壁纸源，同步源URL到输入框
    sourceUrlInput.value = sourceUrl.value || "https://picsum.photos/1920/1080";
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (recentImage.value && recentImage.value.startsWith("blob:")) {
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
input:disabled,
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {

  input:disabled,
  button:disabled {
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

/* 添加加载动画样式 */
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #006bdf;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .loading-spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-top-color: #60a5fa;
  }
}
</style>