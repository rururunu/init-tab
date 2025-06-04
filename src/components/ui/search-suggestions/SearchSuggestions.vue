<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
    <div
      v-if="suggestions.length > 0 && props.visible"
      class="suggestions-container rounded-xl backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50"
    >
      <!-- 操作提示 -->
      <div
        class="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
      >
      <div class="flex justify-between items-center">
          <span>上下键选择填充 · 回车执行搜索</span>
        </div>
      </div>
      <div
        ref="suggestionsContainer"
        class="p-2 space-y-1 max-h-[28vh] overflow-y-auto"
      >
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="selectSuggestion(suggestion)"
          @mouseenter="selectedIndex = index"
          class="suggestion-item p-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
          :class="{'bg-blue-100 dark:bg-blue-800/60 shadow-sm': index === selectedIndex}"
        >
          <div class="flex items-center gap-2">
            <div class="flex-grow min-w-0">
              <div
                class="font-medium text-gray-800 dark:text-white text-sm"
                v-html="highlightQuery(suggestion)"
              ></div>
            </div>
            <div
              v-if="index === selectedIndex"
              class="flex space-x-2 text-xs text-gray-500 dark:text-gray-400"
            >
              <span
                class="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300"
                >回车搜索</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps<{
  query: string;
  engineType: string;
  visible: boolean;
}>();

const emit = defineEmits(["select", "fill", "close"]);

const suggestions = ref<string[]>([]);
const selectedIndex = ref<number>(-1);
const abortController = ref<AbortController | null>(null);
const suggestionsContainer = ref<HTMLElement | null>(null);

// 根据搜索引擎类型获取不同的API端点
const getApiEndpoint = (engineType: string, query: string): string => {
  switch (engineType) {
    case "bd":
    case "baidu":
      return `https://suggestion.baidu.com/su?wd=${encodeURIComponent(
        query
      )}&cb=window.baiduSuggestionCallback`;
    case "gg":
    case "google":
      return `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(
        query
      )}&jsonp=window.googleSuggestionCallback`;
    case "bi":
    case "bing":
      return `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(
        query
      )}&cb=window.bingSuggestionCallback`;
    default:
      return "";
  }
};

// 高亮查询词
const highlightQuery = (suggestion: string): string => {
  console.log(props.visible);
  if (!props.query) return suggestion;

  // 处理第一个字符为'/'的情况
  let displaySuggestion = suggestion;
  if (displaySuggestion.startsWith("/")) {
    displaySuggestion = displaySuggestion.substring(1);
  }

  const regex = new RegExp(`(${props.query})`, "gi");
  return displaySuggestion.replace(
    regex,
    '<span class="text-blue-500 dark:text-blue-400 font-semibold">$1</span>'
  );
};

// 选择建议（右键点击或回车）- 立即执行搜索
const selectSuggestion = (suggestion: string) => {
  emit("select", suggestion);
};

// 填充建议（左键点击）- 只填充到搜索框不执行搜索
const fillSuggestion = (suggestion: string) => {
  emit("fill", { suggestion, isFillAction: true });
};

// 处理键盘导航
const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.visible || suggestions.value.length === 0) return;

  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      if (selectedIndex.value <= 0) {
        selectedIndex.value = suggestions.value.length - 1;
      } else {
        selectedIndex.value--;
      }
      // 确保填充当前选中项，并标记为键盘选择填充
      if (selectedIndex.value >= 0) {
        fillSuggestion(suggestions.value[selectedIndex.value]);
        emit("fill", { suggestion: suggestions.value[selectedIndex.value], isFillAction: true, isKeyboardFill: true });
      }
      scrollToSelectedSuggestion();
      break;
    case "ArrowDown":
      e.preventDefault();
      if (selectedIndex.value >= suggestions.value.length - 1) {
        selectedIndex.value = 0;
      } else {
        selectedIndex.value++;
      }
      // 确保填充当前选中项，并标记为键盘选择填充
      if (selectedIndex.value >= 0) {
        fillSuggestion(suggestions.value[selectedIndex.value]);
        emit("fill", { suggestion: suggestions.value[selectedIndex.value], isFillAction: true, isKeyboardFill: true });
      }
      scrollToSelectedSuggestion();
      break;
    case "Enter":
      if (
        selectedIndex.value >= 0 &&
        selectedIndex.value < suggestions.value.length
      ) {
        e.preventDefault();
        selectSuggestion(suggestions.value[selectedIndex.value]);
      }
      break;
    case "Escape":
      closeSuggestions();
      break;
  }
};

// 获取搜索建议
const fetchSuggestions = async () => {
  if (!props.query || props.query.length < 2 || !props.engineType) {
    suggestions.value = [];
    selectedIndex.value = -1; // 重置选中索引
    return;
  }

  const queryText = props.query.startsWith("/")
    ? props.query.slice(1)
    : props.query;
  if (queryText.length < 1) {
    suggestions.value = [];
    selectedIndex.value = -1; // 重置选中索引
    return;
  }

  if (abortController.value) {
    abortController.value.abort();
  }

  abortController.value = new AbortController();
  selectedIndex.value = -1; // 获取新建议时重置选中索引

  let apiUrl = "";
  
  // 根据搜索引擎类型选择不同的API
  if (props.engineType === "bd" || props.engineType === "baidu") {
    apiUrl = `https://www.baidu.com/sugrec?prod=pc&wd=${encodeURIComponent(queryText)}`;
  } else if (props.engineType === "gg" || props.engineType === "google") {
    apiUrl = `https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(queryText)}`;
  } else if (props.engineType === "by" || props.engineType === "bing") {
    apiUrl = `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(queryText)}`;
  } else {
    suggestions.value = [];
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      signal: abortController.value.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 处理不同搜索引擎的响应格式
    let results = [];
    if (props.engineType.includes("bd") || props.engineType.includes("baidu")) {
      results = data.g?.map(item => item.q) || [];
    } else if (props.engineType.includes("gg") || props.engineType.includes("google")) {
      results = data[1] || [];
    } else if (props.engineType.includes("by") || props.engineType.includes("bing")) {
      results = data.AS?.Results?.[0]?.Suggests?.map(suggest => suggest.Txt) || [];
    }
    
    suggestions.value = results;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Fetch error:', error);
      suggestions.value = [];
    }
  }
};

// 监听查询变化
watch(
  () => props.query,
  (newQuery) => {
    if (newQuery && newQuery.length > 0) {
      fetchSuggestions();
    } else {
      suggestions.value = [];
      selectedIndex.value = -1; // 重置选中索引
      emit("close");
    }
  },
  { immediate: true }
);

// 监听组件可见性变化
watch(
  () => props.visible,
  (isVisible) => {
    if (!isVisible) {
      // 当组件不可见时清空建议列表
      suggestions.value = [];
    }
  }
);

// 监听选中索引变化
watch(
  () => selectedIndex.value,
  () => {
    scrollToSelectedSuggestion();
  }
);

// 滚动到选中的建议项
const scrollToSelectedSuggestion = () => {
  nextTick(() => {
    if (suggestionsContainer.value && selectedIndex.value >= 0) {
      const container = suggestionsContainer.value;
      const selectedElement = container.querySelector(
        `.suggestion-item:nth-child(${selectedIndex.value + 1})`
      );

      if (selectedElement) {
        // 获取元素位置信息
        const containerRect = container.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        // 判断是否需要滚动
        if (selectedRect.bottom > containerRect.bottom) {
          // 如果选中项在可视区域下方，向下滚动
          container.scrollTop += selectedRect.bottom - containerRect.bottom;
        } else if (selectedRect.top < containerRect.top) {
          // 如果选中项在可视区域上方，向上滚动
          container.scrollTop -= containerRect.top - selectedRect.top;
        }
      }
    }
  });
};

// 监听引擎类型变化
watch(
  () => props.engineType,
  () => {
    if (props.query && props.query.length > 0) {
      fetchSuggestions();
    }
  }
);

// 监听可见性变化
watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      suggestions.value = [];
    } else if (props.query && props.query.length > 0) {
      fetchSuggestions();
    }
  }
);

// 关闭提示框
function closeSuggestions() {
  console.log("Closing search suggestions");
  emit("close");
  suggestions.value = [];
  selectedIndex.value = -1;
}

// 添加全局类型声明
declare global {
  interface Window {
    baiduSuggestionCallback: (data: any) => void;
    googleSuggestionCallback: (data: any) => void;
    bingSuggestionCallback: (data: any) => void;
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

// 组件卸载时移除键盘事件监听
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);

  // 清除全局回调
  if (window.baiduSuggestionCallback) {
    delete window.baiduSuggestionCallback;
  }
  if (window.googleSuggestionCallback) {
    delete window.googleSuggestionCallback;
  }
  if (window.bingSuggestionCallback) {
    delete window.bingSuggestionCallback;
  }

  // 取消未完成的请求
  if (abortController.value) {
    abortController.value.abort();
  }
});
</script>

<style scoped>
.suggestions-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-width: 95vw;
  max-height: 35vh; /* 新增高度限制 */
  overflow-y: auto; /* 新增滚动条 */
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  margin-top: 0.5rem;
}
</style>
