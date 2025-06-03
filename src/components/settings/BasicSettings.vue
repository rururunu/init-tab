<template>
  <div id="basic" class="rounded-r-[12px] p-8">
    <div class="space-y-6">
      <!-- 时间显示设置 -->
      <div class="space-y-2 pb-4 border-b border-gray-200 dark:border-zinc-700">
        <h3 class="text-sm font-medium mb-2">时间显示设置</h3>
        <p class="text-xs text-gray-600 dark:text-zinc-400 mb-3">
          自定义时间和日期的显示方式
        </p>
        
        <div class="flex flex-col space-y-3">
          <div class="flex items-center">
            <input 
              type="checkbox" 
              id="show-time" 
              v-model="showTimeValue"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label for="show-time" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              显示时间
            </label>
          </div>

          <div class="flex items-center ml-7" :class="{ 'opacity-50': !showTimeValue }">
            <input 
              type="checkbox" 
              id="show-seconds" 
              v-model="showSecondsValue"
              :disabled="!showTimeValue"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label for="show-seconds" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              显示秒数
            </label>
          </div>
          
          <div class="flex items-center ml-7" :class="{ 'opacity-50': !showTimeValue }">
            <input 
              type="checkbox" 
              id="use-24-hour" 
              v-model="use24HourValue"
              :disabled="!showTimeValue"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label for="use-24-hour" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              使用24小时制
            </label>
          </div>
          
          <div class="flex items-center">
            <input 
              type="checkbox" 
              id="show-date" 
              v-model="showDateValue"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label for="show-date" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              显示日期
            </label>
          </div>
        </div>
      </div>
            <!-- 主色调设置 -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium mb-2">主色调设置</h3>
        <p class="text-xs text-gray-600 dark:text-zinc-400 mb-3">
          设置时间和图标的颜色
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
              @click="selectThemeHue($event)"
              @mousedown="startThemeHueDrag"
              ref="themeHueBar"
            >
              <div 
                class="absolute top-0 h-8 w-4 border-2 border-white shadow-md transform -translate-x-1/2"
                :style="{left: `${themeHuePosition}%`, backgroundColor: themeHueColor}"
              ></div>
            </div>
            
            <!-- 饱和度/亮度选择器 -->
            <div 
              class="absolute top-10 left-0 right-0 bottom-0 cursor-pointer"
              :style="{
                backgroundColor: themeHueColor,
                backgroundImage: `
                  linear-gradient(to right, white, transparent),
                  linear-gradient(to bottom, transparent, black)
                `
              }"
              @click="selectThemeSaturationBrightness($event)"
              @mousedown="startThemeSatBrightDrag"
              ref="themeSatBrightnessArea"
            >
              <div 
                class="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2"
                :style="{left: `${themeSaturationPosition}%`, top: `${themeBrightnessPosition}%`}"
              ></div>
            </div>
          </div>
          
          <!-- 颜色预览和输入框 -->
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-lg shadow-md" :style="{backgroundColor: themeColorInput}"></div>
            <div class="flex-1">
              <input 
                type="text" 
                v-model="themeColorInput" 
                class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                placeholder="输入颜色代码（例如 #495057）"
                @blur="validateAndApplyThemeColor"
              />
            </div>
          </div>
          
          <!-- 基础颜色选择器 -->
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="color in presetColors" 
              :key="'theme-' + color" 
              :style="{backgroundColor: color}" 
              class="w-8 h-8 rounded-lg cursor-pointer border-2 transition-all duration-200 shadow-sm hover:shadow-md"
              :class="themeColorInput === color ? 'border-blue-500 scale-110' : 'border-gray-200 dark:border-zinc-700 hover:scale-105'"
              @click="selectThemePresetColor(color)"
            ></div>
          </div>
        </div>
        
        <!-- 当前效果预览 -->
        <div class="mt-4 p-4 rounded-lg bg-white/10 dark:bg-zinc-800/30 backdrop-blur-sm border border-gray-200 dark:border-zinc-700">
          <p class="text-center font-medium mb-2">效果预览</p>
          <div class="flex justify-center items-center gap-4">
            <div class="text-4xl font-bold" :style="{ color: themeColorInput }">12:34</div>
            <div class="text-2xl" :style="{ color: themeColorInput }">
              <Icon icon="line-md:cog-filled" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 其他基础设置可以在这里添加 -->
      
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, watch } from "vue";
import { useNotification } from "@/composables/useNotification";
import { useWallpaper } from "@/composables/useWallpaper";
import { Icon } from "@iconify/vue";

const { success, error } = useNotification();
const { themeColor, showTime, showSeconds, showDate, use24Hour, updateThemeColor, updateShowTime, updateShowSeconds, updateShowDate, updateUse24Hour, loadState } = useWallpaper();

// 主色调相关状态
const themeColorInput = ref(themeColor.value || '#495057');

// 调色盘相关状态
const themeHuePosition = ref(50); // 色相位置（百分比）
const themeSaturationPosition = ref(50); // 饱和度位置（百分比）
const themeBrightnessPosition = ref(50); // 亮度位置（百分比）
const themeHueColor = ref('#ff0000'); // 当前色相的颜色

// 调色盘元素引用
const themeHueBar = ref(null);
const themeSatBrightnessArea = ref(null);

// 拖动状态
const isDraggingThemeHue = ref(false);
const isDraggingThemeSatBright = ref(false);
const isLoading = ref(false);

// 时间显示设置相关状态
const showTimeValue = ref(showTime.value);
const showSecondsValue = ref(showSeconds.value);
const showDateValue = ref(showDate.value);
const use24HourValue = ref(use24Hour.value);

// 判断颜色是否为深色，用于决定文字颜色
// 计算颜色的亮度，如果亮度小于128，则认为是深色
const isDarkColor = (color: string): boolean => {
  // 验证颜色格式
  const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!colorRegex.test(color)) return false;
  
  // 将颜色转换为RGB
  let r, g, b;
  if (color.length === 4) {
    // #RGB
    r = parseInt(color[1] + color[1], 16);
    g = parseInt(color[2] + color[2], 16);
    b = parseInt(color[3] + color[3], 16);
  } else {
    // #RRGGBB
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  }
  
  // 计算亮度 (YIQ公式)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq < 128; // 如果亮度小于128，认为是深色
};

// 验证并应用主色调
const validateAndApplyThemeColor = () => {
  // 验证颜色格式
  const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!colorRegex.test(themeColorInput.value)) {
    // 如果不是有效的十六进制颜色，重置为默认值
    error('颜色格式错误', '请输入有效的十六进制颜色代码（例如 #495057）');
    themeColorInput.value = themeColor.value || '#495057';
    updateThemeColorFromHex(themeColorInput.value);
    return;
  }
  
  // 更新主色调
  updateThemeColor(themeColorInput.value);
  updateThemeColorFromHex(themeColorInput.value);
};

// 选择主色调预设颜色
const selectThemePresetColor = (color: string) => {
  themeColorInput.value = color;
  updateThemeColorFromHex(color);
  validateAndApplyThemeColor();
};

// 调色盘相关函数

// 选择色相
const selectThemeHue = (event: MouseEvent) => {
  if (!themeHueBar.value) return;
  
  const rect = themeHueBar.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;
  
  // 计算百分比位置
  const position = Math.max(0, Math.min(100, (x / width) * 100));
  themeHuePosition.value = position;
  
  // 更新色相颜色
  updateThemeHueColor();
  
  // 更新最终颜色
  updateThemeFinalColor();
};

// 选择饱和度和亮度
const selectThemeSaturationBrightness = (event: MouseEvent) => {
  if (!themeSatBrightnessArea.value) return;
  
  const rect = themeSatBrightnessArea.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const width = rect.width;
  const height = rect.height;
  
  // 计算百分比位置
  const satPosition = Math.max(0, Math.min(100, (x / width) * 100));
  const brightPosition = Math.max(0, Math.min(100, (y / height) * 100));
  
  themeSaturationPosition.value = satPosition;
  themeBrightnessPosition.value = brightPosition;
  
  // 更新最终颜色
  updateThemeFinalColor();
};

// 开始拖动色相
const startThemeHueDrag = (event: MouseEvent) => {
  isDraggingThemeHue.value = true;
  selectThemeHue(event);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingThemeHue.value) {
      selectThemeHue(e);
    }
  };
  
  const handleMouseUp = () => {
    isDraggingThemeHue.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 开始拖动饱和度/亮度
const startThemeSatBrightDrag = (event: MouseEvent) => {
  isDraggingThemeSatBright.value = true;
  selectThemeSaturationBrightness(event);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingThemeSatBright.value) {
      selectThemeSaturationBrightness(e);
    }
  };
  
  const handleMouseUp = () => {
    isDraggingThemeSatBright.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 更新色相颜色
const updateThemeHueColor = () => {
  // 根据色相位置计算RGB颜色
  const hue = (themeHuePosition.value / 100) * 360;
  themeHueColor.value = hslToHex(hue, 100, 50);
};

// 更新最终颜色
const updateThemeFinalColor = () => {
  // 根据色相、饱和度和亮度计算最终颜色
  const hue = (themeHuePosition.value / 100) * 360;
  const saturation = themeSaturationPosition.value;
  const brightness = 100 - themeBrightnessPosition.value; // 亮度是从上到下递减的
  
  // 转换为十六进制颜色
  themeColorInput.value = hslToHex(hue, saturation, brightness);
  
  // 更新主色调
  updateThemeColor(themeColorInput.value);
};

// 从十六进制颜色更新调色盘状态
const updateThemeColorFromHex = (hexColor: string) => {
  // 将十六进制颜色转换为HSL
  const hsl = hexToHsl(hexColor);
  
  // 更新调色盘状态
  themeHuePosition.value = (hsl.h / 360) * 100;
  themeSaturationPosition.value = hsl.s;
  themeBrightnessPosition.value = 100 - hsl.l; // 亮度是从上到下递减的
  
  // 更新色相颜色
  updateThemeHueColor();
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

// 简化预设颜色列表，只保留基础颜色
const presetColors = [
  // 基础颜色
  '#ffffff', // 白色
  '#000000', // 黑色
  '#495057', // 暗灰色 (默认主色调)
  '#3498db', // 蓝色
  '#2ecc71', // 绿色
  '#e74c3c', // 红色
  '#f39c12', // 橙色
  '#9b59b6', // 紫色
  '#1abc9c', // 青绿色
  '#34495e', // 深蓝色
  '#7f8c8d', // 灰色
];


// 组件挂载时加载状态
onMounted(async () => {
  await loadState();
  
  // 设置当前主色调
  themeColorInput.value = themeColor.value || '#495057';
  
  // 初始化调色盘状态
  updateThemeColorFromHex(themeColorInput.value);
  
  // 同步主色调和时间设置
  showTimeValue.value = showTime.value;
  showSecondsValue.value = showSeconds.value;
  showDateValue.value = showDate.value;
  use24HourValue.value = use24Hour.value;
});

// 监听设置变化，自动应用

// 监听显示时间设置
watch(showTimeValue, async (newValue) => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  try {
    await updateShowTime(newValue);
    success('设置已更新', `时间显示已${newValue ? '开启' : '关闭'}`);
    
    // 如果关闭了时间显示，秒数和24小时制设置将被禁用
    if (!newValue) {
      // 不需要显示通知，因为这是默认行为
    }
  } catch (e) {
    error('更新设置失败', e?.toString());
    // 如果出错，还原设置
    showTimeValue.value = !newValue;
  } finally {
    isLoading.value = false;
  }
});

// 监听显示秒数设置
watch(showSecondsValue, async (newValue) => {
  if (isLoading.value || !showTimeValue.value) return;
  
  isLoading.value = true;
  try {
    await updateShowSeconds(newValue);
    success('设置已更新', `秒数显示已${newValue ? '开启' : '关闭'}`);
  } catch (e) {
    error('更新设置失败', e?.toString());
    // 如果出错，还原设置
    showSecondsValue.value = !newValue;
  } finally {
    isLoading.value = false;
  }
});

// 监听显示日期设置
watch(showDateValue, async (newValue) => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  try {
    await updateShowDate(newValue);
    success('设置已更新', `日期显示已${newValue ? '开启' : '关闭'}`);
  } catch (e) {
    error('更新设置失败', e?.toString());
    // 如果出错，还原设置
    showDateValue.value = !newValue;
  } finally {
    isLoading.value = false;
  }
});

// 监听24小时制设置
watch(use24HourValue, async (newValue) => {
  if (isLoading.value || !showTimeValue.value) return;
  
  isLoading.value = true;
  try {
    await updateUse24Hour(newValue);
    success('设置已更新', `已切换为${newValue ? '24小时制' : '12小时制'}`);
  } catch (e) {
    error('更新设置失败', e?.toString());
    // 如果出错，还原设置
    use24HourValue.value = !newValue;
  } finally {
    isLoading.value = false;
  }
});

// 监听主色调设置
watch(themeColorInput, async (newValue) => {
  // 验证颜色格式
  const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!colorRegex.test(newValue)) {
    return; // 如果不是有效的颜色格式，不进行更新
  }
  
  if (isLoading.value || newValue === themeColor.value) return;
  
  isLoading.value = true;
  try {
    await updateThemeColor(newValue);
    success('主色调已更新', '新的主色调已应用');
  } catch (e) {
    error('应用主色调失败', e?.toString());
    // 如果出错，还原设置
    themeColorInput.value = themeColor.value;
  } finally {
    isLoading.value = false;
  }
}, { debounce: 300 }); // 添加防抖，避免频繁更新
</script>

<style scoped>
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
</style>
