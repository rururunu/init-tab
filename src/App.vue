<script setup lang="ts">
import VanishingInput from './components/ui/vanishing-input/VanishingInput.vue';
import BlurReveal from './components/ui/blur-reveal/BlurReveal.vue';

import { onBeforeUnmount, onMounted, ref } from 'vue';
import dayjs from "dayjs";
import { getContrastTextColorFromImage } from './lib/utils';


type JumpData = {
  key: string[],
  label: string,
  jumpUrl: string
}

const defaultKey = ref<string>(localStorage.getItem("defaultKey") || "bd");
const ide = ref<string>("");
const placeholderArray = ref<string[]>(
  [
    "Hello!!🖐️",
    "尝试输入bd[空格]或gg[空格]和bi[空格]加上你的搜索内容吧😎",
    "输入cd[空格]加上搜索引擎的key,可以切换默认搜索引擎哦😋"
  ]
);
const jumpData = ref<JumpData[]>(
  [
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
  ]
);
const jumpToData = ref<Map<string, JumpData>>();
const date = ref<string>("");
const time = ref<string>("");
const wallpaperSubscription = ref<string>("https://picsum.photos/id/237/1920/1080");
const isWallpaperSubscription = ref<boolean>(false);
const textColor = ref<string | null>(null);

let timer: number;


onMounted(() => {
  init();
  updateTextColor();
  updateDateTime();
  timer = window.setInterval(() => { updateDateTime() }, 1000);
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
})

async function updateTextColor() {
  textColor.value = await getContrastTextColorFromImage(wallpaperSubscription.value);
}

const init = () => {
  jumpToData.value = new Map<string, JumpData>();
  jumpData.value.forEach(data => {
    data.key.forEach(key => {
      jumpToData.value?.set(key, data);
    })
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
      localStorage.setItem("defaultKey", defaultKey.value);
    }
    return;
  }
  const jumpData = jumpToData.value?.get(jumpType);
  if (jumpData != null) {
    const toUrl = jumpData.jumpUrl.replace("&<query>", toData);
    window.open(toUrl, "_blank", "noopener,noreferrer")
  } else {
    const toUrl = jumpType + toData;
    window.open(
      `https://www.baidu.com/s?tn=22073068_8_oem_dg&ch=2&ie=utf-8&word=${toUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
}

</script>

<template>
  <div id="base" :style="isWallpaperSubscription ? { backgroundImage: `url(${wallpaperSubscription})` } : {}">
    <div id="mask"></div>
    <BlurReveal :delay="0.2" :duration="0.75" class="p-8">
      <h2 class="mb-2 text-center font-bold text-5xl text-slate-700 dark:text-zinc-400 select-none cursor-none"
        :style="isWallpaperSubscription ? { color: `#fff` } : {}">
        {{ time }}
      </h2>
      <div class="mb-10 text-center text-slate-700 dark:dark:text-zinc-400 sm:mb-20 select-none cursor-none"
        :style="isWallpaperSubscription ? { color: `#fff` } : {}">{{ date }}</div>
      <div class="mb-5 text-center font-bold text-slate-700 dark:dark:text-zinc-400 select-none cursor-none"
        :style="isWallpaperSubscription ? { color: `#fff` } : {}">
        当前默认使用
        {{ jumpToData?.get(defaultKey)?.label }}
        搜索
      </div>
    </BlurReveal>
    <VanishingInput id="vanishing-input" v-model="ide" :placeholders="placeholderArray" @submit="submit">
    </VanishingInput>
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
