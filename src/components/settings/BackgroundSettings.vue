<template>
  <div id="background" class="rounded-r-[12px] p-8">
    <div class="space-y-4">
      <!-- 背景选项组 -->
      <div class="space-y-2">
        <MacCheckbox v-model="wallpaperType" type="radio" value="none" name="background-type"
          :checked="wallpaperType === 'none'" :disabled="isLoading === true">
          <span class="text-sm">不使用壁纸</span>
        </MacCheckbox>

        <MacCheckbox v-model="wallpaperType" type="radio" value="source" name="background-type"
          :checked="wallpaperType === 'source'" :disabled="isLoading === true">
          <span class="text-sm">使用壁纸源</span>
        </MacCheckbox>

        <MacCheckbox v-model="wallpaperType" type="radio" value="custom" name="background-type"
          :checked="wallpaperType === 'custom'" :disabled="isLoading === true">
          <span class="text-sm">自定义背景图片</span>
        </MacCheckbox>

        <MacCheckbox v-model="wallpaperType" type="radio" value="color" name="background-type"
          :checked="wallpaperType === 'color'" :disabled="isLoading === true">
          <span class="text-sm">自定义颜色背景</span>
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
          <MacInput v-model="backgroundUrl" placeholder="请输入图片链接" class="flex-1" @blur="validateAndApplyBackgroundUrl" />
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
            <img :src="getNoCacheImageUrl(wallpaperUrl)"
              class="w-full max-w-[300px] h-[168px] object-cover rounded-lg border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
              alt="当前背景图片" loading="lazy" />
          </div>
        </div>

        <!-- 历史记录功能已移除 -->
      </div>

      <!-- 颜色背景选项 -->
      <div v-if="wallpaperType === 'color'" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-zinc-400 mb-2">
          <span>选择背景颜色</span>
        </p>
        
        <!-- 高级调色盘 -->
        <div class="flex flex-col space-y-4">
          <!-- 色相选择器 -->
          <div class="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm">
            <!-- 色相条 -->
            <div 
              class="absolute top-0 left-0 w-full h-8 cursor-pointer"
              :style="{
                background: `linear-gradient(to right, 
                  #ff0000 0%, 
                  #ffff00 17%, 
                  #00ff00 33%, 
                  #00ffff 50%, 
                  #0000ff 67%, 
                  #ff00ff 83%, 
                  #ff0000 100%)`
              }"
              @click="selectHue($event)"
              @mousedown="startHueDrag"
              ref="hueBar"
            >
              <div 
                class="absolute top-0 h-8 w-4 border-2 border-white shadow-md transform -translate-x-1/2"
                :style="{left: `${huePosition}%`, backgroundColor: hueColor}"
              ></div>
            </div>
            
            <!-- 饱和度/亮度选择器 -->
            <div 
              class="absolute top-10 left-0 right-0 bottom-0 cursor-pointer"
              :style="{
                backgroundColor: hueColor,
                backgroundImage: `
                  linear-gradient(to right, white, transparent),
                  linear-gradient(to bottom, transparent, black)
                `
              }"
              @click="selectSaturationBrightness($event)"
              @mousedown="startSatBrightDrag"
              ref="satBrightnessArea"
            >
              <div 
                class="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2"
                :style="{left: `${saturationPosition}%`, top: `${brightnessPosition}%`}"
              ></div>
            </div>
          </div>
          
          <!-- 颜色预览和输入框 -->
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-lg shadow-md" :style="{backgroundColor: colorInput}"></div>
            <div class="flex-1">
              <input 
                type="text" 
                v-model="colorInput" 
                class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                placeholder="输入颜色代码（例如 #3498db）"
                @blur="validateColorInput"
              />
            </div>
          </div>
          
          <!-- 基础颜色选择器 -->
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="color in presetColors" 
              :key="color" 
              :style="{backgroundColor: color}" 
              class="w-8 h-8 rounded-lg cursor-pointer border-2 transition-all duration-200 shadow-sm hover:shadow-md"
              :class="colorInput === color ? 'border-blue-500 scale-110' : 'border-gray-200 dark:border-zinc-700 hover:scale-105'"
              @click="selectPresetColor(color)"
            ></div>
          </div>
        </div>
        
        <!-- 颜色输入框和预览 -->
        <div class="flex items-center space-x-3 mt-2">
          <div class="flex-1">
            <input 
              type="text" 
              v-model="colorInput" 
              class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              placeholder="输入颜色代码（例如 #3498db）"
              @blur="validateColorInput"
            />
          </div>
          <div class="w-10 h-10 rounded-md" :style="{backgroundColor: colorInput}"></div>
        </div>
        
        <!-- 当前颜色预览 -->
        <div class="mt-4 p-6 rounded-lg shadow-inner" :style="{backgroundColor: colorInput}">
          <p class="text-center font-medium" :class="isDarkColor(colorInput) ? 'text-white' : 'text-gray-800'">
            颜色预览
          </p>
        </div>
      </div>

      <!-- 壁纸源选项 -->
      <div v-if="wallpaperType === 'source'" class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-zinc-400 mb-2">
          <span>使用在线壁纸源，壁纸将定期自动更新</span>
        </p>
        <div class="flex flex-row items-center space-x-2">
          <MacInput v-model="sourceUrlInput" placeholder="请输入壁纸源链接" class="flex-1" @blur="validateAndApplySourceUrl" />
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
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import MacCheckbox from "@/components/ui/MacCheckbox.vue";
import MacInput from "@/components/ui/MacInput.vue";
import MacButton from "@/components/ui/MacButton.vue";
import { storage } from "@/utils/storage";
import COS from "cos-js-sdk-v5";
import { useDebounceFn } from "@vueuse/core";
import { loadImage } from "@/utils/imageCache";

const { success, error } = useNotification();
const {
  wallpaperType,
  wallpaperUrl,
  originalWallpaperUrl, // 添加原始URL变量
  sourceUrl,
  backgroundColor,
  showMask,
  updateWallpaper,
  updateSourceUrl,
  updateBackgroundColor,
  loadState,
  toggleMask
} = useWallpaper();

// 本地状态只用于临时存储
// 使用原始URL而不是缓存的数据URL
const backgroundUrl = ref(originalWallpaperUrl.value || "");
const recentImage = ref("");
const sourceUrlInput = ref(
  sourceUrl.value || "https://picsum.photos/1920/1080"
);
// 设置为null，表示组件初始化中，避免在初始化阶段显示加载状态
const isLoading = ref(null);

// 缓存的图片URL映射
const cachedImages = ref(new Map<string, string>());

// 颜色背景相关状态
const colorInput = ref(backgroundColor.value || '#3498db');

// 调色盘相关状态
const huePosition = ref(50); // 色相位置（百分比）
const saturationPosition = ref(50); // 饱和度位置（百分比）
const brightnessPosition = ref(50); // 亮度位置（百分比）
const hueColor = ref('#ff0000'); // 当前色相的颜色

// 调色盘元素引用
const hueBar = ref(null);
const satBrightnessArea = ref(null);

// 拖动状态
const isDraggingHue = ref(false);
const isDraggingSatBright = ref(false);

// 简化预设颜色，只保留基础颜色
const presetColors = [
  // 基础颜色
  '#ffffff', // 白色
  '#000000', // 黑色
  '#3498db', // 蓝色
  '#2ecc71', // 绿色
  '#e74c3c', // 红色
  '#f39c12', // 橙色
  '#9b59b6', // 紫色
  '#1abc9c', // 青绿色
  '#34495e', // 深蓝色
  '#7f8c8d', // 灰色
  '#2c3e50', // 深灰色
  '#d35400', // 深橙色
  '#c0392b', // 深红色
  '#8e44ad', // 深紫色
  '#16a085', // 深青绿色
  '#27ae60', // 深绿色
  '#f1c40f', // 黄色
  '#ffffff', // 白色
];

// 添加上传状态
const isUploading = ref(false);
const uploadProgress = ref(0);

// 腾讯云COS
const cos = new COS({
  SecretId: "123",
  SecretKey: "123",
});



// 获取原始URL
// 现在我们有originalWallpaperUrl变量，可以直接使用

// 获取图片URL，添加时间戳参数避免缓存
const getNoCacheImageUrl = (url: string): string => {
  if (!url) return '';
  
  let originalUrl = url;
  
  // 如果是数据URL，尝试获取原始URL
  if (url.startsWith('data:')) {
    // 如果是当前壁纸，使用originalWallpaperUrl
    if (url === wallpaperUrl.value && originalWallpaperUrl.value) {
      originalUrl = originalWallpaperUrl.value;
      console.log('当前壁纸使用原始URL:', originalUrl);
    } 
    // 如果是源壁纸，使用源URL
    else if (wallpaperType.value === 'source' && sourceUrl.value) {
      originalUrl = sourceUrl.value;
      console.log('源壁纸使用源URL:', originalUrl);
    } 
    // 如果没有原始URL，使用占位图片
    else {
      console.log('没有找到原始URL，使用占位图片');
      return 'https://via.placeholder.com/300x168?text=Image';
    }
  }
  
  // 添加时间戳参数避免浏览器缓存
  const timestamp = Date.now();
  const separator = originalUrl.includes('?') ? '&' : '?';
  const result = `${originalUrl}${separator}t=${timestamp}`;
  console.log('最终返回的URL:', result);
  return result;
};

// 历史记录功能已移除

// 使用防抖优化壁纸类型切换
const debouncedWatchWallpaperType = useDebounceFn(async (newType: string) => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    if (newType === "custom") {
      // 使用原始URL而不是缓存的数据URL
      backgroundUrl.value = originalWallpaperUrl.value || wallpaperUrl.value;
      // 历史记录功能已移除
    } else if (newType === "source") {
      await updateWallpaper("source", sourceUrl.value);
    } else if (newType === "color") {
      colorInput.value = backgroundColor.value;
      await updateWallpaper("color");
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

// 监听originalWallpaperUrl变化，同步到背景输入框
watch(originalWallpaperUrl, (newUrl) => {
  if (newUrl && wallpaperType.value === 'custom') {
    backgroundUrl.value = newUrl;
  }
});

// 验证并应用背景图片URL
const validateAndApplyBackgroundUrl = async () => {
  if (isLoading.value || !backgroundUrl.value.trim()) return;

  isLoading.value = true;
  try {
    // 清除存储中的旧壁纸信息
    await storage.remove("customWallpaper");
    // 设置新的壁纸，使用原始URL
    const originalUrl = backgroundUrl.value;
    recentImage.value = originalUrl;
    await updateWallpaper("custom", originalUrl);
    success("背景已更新", "新的背景图片已应用");
  } catch (e) {
    error("应用背景失败", e?.toString());
  } finally {
    isLoading.value = false;
  }
};

// 应用背景URL
const applyBackgroundUrl = async () => {
  if (isLoading.value || !backgroundUrl.value) return;

  isLoading.value = true;
  try {
    // 清除存储中的旧壁纸信息
    await storage.remove("customWallpaper");
    // 设置新的壁纸，使用原始URL
    const originalUrl = backgroundUrl.value;
    recentImage.value = originalUrl;
    await updateWallpaper("custom", originalUrl);
    success("背景已更新", "新的背景图片已应用");
  } catch (e) {
    error("应用背景失败", e?.toString());
  } finally {
    isLoading.value = false;
  }
};

// 验证并应用壁纸源
const validateAndApplySourceUrl = async () => {
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
  
  // 计算文件大小（仅用于日志）
  const fileSizeMB = file.size / (1024 * 1024);
  console.log(`上传图片大小: ${fileSizeMB.toFixed(2)}MB`);

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
    
    // 不再限制图片大小，直接使用原始文件上传
    let fileToUpload = file;

    // 上传到腾讯云
    cos.putObject(
      {
        Bucket: "ba-1324114126",
        Region: "ap-guangzhou",
        Key: `wallpapers/${Date.now()}_${file.name}`,
        StorageClass: "STANDARD",
        Body: fileToUpload,
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
            // 更新壁纸 (会自动缓存图片)
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



// 压缩图片文件
const compressImageFile = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }
        
        // 设置canvas尺寸，保持原始宽高比
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('无法创建Blob'));
            return;
          }
          // 创建新的File对象
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.7); // 压缩质量0.7
      };
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
  });
};

// 获取缓存的图片URL
const getCachedImageUrl = (url: string): string => {
  // 如果没有URL或URL为空，返回空字符串
  if (!url) return '';
  
  // 如果是数据URL，直接返回
  if (url.startsWith('data:')) return url;
  
  // 如果已经有缓存，直接返回
  if (cachedImages.value.has(url)) {
    return cachedImages.value.get(url) || url;
  }
  
  // 否则异步加载并缓存图片，但不阻塞当前渲染
  setTimeout(() => {
    if (!cachedImages.value.has(url)) {
      loadImage(url).then(cachedUrl => {
        cachedImages.value.set(url, cachedUrl);
      }).catch(err => {
        console.error('加载缓存图片失败:', err);
      });
    }
  }, 0);
  
  // 在缓存加载完成前先返回原始URL
  return url;
};

// 判断颜色是否为深色，用于决定文字颜色
const isDarkColor = (color: string): boolean => {
  // 将十六进制颜色转换为RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 计算亮度（使用感知亮度公式）
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // 如果亮度小于128，认为是深色
  return brightness < 128;
};

// 选择预设颜色
const selectPresetColor = (color: string) => {
  colorInput.value = color;
  updateColorFromHex(color);
  validateColorInput();
};

// 验证颜色输入
const validateColorInput = () => {
  // 验证颜色格式
  const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!colorRegex.test(colorInput.value)) {
    // 如果不是有效的十六进制颜色，重置为默认值
    error('颜色格式错误', '请输入有效的十六进制颜色代码（例如 #3498db）');
    colorInput.value = backgroundColor.value || '#3498db';
    updateColorFromHex(colorInput.value);
    return;
  }
  
  // 更新背景颜色
  updateBackgroundColor(colorInput.value);
  updateColorFromHex(colorInput.value);
};

// 调色盘相关函数

// 选择色相
const selectHue = (event: MouseEvent) => {
  if (!hueBar.value) return;
  
  const rect = hueBar.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;
  
  // 计算百分比位置
  const position = Math.max(0, Math.min(100, (x / width) * 100));
  huePosition.value = position;
  
  // 更新色相颜色
  updateHueColor();
  
  // 更新最终颜色
  updateFinalColor();
};

// 选择饱和度和亮度
const selectSaturationBrightness = (event: MouseEvent) => {
  if (!satBrightnessArea.value) return;
  
  const rect = satBrightnessArea.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const width = rect.width;
  const height = rect.height;
  
  // 计算百分比位置
  const satPosition = Math.max(0, Math.min(100, (x / width) * 100));
  const brightPosition = Math.max(0, Math.min(100, (y / height) * 100));
  
  saturationPosition.value = satPosition;
  brightnessPosition.value = brightPosition;
  
  // 更新最终颜色
  updateFinalColor();
};

// 开始拖动色相
const startHueDrag = (event: MouseEvent) => {
  isDraggingHue.value = true;
  selectHue(event);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingHue.value) {
      selectHue(e);
    }
  };
  
  const handleMouseUp = () => {
    isDraggingHue.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 开始拖动饱和度/亮度
const startSatBrightDrag = (event: MouseEvent) => {
  isDraggingSatBright.value = true;
  selectSaturationBrightness(event);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingSatBright.value) {
      selectSaturationBrightness(e);
    }
  };
  
  const handleMouseUp = () => {
    isDraggingSatBright.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 更新色相颜色
const updateHueColor = () => {
  // 根据色相位置计算RGB颜色
  const hue = (huePosition.value / 100) * 360;
  hueColor.value = hslToHex(hue, 100, 50);
};

// 更新最终颜色
const updateFinalColor = () => {
  // 根据色相、饱和度和亮度计算最终颜色
  const hue = (huePosition.value / 100) * 360;
  const saturation = saturationPosition.value;
  const brightness = 100 - brightnessPosition.value; // 亮度是从上到下递减的
  
  // 转换为十六进制颜色
  colorInput.value = hslToHex(hue, saturation, brightness);
  
  // 更新背景颜色
  updateBackgroundColor(colorInput.value);
};

// 从十六进制颜色更新调色盘状态
const updateColorFromHex = (hexColor: string) => {
  // 将十六进制颜色转换为HSL
  const hsl = hexToHsl(hexColor);
  
  // 更新调色盘状态
  huePosition.value = (hsl.h / 360) * 100;
  saturationPosition.value = hsl.s;
  brightnessPosition.value = 100 - hsl.l; // 亮度是从上到下递减的
  
  // 更新色相颜色
  updateHueColor();
};

// HSL转十六进制颜色
const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  // 转换为十六进制
  const toHex = (c: number): string => {
    const hex = Math.round((c + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// 十六进制颜色转换为HSL
const hexToHsl = (hex: string): {h: number, s: number, l: number} => {
  // 将十六进制颜色转换为RGB
  let r, g, b;
  
  // 处理缩写形式 #RGB
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255;
    g = parseInt(hex[2] + hex[2], 16) / 255;
    b = parseInt(hex[3] + hex[3], 16) / 255;
  } else {
    // 处理完整形式 #RRGGBB
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }
  
  // 计算HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
};



// 组件挂载时加载状态
onMounted(async () => {
  // 静默加载状态，不显示加载动画
  await loadState();

  // 根据当前壁纸类型设置相应的状态
  if (wallpaperType.value === "custom") {
    // 如果是自定义背景，使用原始URL而不是缓存的数据URL
    backgroundUrl.value = originalWallpaperUrl.value || wallpaperUrl.value;
    console.log('初始化背景URL:', backgroundUrl.value);
    recentImage.value = wallpaperUrl.value;
  } else if (wallpaperType.value === "source") {
    // 如果是壁纸源，同步源URL到输入框
    sourceUrlInput.value = sourceUrl.value || "https://picsum.photos/1920/1080";
    sourceInterval.value = sourceRefreshInterval.value || 30;
  } else if (wallpaperType.value === "color") {
    // 如果是颜色背景，同步颜色到输入框
    colorInput.value = backgroundColor.value || "#3498db";
    // 初始化调色盘状态
    updateColorFromHex(colorInput.value);
  }

  // 初始化完成后，将isLoading设置为false
  isLoading.value = false;
});

// 监听壁纸类型变化
watch(wallpaperType, async (newType) => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    await updateWallpaper(newType);
    success('背景类型已更新', `已切换至${{
      'none': '无背景',
      'source': '壁纸源',
      'custom': '自定义背景',
      'color': '颜色背景'
    }[newType] || '新的背景类型'}`);
  } catch (e) {
    error('更新背景类型失败', e?.toString());
  } finally {
    isLoading.value = false;
  }
});

// 监听颜色输入变化
watch(colorInput, async (newValue) => {
  // 验证颜色格式
  const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!colorRegex.test(newValue)) {
    return; // 如果不是有效的颜色格式，不进行更新
  }

  if (isLoading.value || newValue === backgroundColor.value) return;

  isLoading.value = true;
  try {
    // 更新背景颜色
    await updateBackgroundColor(newValue);

    // 如果当前是颜色背景类型，更新壁纸
    if (wallpaperType.value === 'color') {
      await updateWallpaper('color');
    }

    success('背景颜色已更新', '新的背景颜色已应用');
  } catch (e) {
    error('应用背景颜色失败', e?.toString());
    // 如果出错，还原设置
    colorInput.value = backgroundColor.value;
  } finally {
    isLoading.value = false;
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