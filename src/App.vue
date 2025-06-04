///
<reference types="chrome" />
<script setup lang="ts">
import VanishingInput from "./components/ui/vanishing-input/VanishingInput.vue";
import BlurReveal from "./components/ui/blur-reveal/BlurReveal.vue";
import Dialog from "./components/ui/dialog/Dialog.vue";
import { Icon } from "@iconify/vue";
import NotificationContainer from "./components/ui/notification/NotificationContainer.vue";
import SearchSuggestions from "./components/ui/search-suggestions/SearchSuggestions.vue";

import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  nextTick,
  computed,
} from "vue";
import dayjs from "dayjs";
import { shallowRef } from "vue";
import BackgroundSettings from "@/components/settings/BackgroundSettings.vue";
import SearchEngineSettings from "@/components/settings/SearchEngineSettings.vue";
import TutorialSettings from "@/components/settings/TutorialSettings.vue";
import BasicSettings from "@/components/settings/BasicSettings.vue";
import { useWallpaper } from "./composables/useWallpaper";
import { storage } from "@/utils/storage";

type JumpData = {
  key: string[];
  label: string;
  jumpUrl: string;
};

// const isDark = computed(() => useColorMode().value == "dark");
const defaultKey = ref<string>("bd");
const ide = ref<string>("");
const placeholderArray = ref<string[]>([
  "Hello!!🖐️",
  "尝试输入bd[空格]或gg[空格]和bi[空格]加上你的搜索内容吧😎",
  "输入cd[空格]加上搜索引擎的key,可以切换默认搜索引擎哦😋",
  "输入*后携带收藏标签的标题可以快速找到收藏页🌟",
]);

// 从localStorage中读取jumpData，如果没有则使用默认值
const defaultJumpData: JumpData[] = [
  {
    key: ["bd", "baidu"],
    label: "BaiDu百度",
    jumpUrl: `https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>`,
  },
  {
    key: ["gg", "google"],
    label: "Google谷歌",
    jumpUrl: `https://www.google.com/search?q=&<query>`,
  },
  {
    key: ["bi", "bing"],
    label: "Bing必应",
    jumpUrl: `https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN`,
  },
];

// 添加 chrome 类型声明
declare global {
  interface Window {
    chrome?: {
      storage?: {
        local?: {
          get: (
            keys: string | string[] | object | null
          ) => Promise<{ [key: string]: any }>;
          set: (items: { [key: string]: any }) => Promise<void>;
          onChanged?: {
            addListener: (
              callback: (
                changes: { [key: string]: { newValue: any; oldValue: any } },
                namespace: string
              ) => void
            ) => void;
          };
        };
      };
      bookmarks?: {
        search: (query: string) => Promise<chrome.bookmarks.BookmarkTreeNode[]>;
      };
    };
  }
}

const jumpData = ref<JumpData[]>([]);
const jumpToData = ref<Map<string, JumpData>>();

const date = ref<string>("");
const time = ref<string>("");
const setup = ref({
  show: false,
});
const selectedSection = ref<string>("background");
const setUpSelect = shallowRef([
  {
    key: "basic",
    icon: "fluent-color:settings-48",
    label: "基础设置",
    in: BasicSettings,
  },
  {
    key: "img",
    icon: "fluent-color:image-48",
    label: "背景设置",
    in: BackgroundSettings,
  },
  {
    key: "jump",
    icon: "fluent-color:link-multiple-24",
    label: "搜索引擎",
    in: SearchEngineSettings,
  },
  {
    key: "tutorial",
    icon: "fluent-color:number-symbol-square-32",
    label: "使用教程",
    in: TutorialSettings,
  },
]);
const currentSettingComponent = shallowRef<any>(null);

let timer: number;

const {
  wallpaperType,
  wallpaperUrl,
  themeColor,
  showTime,
  showSeconds,
  showDate,
  use24Hour,
  loadState,
  showMask,
  getWallpaperStyle,
} = useWallpaper();

// 添加搜索状态文本
const searchStatusText = ref<string>("");
// 是否显示搜索引擎选择菜单
const showEngineSelector = ref<boolean>(false);
// 用于获取输入框引用
const vanishingInputRef = ref(null);
// 收藏夹搜索结果
const bookmarkResults = ref<chrome.bookmarks.BookmarkTreeNode[]>([]);
// 是否显示收藏夹搜索结果
const showBookmarkResults = ref<boolean>(false);
// 当前选中的结果索引
const selectedBookmarkIndex = ref<number>(-1);
// 页面加载状态
const isLoading = ref<boolean>(false);
// 是否显示搜索建议
const showSearchSuggestions = ref<boolean>(false);
// 当前搜索引擎类型
const currentEngineType = ref<string>("bd");
// 当前搜索查询
const currentSearchQuery = ref<string>("");
const suggestionsFullyClosed = ref(true);
const isSearchFocused = ref(false);
// 添加一个标志来区分是手动输入还是通过上下键选择填充
const isKeyboardFill = ref(false);

// 监听输入框聚焦状态
watch(isSearchFocused, (newVal) => {
  if (newVal && ide.value) {
    showSearchSuggestions.value = true;
  } else if (!newVal) {
    showSearchSuggestions.value = false;
  }
});

// 监听输入内容变化
watch(ide, (newValue) => {
  // 如果是键盘选择填充，不触发搜索建议
  if (isKeyboardFill.value) {
    isKeyboardFill.value = false;
    return;
  }

  init();

  const value = newValue?.trim();

  // 处理特殊命令
  if (value.startsWith("cd")) {
    // 处理cd命令
      showEngineSelector.value = true;
    showSearchSuggestions.value = false;
      
      const engineKey = value.split(" ")[1];
      if (engineKey) {
        const engine = jumpToData.value?.get(engineKey);
        if (engine) {
          searchStatusText.value = `将切换到 ${engine.label} (${engine.key.join("/")})`;
        } else {
          searchStatusText.value = "未找到匹配的搜索引擎";
        }
      } else {
        searchStatusText.value = "请输入搜索引擎名称";
      }
  } else {
    // 非cd命令时，隐藏搜索引擎选择器
    showEngineSelector.value = false;
    
    if (value.startsWith("*")) {
    // 处理收藏夹搜索
    const searchQuery = value.slice(1).trim();
    if (searchQuery) {
      searchBookmarks(searchQuery);
      showBookmarkResults.value = true;
      searchStatusText.value = `搜索收藏夹: ${searchQuery}`;
    } else {
      searchStatusText.value = "请输入要搜索的收藏夹内容";
      showBookmarkResults.value = false;
    }
  } else {
    // 普通搜索处理逻辑
    if (
      value &&
        !value.startsWith("*")
    ) {
      const parts = value.split(" ");
      if (parts.length >= 1) {
        const engineKey = parts[0];
        let matchedEngine = false;

        // 检查是否匹配搜索引擎
        if (jumpToData.value) {
          for (const [_, engine] of jumpToData.value) {
            if (engine.key.includes(engineKey)) {
              currentEngineType.value = engineKey;
              matchedEngine = true;
              break;
            }
          }
        }

        if (matchedEngine && parts.length > 1) {
          // 如果匹配到搜索引擎并且有搜索词
          currentSearchQuery.value = parts.slice(1).join(" ");
          showSearchSuggestions.value = true;
        } else if (!matchedEngine) {
          // 如果没有匹配到搜索引擎，使用默认引擎
          currentEngineType.value = defaultKey.value;
            // 如果以/开头，去掉/再搜索
            currentSearchQuery.value = value.startsWith("/") ? value.slice(1) : value;
          showSearchSuggestions.value = true;
        } else {
          // 如果只有搜索引擎关键词，没有搜索词
          currentSearchQuery.value = "";
        }
      }
      }
    }
  }

  // 保留空输入处理
  if (!value) {
    // 当输入为空时，显示默认搜索引擎信息并关闭搜索建议
    showSearchSuggestions.value = false;
    showEngineSelector.value = false;
    currentSearchQuery.value = "";
    const defaultEngine = jumpToData.value?.get(defaultKey.value);
    if (defaultEngine) {
      searchStatusText.value = `当前使用 ${
        defaultEngine.label
      } (${defaultEngine.key.join("/")}) | 输入 cd 切换搜索引擎`;
    }
    return;
  }
});

// 当搜索建议关闭时，设置一个短暂延迟再显示时间日期
watch(showSearchSuggestions, (newVal) => {
  if (!newVal) {
    // 设置300ms延迟确保动画完成
    setTimeout(() => {
      suggestionsFullyClosed.value = true;
    }, 50);
  } else {
    suggestionsFullyClosed.value = false;
  }
});

// 选择搜索引擎
const selectEngine = (key: string) => {
  if (jumpToData.value?.has(key)) {
    ide.value = `cd ${key}`;
    showEngineSelector.value = false;
  }
};

// 加载搜索引擎数据
const loadEngines = async () => {
  try {
    const savedEngines = await storage.get("jumpData");
    if (savedEngines && Array.isArray(savedEngines)) {
      jumpData.value = savedEngines;
    } else {
      jumpData.value = [...defaultJumpData];
    }
  } catch (e) {
    console.error("Failed to load engines:", e);
    jumpData.value = [...defaultJumpData];
  }
};

// 监听 storage 变化
if (
  typeof window.chrome !== "undefined" &&
  window.chrome.storage?.local?.onChanged
) {
  window.chrome.storage.local.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.jumpData) {
      const newValue = changes.jumpData.newValue;
      if (newValue && Array.isArray(newValue)) {
        // jumpData.value = newValue;
      }
    }
  });
}

// 监听键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (!showBookmarkResults.value) return;

  const maxIndex = Math.min(bookmarkResults.value.length - 1, 4);

  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      if (selectedBookmarkIndex.value <= 0) {
        selectedBookmarkIndex.value = maxIndex;
      } else {
        selectedBookmarkIndex.value--;
      }
      scrollToSelectedItem();
      break;
    case "ArrowDown":
      e.preventDefault();
      if (selectedBookmarkIndex.value >= maxIndex) {
        selectedBookmarkIndex.value = 0;
      } else {
        selectedBookmarkIndex.value++;
      }
      scrollToSelectedItem();
      break;
    case "Enter":
      e.preventDefault();
      if (
        selectedBookmarkIndex.value >= 0 &&
        bookmarkResults.value[selectedBookmarkIndex.value]?.url
      ) {
        openBookmark(bookmarkResults.value[selectedBookmarkIndex.value].url);
      }
      break;
  }
};

// 滚动到选中的项目
const scrollToSelectedItem = () => {
  nextTick(() => {
    const container = document.querySelector(
      ".bookmark-results .overflow-y-auto"
    );
    const selectedItem = document.querySelector(
      `.bookmark-item:nth-child(${selectedBookmarkIndex.value + 1})`
    );

    if (container && selectedItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      // 如果选中的项目在可视区域之外
      if (itemRect.top < containerRect.top) {
        // 向上滚动
        container.scrollTop -= containerRect.top - itemRect.top;
      } else if (itemRect.bottom > containerRect.bottom) {
        // 向下滚动
        container.scrollTop += itemRect.bottom - containerRect.bottom;
      }
    }
  });
};

// 组件挂载时加载数据
onMounted(async () => {
  try {
    // 页面加载完成，确保不显示加载动画
    isLoading.value = false;
    // 新增书签缓存逻辑
    if (window.chrome?.bookmarks) {
      const allBookmarks = await window.chrome.bookmarks.search({});
      const validBookmarks = allBookmarks.filter((b) => b.url);
      await storage.set("cachedBookmarks", JSON.stringify(validBookmarks));
    }

    await loadEngines();
    await loadState();
    await init();
    updateDateTime();
    timer = window.setInterval(() => {
      updateDateTime();
    }, 1000);
    setUpClick(setUpSelect.value[0].key);

    // 设置初始搜索状态
    const defaultEngine = jumpToData.value?.get(defaultKey.value);
    if (defaultEngine) {
      searchStatusText.value = `当前使用 ${
        defaultEngine.label
      } (${defaultEngine.key.join("/")}) | 输入 cd 切换搜索引擎`;
    }

    // 从存储中加载壁纸类型和URL
    const savedWallpaperType = await storage.get("wallpaperType");
    const savedWallpaperUrl = await storage.get("wallpaperUrl");

    if (savedWallpaperType && savedWallpaperUrl) {
      // 如果存储中有壁纸信息，使用存储的值
      wallpaperType.value = savedWallpaperType as "none" | "source" | "custom";
      if (wallpaperType.value !== "none") {
        wallpaperUrl.value = savedWallpaperUrl as string;
      }
    }

    // 组件挂载时添加键盘事件监听
    window.addEventListener("keydown", handleKeyDown);
  } catch (error) {
    console.error("Error loading data:", error);
  }
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
  // 组件卸载时移除键盘事件监听
  window.removeEventListener("keydown", handleKeyDown);
});

const init = async () => {
  try {
    let savedDefaultKey = null;
    let savedJumpData = null;

    // 使用统一的存储接口获取数据
    savedDefaultKey = await storage.get("defaultKey");
    savedJumpData = await storage.get("jumpData");

    // 只有在没有数据时才使用默认值
    defaultKey.value = (savedDefaultKey || "bd") as string;
    jumpData.value = JSON.parse(
      (savedJumpData as string) || JSON.stringify(defaultJumpData)
    );

    if (!savedDefaultKey) {
      await storage.set("defaultKey", "bd");
    }

    if (!savedJumpData) {
      await storage.set("jumpData", JSON.stringify(defaultJumpData));
    }

    // 初始化 jumpToData Map
    jumpToData.value = new Map<string, JumpData>();
    jumpData.value.forEach((data) => {
      data.key.forEach((key) => {
        jumpToData.value?.set(key, data);
      });
    });
  } catch (e) {
    console.error("Global init error:", e);
  }
};

const updateDateTime = () => {
  const now = dayjs();
  date.value = now.format("YYYY MM DD");

  // 根据24小时制设置选择时间格式
  if (use24Hour.value) {
    time.value = showSeconds.value
      ? now.format("HH:mm:ss")
      : now.format("HH:mm");
  } else {
    time.value = showSeconds.value
      ? now.format("h:mm:ss A")
      : now.format("h:mm A");
  }
};

function submit(content: string) {
  // 如果输入以*开头，不执行搜索
  if (content.startsWith("*")) {
    return;
  }

  if (content.startsWith("/")) {
    jumpTo(defaultKey.value, content.slice(1));
  }
  if (content.includes(" ")) {
    let contentFAndR = segmentationContent(" ", content);
    jumpTo(contentFAndR[0], contentFAndR[1]);
  } else {
    jumpTo(defaultKey.value, content);
  }

  // 提交搜索后重置搜索建议
  showSearchSuggestions.value = false;
  currentSearchQuery.value = "";
}

// 处理搜索建议选择 - 右键点击或回车，立即执行搜索
function handleSuggestionSelect(suggestion: string) {
  // 根据当前搜索引擎类型和选中的建议构建搜索查询
  if (currentEngineType.value) {
    // 如果是默认引擎的关键词，直接使用建议作为搜索词
    if (currentEngineType.value === defaultKey.value) {
      ide.value = suggestion;
    } else {
      // 如果是特定引擎，保留引擎关键词
      ide.value = `${currentEngineType.value} ${suggestion}`;
    }

    // 自动提交搜索
    submit(ide.value);
  }
}

// 处理搜索建议填充 - 左键点击，只填充不执行搜索
function handleSuggestionFill(data: { suggestion: string, isFillAction: boolean, isKeyboardFill?: boolean }) {
  // 根据当前搜索引擎类型和选中的建议构建搜索查询
  if (currentEngineType.value) {
    // 如果是默认引擎的关键词，直接使用建议作为搜索词
    if (currentEngineType.value === defaultKey.value) {
      ide.value = data.suggestion;
    } else {
      // 如果是特定引擎，保留引擎关键词
      ide.value = `${currentEngineType.value} ${data.suggestion}`;
    }

    // 将焦点设置到输入框
    if (vanishingInputRef.value) {
      setTimeout(() => {
        (vanishingInputRef.value as any)?.focus();
      }, 10);
    }

    // 如果是键盘选择填充，设置标志
    if (data.isKeyboardFill) {
      isKeyboardFill.value = true;
    }
  }
}

// 处理ESC键事件
function handleEscapeKey() {
  console.log("Escape event received");
  showSearchSuggestions.value = false;
  showEngineSelector.value = false;
  showBookmarkResults.value = false;
}

function segmentationContent(medium: string, content: string): string[] {
  const [firstPart, ...restParts] = content.split(medium);
  const remaining = restParts.join(" ");
  return [firstPart, remaining];
}

async function jumpTo(jumpType: string, toData: string) {
  if (!jumpType || jumpType === "") {
    jumpType = defaultKey.value;
  }
  if (jumpType === "cd") {
    const jumpData = jumpToData.value?.get(toData);
    if (jumpData) {
      defaultKey.value = toData;
      await storage.set("defaultKey", toData);
    }
    return;
  }
  const jumpData = jumpToData.value?.get(jumpType);
  if (jumpData) {
    const toUrl = jumpData.jumpUrl.replace("&<query>", toData);
    window.open(toUrl, "_blank", "noopener,noreferrer");
  } else {
    const data = jumpType + toData;
    const defaultJumpData = jumpToData.value?.get(defaultKey.value);
    if (defaultJumpData) {
      const toUrl = defaultJumpData.jumpUrl.replace("&<query>", data);
      window.open(toUrl, "_blank", "noopener,noreferrer");
    }
  }
}

function onSetup() {
  setup.value.show = true;
}

function setUpClick(select: string) {
  selectedSection.value = select;
  const selected = setUpSelect.value.find((item) => item.key === select);
  currentSettingComponent.value = selected?.in || null;
}

// 搜索收藏夹
const searchBookmarks = async (query: string) => {
  try {
    if (window.chrome?.bookmarks) {
      const results = await window.chrome.bookmarks.search(query);
      // 过滤掉文件夹，只显示书签
      const bookmarks = results.filter(
        (item: chrome.bookmarks.BookmarkTreeNode) => item.url
      );
      // 如果没有拼音匹配的结果，显示原始搜索结果
      bookmarkResults.value = bookmarks;
    }
  } catch (e) {
    console.error("搜索收藏夹失败:", e);
    searchStatusText.value = "搜索收藏夹失败";
  }
};

// 打开收藏夹链接
const openBookmark = (url: string | undefined) => {
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
    showBookmarkResults.value = false;
  }
};

// 组件挂载时添加键盘事件监听
window.addEventListener("keydown", handleKeyDown);

// 组件卸载时移除键盘事件监听
window.removeEventListener("keydown", handleKeyDown);
</script>

<template>
  <div class="relative min-h-screen w-full transition-all duration-300">
    <!-- 加载中遮罩 -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
    <div
      v-if="isLoading"
        class="fixed inset-0 z-50 flex items-center justify-center"
        :style="wallpaperType === 'color' ? { backgroundColor: backgroundColor } : {}"
      :class="{ 'bg-slate-100 dark:bg-zinc-900': wallpaperType === 'none' }"
    >
      <!-- 如果是图片背景，使用相同的背景图片 -->
      <div
        v-if="wallpaperType === 'custom' || wallpaperType === 'source'"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url('${wallpaperUrl}')` }"
      >
        <div class="absolute inset-0 bg-black bg-opacity-30"></div>
        <!-- 添加半透明遮罩 -->
      </div>

      <div class="text-center relative z-10">
        <div
          class="inline-block w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"
        ></div>
        <p class="mt-2 text-white text-shadow-sm">加载中...</p>
      </div>
    </div>
    </Transition>

    <!-- 主要内容区域 -->
    <div class="relative z-10">
      <div
        id="base"
        class="text-slate-700 dark:text-zinc-400 transition-all duration-500 ease-in-out"
        :class="{ 'has-background': wallpaperType !== 'none' }"
        :style="getWallpaperStyle()"
      >
        <!-- 遮罩层 - 调整z-index为0 -->
        <Transition
          enter-active-class="transition-opacity duration-500 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-300 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="wallpaperType !== 'none' && showMask" id="mask" class="z-0"></div>
        </Transition>

        <!-- 搜索建议遮罩 -->
        <Transition
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="ide && (showTime || showDate)"
          class="absolute inset-0 z-1 bg-white/20 dark:bg-black/20 backdrop-blur-sm pointer-events-none"
        ></div>
        </Transition>

        <!-- 设置按钮 -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
        <div id="setup" class="flex items-center gap-4 z-[200]">
          <Icon
            @click="onSetup"
            icon="line-md:cog-filled"
              class="text-2xl cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
            :style="{ color: themeColor }"
          >
          </Icon>
        </div>
        </Transition>

        <!-- 时间和日期显示区域 -->
        <BlurReveal
          :delay="0.2"
          :duration="0.75"
          class="p-8"
          v-if="(showTime || showDate) && !showSearchSuggestions && suggestionsFullyClosed && !showBookmarkResults && !showEngineSelector"
        >
          <template v-if="showTime">
            <h2
              class="mb-5 text-center font-bold text-8xl select-none cursor-none"
              :style="{ color: themeColor }"
            >
              {{ time }}
            </h2>
          </template>
          <template v-else>
            <div class="mb-5"></div>
          </template>
          <div
            class="mb-30 text-center text-5xl font-bold sm:mb-50 select-none cursor-none"
          >
            <span v-if="showDate" :style="{ color: themeColor }">{{
              date
            }}</span>
            <span v-else class="invisible">&nbsp;</span>
          </div>
        </BlurReveal>

        <!-- 搜索区域容器 -->
        <div
          :class="{
            'h-[40vh] flex flex-col items-center justify-center': !showTime && !showDate && !ide && !showBookmarkResults && !showEngineSelector,
            'flex flex-col items-center justify-start pt-8': ide || showBookmarkResults || showEngineSelector,
            'transition-all duration-500 ease-in-out': true,
          }"
          class="w-full relative z-2"
        >
          <!-- 搜索区域包装器 -->
          <div 
            class="relative mx-auto max-w-xl w-full transition-all duration-500 ease-in-out"
            :class="{
              'transform scale-100 translate-y-0': !showTime && !showDate,
              'transform scale-95 translate-y-[-20px]': showTime || showDate,
            }"
          >
            <!-- 搜索框 -->
            <VanishingInput
              id="vanishing-input"
              v-model="ide"
              :placeholders="placeholderArray"
              @submit="submit"
              @escape="handleEscapeKey"
              ref="vanishingInputRef"
              class="relative z-2 transition-all duration-500 ease-in-out"
              :class="{
                'transform scale-100 opacity-100': true,
                'hover:scale-[1.02]': !showSearchSuggestions && !showEngineSelector && !showBookmarkResults,
                'shadow-lg hover:shadow-xl': !showSearchSuggestions && !showEngineSelector && !showBookmarkResults,
              }"
            />

            <!-- 搜索建议 -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 scale-95 translate-y-[-10px]"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 translate-y-[-10px]"
            >
            <SearchSuggestions
                v-if="showSearchSuggestions"
              :query="currentSearchQuery"
              :engine-type="currentEngineType"
              :visible="showSearchSuggestions"
              @select="handleSuggestionSelect"
              @fill="handleSuggestionFill"
              @close="showSearchSuggestions = false"
                class="transition-all duration-300 ease-in-out relative z-2"
            />
            </Transition>
          </div>

          <!-- 搜索状态提示框 -->
          <div class="relative mx-auto max-w-xl w-full mt-2">
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 translate-y-2 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 translate-y-2 scale-95"
            >
              <div
                v-if="searchStatusText && !showSearchSuggestions && !showEngineSelector && !showBookmarkResults"
                class="input-group w-full px-4 py-2 rounded-lg text-sm text-center backdrop-blur-md bg-white/80 text-gray-800 dark:bg-gray-800/80 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl"
              >
                {{ searchStatusText }}
              </div>
            </Transition>
          </div>

          <!-- 搜索引擎选择器 -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="showEngineSelector"
              class="engine-selector relative z-2 mt-2 max-w-xl mx-auto w-full rounded-xl backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden"
            >
              <div class="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div class="flex justify-between items-center">
                  <span>选择搜索引擎</span>
              </div>
              </div>
              <div class="p-2 space-y-1 max-h-[28vh] overflow-y-auto">
                <div
                  v-for="engine in jumpData"
                  :key="engine.key[0]"
                  @click="selectEngine(engine.key[0])"
                  class="engine-item p-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-grow min-w-0">
                      <div class="font-medium text-gray-800 dark:text-white text-sm">
                        {{ engine.label }}
                    </div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ engine.key.join(" / ") }}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 收藏夹搜索结果 -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="showBookmarkResults"
              class="z-2 bookmark-results mx-auto max-w-3xl w-full mt-4 rounded-xl backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl"
            >
              <div
                class="p-2 bg-gray-100/90 dark:bg-gray-700/90 border-b border-gray-200 dark:border-gray-600"
              >
                <h3 class="font-medium text-gray-800 dark:text-white text-sm">
                  收藏夹搜索结果
                </h3>
              </div>
              <div
                class="p-2 space-y-1 max-h-[200px] overflow-y-auto"
                ref="bookmarkResultsContainer"
              >
                <div
                  v-for="(bookmark, index) in bookmarkResults.slice(0, 5)"
                  :key="index"
                  @click="openBookmark(bookmark.url)"
                  class="bookmark-item p-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  :class="{
                    'bg-blue-100 dark:bg-blue-800/50 border-blue-300 dark:border-blue-700': index === selectedBookmarkIndex,
                  }"
                >
                  <div class="flex items-center gap-2">
                    <div class="flex-grow min-w-0">
                      <div
                        class="font-medium text-gray-800 dark:text-white text-sm truncate"
                      >
                        {{ bookmark.title }}
                      </div>
                      <div
                        class="text-xs text-gray-500 dark:text-gray-400 truncate"
                      >
                        {{ bookmark.url }}
                      </div>
                    </div>
                    <div
                      v-if="index === selectedBookmarkIndex"
                      class="text-xs text-blue-500 dark:text-blue-400"
                    >
                      按Enter打开
                    </div>
                  </div>
                </div>
                <div
                  v-if="bookmarkResults.length === 0"
                  class="text-center text-gray-500 dark:text-gray-400 py-2 text-sm"
                >
                  未找到匹配的收藏夹
                </div>
                <div
                  v-if="bookmarkResults.length > 5"
                  class="text-center text-gray-500 dark:text-gray-400 py-1 text-xs"
                >
                  还有 {{ bookmarkResults.length - 5 }} 个结果未显示
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 设置对话框 -->
        <Dialog
          :show="setup.show"
          :select="setUpSelect"
          title="设置"
          @close="setup.show = false"
        >
          <div class="space-y-4 w-[100%] h-[100%]">
            <div class="flex flex-row justify-center w-[100%] h-[100%]">
              <div
                class="w-[20%] h-[100%] border-r-1 border-dotted select-none px-2"
              >
                <div class="h-[20%] bg-amber-600">123</div>
                <div
                  v-for="(select, index) in setUpSelect"
                  :key="index"
                  class="flex flex-row content-center items-center w-[100%] p-1.5 rounded-xl text-gray-900 pl-[18%]"
                  :style="
                    selectedSection == select.key
                      ? { backgroundColor: '#006BDF', color: 'white' }
                      : {}
                  "
                  @click="setUpClick(select.key)"
                >
                  <Icon :icon="select.icon"></Icon>
                  <span class="ml-2">{{ select.label }}</span>
                </div>
              </div>
              <div class="w-[80%] h-[100%]" id="settings-page">
                <component :is="currentSettingComponent" />
              </div>
            </div>
          </div>
        </Dialog>
      </div>
      <NotificationContainer />
    </div>
  </div>
</template>

<style scoped>
#base {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  transition: all 0.5s ease-in-out;
}

.dark #base {
  background-color: #18181b;
}

#base.has-background {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease-in-out;
}

#mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background-color: rgba(0, 0, 0, 0.15);
  transition: background-color 0.3s ease-in-out;
}

.p-8,
#vanishing-input,
.input-group,
.engine-selector,
.search-suggestions-container {
  position: relative;
  z-index: 2;
}

#setup {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 搜索引擎选择器样式 */
.engine-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.engine-item:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1),
    0 4px 8px -2px rgba(0, 0, 0, 0.05);
}

/* 收藏夹搜索结果样式 */
.bookmark-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.5rem;
}

.bookmark-item:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
}

/* 选中状态样式 */
.bookmark-item.bg-blue-100,
.bookmark-item.dark\:bg-blue-800\/50 {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
  }

/* 自定义滚动条样式 */
.bookmark-results {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.bookmark-results::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.bookmark-results::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 2px;
}

.bookmark-results::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  transition: background-color 0.3s ease;
}

.bookmark-results::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 添加全局过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 添加缩放过渡效果 */
.scale-enter-active,
.scale-leave-active {
  transition: transform 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
}

/* 添加滑动过渡效果 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(10px);
}

/* 添加模糊过渡效果 */
.blur-enter-active,
.blur-leave-active {
  transition: filter 0.3s ease;
}

.blur-enter-from,
.blur-leave-to {
  filter: blur(10px);
}

/* 搜索框动画相关样式 */
#vanishing-input {
  will-change: transform, opacity, box-shadow;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
}

/* 搜索框悬停效果 */
#vanishing-input:hover {
  transform: translateY(-1px);
}

/* 搜索框聚焦效果 */
#vanishing-input:focus-within {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
}

/* 搜索框动画过渡 */
#vanishing-input,
.search-container {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 搜索建议容器动画 */
.search-suggestions-container {
  transform-origin: top center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 搜索框移动动画 */
@keyframes searchBoxMove {
  0% {
    transform: translateY(0) scale(1);
}
  50% {
    transform: translateY(-10px) scale(0.98);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

.search-box-move {
  animation: searchBoxMove 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 搜索框缩放动画 */
@keyframes searchBoxScale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.search-box-scale {
  animation: searchBoxScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 搜索框阴影动画 */
@keyframes searchBoxShadow {
  0% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  100% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
}

.search-box-shadow {
  animation: searchBoxShadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 搜索框组合动画 */
.search-box-combined {
  animation: 
    searchBoxMove 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    searchBoxScale 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    searchBoxShadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

