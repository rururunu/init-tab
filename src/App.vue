///
<reference types="chrome" />
<script setup lang="ts">
import VanishingInput from './components/ui/vanishing-input/VanishingInput.vue';
import BlurReveal from './components/ui/blur-reveal/BlurReveal.vue';
import Dialog from './components/ui/dialog/Dialog.vue';
import { Icon } from "@iconify/vue";

import { onBeforeUnmount, onMounted, ref } from 'vue';
import dayjs from "dayjs";
import { getContrastTextColorFromImage } from './lib/utils';
// import { useColorMode } from "@vueuse/core";
// import { computed } from "vue";
import { shallowRef } from 'vue'
import BackgroundSettings from '@/components/settings/BackgroundSettings.vue'


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
    key: ["baidu", "bd"],
    label: "BaiDu百度",
    jumpUrl: `https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=&<query>`
  },
  {
    key: ["google", "gg"],
    label: "Google谷歌",
    jumpUrl: `https://www.google.com/search?q=&<query>`
  },
  {
    key: ["bi", "bing"],
    label: "Bing必应",
    jumpUrl: `https://www.bing.com/search?form=QBLH&q=&<query>&mkt=zh-CN`
  }
];

const jumpData = ref<JumpData[]>(defaultJumpData);
const jumpToData = ref<Map<string, JumpData>>();

const date = ref<string>("");
const time = ref<string>("");
const wallpaperSubscription = ref<string>("https://picsum.photos/1920/1080");
const isWallpaperSubscription = ref<boolean>(true);
const textColor = ref<string | null>(null);
const setup = ref({
  show: false,
})
const selectedSection = ref<string>("background");
const setUpSelect = ref([
  {
    key: "img",
    icon: "line-md:image-twotone",
    label: "背景设置",
    in: BackgroundSettings,
  },
  {
    key: "jump",
    icon: "line-md:search-twotone",
    label: "搜索引擎",
    in: "",
  }
]);
const currentSettingComponent = shallowRef<any>(null)


let timer: number;


onMounted(() => {
  // init();
  updateTextColor();
  updateDateTime();
  timer = window.setInterval(() => { updateDateTime() }, 1000);
  setUpClick(setUpSelect.value[0].key)
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
})

async function updateTextColor() {
  textColor.value = await getContrastTextColorFromImage(wallpaperSubscription.value);
}

const init = () => {
  chrome.storage.local.set(
    {
      jumpData: JSON.stringify(jumpData.value),
      defaultKey: defaultKey.value,
    }, () => { }
  );
  chrome.storage.local.get(["defalutKey", "jumpData"], result => {
    if (result.defaultKey) {
      defaultKey.value = result.defaultKey || "bd";
    }
    if (result.jumpData) {
      jumpData.value = JSON.parse(result.jumpData);
    }
    jumpToData.value = new Map<string, JumpData>();
    jumpData.value.forEach(data => {
      data.key.forEach(key => {
        jumpToData.value?.set(key, data);
      })
    });
  });
}

const refresh = () => {
  chrome.storage.local.get(["defalutKey", "jumpData"], (result) => {
    if (result.defaultKey) {
      defaultKey.value = result.defaultKey;
    }
    if (result.jumpData) {
      jumpData.value = JSON.parse(result.jumpData);
    }
    jumpToData.value = new Map<string, JumpData>();
    jumpData.value.forEach(data => {
      data.key.forEach(key => {
        jumpToData.value?.set(key, data);
      })
    });
  });
}

const updateDateTime = () => {
  const now = dayjs();
  date.value = now.format("YYYY MM DD");
  time.value = now.format("HH:mm:ss")
}

function submit(content: string) {
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

function jumpTo(jumpType: string, toData: string) {
  if (jumpType == null || jumpType == "") {
    jumpType == defaultKey.value;
  }
  if (jumpType == "cd") {
    const jumpData = jumpToData.value?.get(toData);
    if (jumpData != null) {
      defaultKey.value = toData;
      chrome.storage.local.set({ defaultKey: defaultKey.value }, () => {
        refresh();
      });
    }
    return;
  }
  const jumpData = jumpToData.value?.get(jumpType);
  if (jumpData != null) {
    const toUrl = jumpData.jumpUrl.replace("&<query>", toData);
    window.open(toUrl, "_blank", "noopener,noreferrer")
  } else {
    const data = jumpType + toData;
    const toUrl = jumpToData.value?.get(defaultKey.value)?.jumpUrl.replace("&<query>", data);
    window.open(
      toUrl,
      "_blank",
      "noopener,noreferrer"
    );
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

</script>

<template>
  <div id="base" class="text-slate-700 dark:text-zinc-400"
    :style="isWallpaperSubscription ? { backgroundImage: `url(${wallpaperSubscription})` } : {}">
    <div v-if="isWallpaperSubscription" id="mask"></div>
    <div id="setup" class="flex items-center gap-4">
      <Icon @click="onSetup" icon="line-md:cog-filled"
        class="text-slate-700 text-2xl dark:text-white cursor-pointer hover:text-slate-500 dark:hover:text-gray-300"
        :style="isWallpaperSubscription ? { color: `#fff` } : {}">
      </Icon>
    </div>
    <BlurReveal :delay="0.2" :duration="0.75" class="p-8">
      <h2 class="mb-2 text-center font-bold text-5xl text-slate-700 dark:text-zinc-400 select-none cursor-none"
        :style="isWallpaperSubscription ? { color: `#fff` } : {}">
        {{ time }}
      </h2>
      <div class="mb-10 text-center font-bold text-slate-700 dark:dark:text-zinc-400 sm:mb-20 select-none cursor-none"
        :style="isWallpaperSubscription ? { color: `#fff` } : {}">
        {{ date }}
      </div>
      <div class="mb-5 text-center font-bold text-slate-700 dark:dark:text-zinc-400 select-none cursor-none"
        :style="isWallpaperSubscription ? { color: `#fff` } : {}">
        当前默认使用
        {{ jumpToData?.get(defaultKey)?.label }}
        搜索
      </div>
    </BlurReveal>
    <VanishingInput id="vanishing-input" v-model="ide" :placeholders="placeholderArray" @submit="submit">
    </VanishingInput>

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
}

#mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(0px);
}

.p-8,
#vanishing-input {
  position: relative;
  /* 建立新的层级上下文 */
  z-index: 2;
  /* 必须大于 #mask 的 z-index */
}

#setup {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 1rem;
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
</style>
