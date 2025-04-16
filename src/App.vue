///
<reference types="chrome" />
<script setup lang="ts">
import VanishingInput from './components/ui/vanishing-input/VanishingInput.vue';
import BlurReveal from './components/ui/blur-reveal/BlurReveal.vue';
import Dialog from './components/ui/dialog/Dialog.vue';
import { Icon } from "@iconify/vue";
import NotificationContainer from './components/ui/notification/NotificationContainer.vue'

import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue';
import dayjs from "dayjs";
import { shallowRef } from 'vue'
import BackgroundSettings from '@/components/settings/BackgroundSettings.vue'
import SearchEngineSettings from '@/components/settings/SearchEngineSettings.vue'
import TutorialSettings from '@/components/settings/TutorialSettings.vue'
import { useWallpaper } from './composables/useWallpaper';
import { storage } from '@/utils/storage';
import pinyin from 'pinyin';


type JumpData = {
  key: string[],
  label: string,
  jumpUrl: string
}

// const isDark = computed(() => useColorMode().value == "dark");
const defaultKey = ref<string>("bd");
const ide = ref<string>("");
const placeholderArray = ref<string[]>(
  [
    "Hello!!🖐️",
    "尝试输入bd[空格]或gg[空格]和bi[空格]加上你的搜索内容吧😎",
    "输入cd[空格]加上搜索引擎的key,可以切换默认搜索引擎哦😋"
  ]
);

// 从localStorage中读取jumpData，如果没有则使用默认值
const defaultJumpData: JumpData[] = [
  {
    key: ["bd", "baidu"],
    label: "BaiDu百度",
    jumpUrl: `https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>`
  },
  {
    key: ["gg", "google"],
    label: "Google谷歌",
    jumpUrl: `https://www.google.com/search?q=&<query>`
  },
  {
    key: ["bi", "bing"],
    label: "Bing必应",
    jumpUrl: `https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN`
  }
];

// 添加 chrome 类型声明
declare global {
  interface Window {
    chrome?: {
      storage?: {
        local?: {
          get: (keys: string | string[] | object | null) => Promise<{ [key: string]: any }>;
          set: (items: { [key: string]: any }) => Promise<void>;
          onChanged?: {
            addListener: (callback: (changes: { [key: string]: { newValue: any, oldValue: any } }, namespace: string) => void) => void;
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
})
const selectedSection = ref<string>("background");
const setUpSelect = shallowRef([
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
  }
]);
const currentSettingComponent = shallowRef<any>(null)


let timer: number;

const { wallpaperType, wallpaperUrl, loadState, showMask } = useWallpaper();

// 添加搜索状态文本
const searchStatusText = ref<string>('');
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

// 监听输入变化
watch(ide, (newValue) => {
  init();
  const value = newValue.trim();

  // 重置搜索引擎选择器显示状态
  showEngineSelector.value = false;
  showBookmarkResults.value = false;
  selectedBookmarkIndex.value = -1;

  if (!value) {
    // 当输入为空时，显示默认搜索引擎信息
    const defaultEngine = jumpToData.value?.get(defaultKey.value);
    if (defaultEngine) {
      searchStatusText.value = `当前使用 ${defaultEngine.label} (${defaultEngine.key.join('/')}) | 输入 cd 切换搜索引擎`;
    }
    return;
  }

  // 处理收藏夹搜索
  if (value.startsWith('*')) {
    const searchQuery = value.slice(1).trim();
    if (searchQuery) {
      searchBookmarks(searchQuery);
      showBookmarkResults.value = true;
      searchStatusText.value = `搜索收藏夹: ${searchQuery}`;
    } else {
      searchStatusText.value = '请输入要搜索的收藏夹内容';
      showBookmarkResults.value = false;
    }
    return;
  }

  if (value === 'cd') {
    // 当输入为cd时，显示搜索引擎选择器
    showEngineSelector.value = true;
    searchStatusText.value = '请选择要切换的搜索引擎';
  } else if (value.startsWith('cd ')) {
    const engineKey = value.split(' ')[1];
    const engine = jumpToData.value?.get(engineKey);
    if (engine) {
      searchStatusText.value = `将切换到 ${engine.label} (${engine.key.join('/')})`;
    } else {
      searchStatusText.value = '未找到匹配的搜索引擎';
    }
  } else {
    const inputParts = value.split(' ');
    const searchKey = inputParts[0];

    let matchedEngine = null;
    if (jumpToData.value) {
      for (const [_, engine] of jumpToData.value) {
        if (engine.key.includes(searchKey)) {
          matchedEngine = engine;
          break;
        }
      }
    }

    if (matchedEngine) {
      if (inputParts.length === 1) {
        searchStatusText.value = `使用 ${matchedEngine.label} (${matchedEngine.key.join('/')}) | 输入搜索内容`;
      } else {
        searchStatusText.value = `使用 ${matchedEngine.label} (${matchedEngine.key.join('/')}) 搜索`;
      }
    } else {
      const defaultEngine = jumpToData.value?.get(defaultKey.value);
      if (defaultEngine) {
        searchStatusText.value = `使用默认引擎 ${defaultEngine.label} (${defaultEngine.key.join('/')}) 搜索`;
      }
    }
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
    const savedEngines = await storage.get('jumpData');
    if (savedEngines && Array.isArray(savedEngines)) {
      jumpData.value = savedEngines;
    } else {
      jumpData.value = [...defaultJumpData];
    }
  } catch (e) {
    console.error('Failed to load engines:', e);
    jumpData.value = [...defaultJumpData];
  }
};

// 监听 storage 变化
if (typeof window.chrome !== 'undefined' && window.chrome.storage?.local?.onChanged) {
  window.chrome.storage.local.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.jumpData) {
      console.log('changes.jumpData', changes.jumpData);
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
    case 'ArrowUp':
      e.preventDefault();
      if (selectedBookmarkIndex.value <= 0) {
        selectedBookmarkIndex.value = maxIndex;
      } else {
        selectedBookmarkIndex.value--;
      }
      scrollToSelectedItem();
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (selectedBookmarkIndex.value >= maxIndex) {
        selectedBookmarkIndex.value = 0;
      } else {
        selectedBookmarkIndex.value++;
      }
      scrollToSelectedItem();
      break;
    case 'Enter':
      e.preventDefault();
      if (selectedBookmarkIndex.value >= 0 && bookmarkResults.value[selectedBookmarkIndex.value]?.url) {
        openBookmark(bookmarkResults.value[selectedBookmarkIndex.value].url);
      }
      break;
  }
};

// 滚动到选中的项目
const scrollToSelectedItem = () => {
  nextTick(() => {
    const container = document.querySelector('.bookmark-results .overflow-y-auto');
    const selectedItem = document.querySelector(`.bookmark-item:nth-child(${selectedBookmarkIndex.value + 1})`);

    if (container && selectedItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      // 如果选中的项目在可视区域之外
      if (itemRect.top < containerRect.top) {
        // 向上滚动
        container.scrollTop -= (containerRect.top - itemRect.top);
      } else if (itemRect.bottom > containerRect.bottom) {
        // 向下滚动
        container.scrollTop += (itemRect.bottom - containerRect.bottom);
      }
    }
  });
};

// 组件挂载时加载数据
onMounted(async () => {
  try {
    // 新增书签缓存逻辑
    if (window.chrome?.bookmarks) {
      const allBookmarks = await window.chrome.bookmarks.search({});
      const validBookmarks = allBookmarks.filter(b => b.url);
      await storage.set('cachedBookmarks', JSON.stringify(validBookmarks));
    }

    await loadEngines();
    await loadState();
    await init();
    updateDateTime();
    timer = window.setInterval(() => { updateDateTime() }, 1000);
    setUpClick(setUpSelect.value[0].key);

    // 设置初始搜索状态
    const defaultEngine = jumpToData.value?.get(defaultKey.value);
    if (defaultEngine) {
      searchStatusText.value = `当前使用 ${defaultEngine.label} (${defaultEngine.key.join('/')}) | 输入 cd 切换搜索引擎`;
    }

    // 从存储中加载壁纸类型和URL
    const savedWallpaperType = await storage.get('wallpaperType');
    const savedWallpaperUrl = await storage.get('wallpaperUrl');

    if (savedWallpaperType && savedWallpaperUrl) {
      // 如果存储中有壁纸信息，使用存储的值
      wallpaperType.value = savedWallpaperType as 'none' | 'source' | 'custom';
      if (wallpaperType.value !== 'none') {
        wallpaperUrl.value = savedWallpaperUrl as string;
      }
    }

    // 组件挂载时添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown);
  } catch (e) {
    console.error('Failed to load initial state:', e);
  }
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
  // 组件卸载时移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);
})

const init = async () => {
  try {
    let savedDefaultKey = null;
    let savedJumpData = null;

    // 使用统一的存储接口获取数据
    savedDefaultKey = await storage.get('defaultKey');
    savedJumpData = await storage.get('jumpData');

    // 只有在没有数据时才使用默认值
    defaultKey.value = (savedDefaultKey || 'bd') as string;
    jumpData.value = JSON.parse(savedJumpData as string || JSON.stringify(defaultJumpData));

    if (!savedDefaultKey) {
      await storage.set('defaultKey', 'bd');
    }

    if (!savedJumpData) {
      await storage.set('jumpData', JSON.stringify(defaultJumpData));
    }

    // 初始化 jumpToData Map
    jumpToData.value = new Map<string, JumpData>();
    jumpData.value.forEach(data => {
      data.key.forEach(key => {
        jumpToData.value?.set(key, data);
      });
    });
  } catch (e) {
    console.error('Global init error:', e);
  }
};

const updateDateTime = () => {
  const now = dayjs();
  date.value = now.format("YYYY MM DD");
  time.value = now.format("HH:mm:ss")
}

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
}

function segmentationContent(medium: string, content: string): string[] {
  const [firstPart, ...restParts] = content.split(medium);
  const remaining = restParts.join(' ');
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
      await storage.set('defaultKey', toData);
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
  const selected = setUpSelect.value.find(item => item.key === select)
  currentSettingComponent.value = selected?.in || null
}

// 搜索收藏夹
const searchBookmarks = async (query: string) => {
  try {
    if (window.chrome?.bookmarks) {
      const results = await window.chrome.bookmarks.search(query);
      // 过滤掉文件夹，只显示书签
      const bookmarks = results.filter((item: chrome.bookmarks.BookmarkTreeNode) => item.url);

      // 如果查询是纯字母，尝试匹配拼音首字母和完整拼音
      if (/^[a-zA-Z]+$/.test(query)) {
        const pinyinResults = bookmarks.filter(bookmark => {
          // 修复点1：使用正确的拼音样式参数
          // 修复点2：添加扁平化处理(flat)
          const titleFirst = pinyin(bookmark.title, {
            style: pinyin.STYLE_FIRST_LETTER,  // 首字母风格
            heteronym: false
          }).flat().join('').toLowerCase();

          const titleFull = pinyin(bookmark.title, {
            style: pinyin.STYLE_NORMAL,  // 完整拼音风格
            heteronym: false
          }).flat().join('').toLowerCase();

          // 新增调试日志
          console.log('Title:', bookmark.title, 
                     'First:', titleFirst, 
                     'Full:', titleFull);

          return titleFirst.includes(query.toLowerCase()) || 
                 titleFull.includes(query.toLowerCase());
        });

        // 如果有拼音匹配的结果，优先显示
        if (pinyinResults.length > 0) {
          bookmarkResults.value = pinyinResults;
          return;
        }
      }

      // 如果没有拼音匹配的结果，显示原始搜索结果
      bookmarkResults.value = bookmarks;
    }
  } catch (e) {
    console.error('搜索收藏夹失败:', e);
    searchStatusText.value = '搜索收藏夹失败';
  }
};

// 打开收藏夹链接
const openBookmark = (url: string | undefined) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

</script>

<template>
  <div class="relative min-h-screen w-full transition-all duration-300">
    <!-- 主要内容区域 -->
    <div class="relative z-10">
      <div id="base" class="text-slate-700 dark:text-zinc-400 transition-all duration-300" :style="wallpaperType !== 'none' ? {
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}">
        <!-- 保留遮罩层 -->
        <div v-if="wallpaperType !== 'none' && showMask" id="mask"></div>

        <div id="setup" class="flex items-center gap-4 z-[200]">
          <Icon @click="onSetup" icon="line-md:cog-filled"
            class="text-slate-700 text-2xl dark:text-white cursor-pointer hover:text-slate-500 dark:hover:text-gray-300"
            :class="{ '!text-white dark:!text-neutral-800': wallpaperType !== 'none' }">
          </Icon>
        </div>

        <BlurReveal :delay="0.2" :duration="0.75" class="p-8">
          <h2 class="mb-5 text-center font-bold text-8xl text-slate-700 dark:text-zinc-400 select-none cursor-none"
            :class="{ '!text-white dark:!text-neutral-800': wallpaperType !== 'none' }">
            {{ time }}
          </h2>
          <div
            class="mb-30 text-center text-5xl font-bold text-slate-700 dark:text-zinc-400 sm:mb-50 select-none cursor-none"
            :class="{ '!text-white dark:!text-neutral-800': wallpaperType !== 'none' }">
            {{ date }}
          </div>
        </BlurReveal>


        <!-- 搜索框 -->
        <VanishingInput id="vanishing-input" v-model="ide" :placeholders="placeholderArray" @submit="submit"
          ref="vanishingInputRef" />

        <!-- 搜索状态提示框 -->
        <Transition enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in" leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-2 opacity-0">
          <div v-if="searchStatusText" class="input-group mx-auto max-w-xl w-full mt-2 px-4 py-2 rounded-lg text-sm text-center backdrop-blur-md
            bg-white/80 text-gray-800 dark:bg-gray-800/80 dark:text-white
            border border-gray-200 dark:border-gray-700 shadow-lg">
            {{ searchStatusText }}
          </div>
        </Transition>

        <!-- 搜索引擎选择器 -->
        <Transition enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-200 ease-in" leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0">
          <div v-if="showEngineSelector" class="engine-selector mx-auto max-w-3xl w-full mt-4 rounded-xl 
            backdrop-blur-md bg-white/90 dark:bg-gray-800/90 
            border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div class="p-3 bg-gray-100/90 dark:bg-gray-700/90 border-b border-gray-200 dark:border-gray-600">
              <h3 class="font-medium text-gray-800 dark:text-white">可用搜索引擎</h3>
              <p class="text-sm text-gray-500 dark:text-gray-300">点击选择要设置为默认的搜索引擎</p>
            </div>
            <div class="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div v-for="(engine, index) in [...new Set(Array.from(jumpToData?.values() || []).map(e => e.label))]
                .map(label => Array.from(jumpToData?.values() || []).find(e => e.label === label))" :key="index"
                @click="engine && selectEngine(engine.key[0])" class="engine-item relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-150
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  border border-gray-200 dark:border-gray-600"
                :class="{ 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600': engine && defaultKey === engine.key[0] }">
                <div class="flex-grow">
                  <div class="font-medium text-gray-800 dark:text-white">{{ engine?.label }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    关键词: {{ engine?.key.join(', ') }}
                  </div>
                </div>
                <div v-if="engine && defaultKey === engine.key[0]"
                  class="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  当前默认
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 收藏夹搜索结果 -->
        <Transition enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-200 ease-in" leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0">
          <div v-if="showBookmarkResults" class="bookmark-results mx-auto max-w-3xl w-full mt-4 rounded-xl 
            backdrop-blur-md bg-white/90 dark:bg-gray-800/90 
            border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div class="p-2 bg-gray-100/90 dark:bg-gray-700/90 border-b border-gray-200 dark:border-gray-600">
              <h3 class="font-medium text-gray-800 dark:text-white text-sm">收藏夹搜索结果</h3>
            </div>
            <div class="p-2 space-y-1 max-h-[200px] overflow-y-auto" ref="bookmarkResultsContainer">
              <div v-for="(bookmark, index) in bookmarkResults.slice(0, 5)" :key="index"
                @click="openBookmark(bookmark.url)" class="bookmark-item p-2 rounded-lg cursor-pointer transition-all duration-150
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  border border-gray-200 dark:border-gray-600" :class="{
                    'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 ring-2 ring-blue-500 dark:ring-blue-400':
                      index === selectedBookmarkIndex
                  }">
                <div class="flex items-center gap-2">
                  <div class="flex-grow min-w-0">
                    <div class="font-medium text-gray-800 dark:text-white text-sm truncate">{{ bookmark.title }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ bookmark.url }}</div>
                  </div>
                  <div v-if="index === selectedBookmarkIndex" class="text-xs text-blue-500 dark:text-blue-400">
                    按Enter打开
                  </div>
                </div>
              </div>
              <div v-if="bookmarkResults.length === 0"
                class="text-center text-gray-500 dark:text-gray-400 py-2 text-sm">
                未找到匹配的收藏夹
              </div>
              <div v-if="bookmarkResults.length > 5" class="text-center text-gray-500 dark:text-gray-400 py-1 text-xs">
                还有 {{ bookmarkResults.length - 5 }} 个结果未显示
              </div>
            </div>
          </div>
        </Transition>

        <Dialog :show="setup.show" :select="setUpSelect" title="设置" @close="setup.show = false">
          <div class="space-y-4 w-[100%] h-[100%]">
            <div class="flex flex-row justify-center w-[100%] h-[100%]">
              <div class="w-[20%] h-[100%] border-r-1 border-dotted select-none px-2">
                <div class="h-[20%] bg-amber-600">123</div>
                <div v-for="(select, index) in setUpSelect" :key="index"
                  class="flex flex-row content-center items-center w-[100%] p-1.5 rounded-xl text-gray-900 pl-[18%]"
                  :style="selectedSection == select.key ? { backgroundColor: '#006BDF', color: 'white' } : {}"
                  @click="setUpClick(select.key)">
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
  background-repeat: no-repeat;
  background-size: cover;
  transition: background-image 0.3s ease-in-out;
}

#mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.15);
}

.p-8,
#vanishing-input,
.input-group,
.engine-selector {
  position: relative;
  /* 建立新的层级上下文 */
  z-index: 2;
  /* 必须大于 #mask 的 z-index */
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
  transition: transform 0.15s ease;
}

.engine-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

@media(prefers-color-scheme: dark) {
  #base {
    background-color: #09090B;
  }
}

@media(prefers-color-scheme: light) {
  #base {
    background-color: aliceblue;
  }
}

/* 添加过渡效果 */
.fade-bg-enter-active,
.fade-bg-leave-active {
  transition: opacity 0.3s ease;
}

.fade-bg-enter-from,
.fade-bg-leave-to {
  opacity: 0;
}

/* 添加壁纸相关过渡效果 */
.bg-transition {
  transition: background-image 0.3s ease-in-out;
}

/* 确保内容在暗色背景上可见 */
.dark .bg-overlay {
  background-color: rgba(0, 0, 0, 0.4);
}

.light .bg-overlay {
  background-color: rgba(255, 255, 255, 0.4);
}

/* 添加搜索状态提示样式 */
.search-status {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 确保输入组与搜索框保持一致的层级 */
.input-group {
  position: relative;
  z-index: 2;
  /* 与搜索框保持相同的z-index */
}

/* 收藏夹搜索结果样式 */
.bookmark-item {
  transition: all 0.15s ease;
  padding: 0.5rem;
}

.bookmark-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

/* 选中状态样式 */
.bookmark-item[class*="bg-blue-50"] {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
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
  transition: background-color 0.2s ease;
}

.bookmark-results::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
