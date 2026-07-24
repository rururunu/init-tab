<template>
  <div
    ref="container"
    :class="props.class"
  >
    <div
      v-for="(child, index) in children"
      :key="index"
      :style="getRevealStyle(index)"
    >
      <component :is="child" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect, useSlots } from 'vue';
import type { CSSProperties, VNode } from 'vue';

interface Props {
  duration?: number;
  delay?: number;
  blur?: string;
  yOffset?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1,
  delay: 2,
  blur: '20px',
  yOffset: 20,
});

const container = ref(null);
const slots = useSlots();
const children = ref<VNode[]>([]);
const isVisible = ref(false);

onMounted(() => {
  watchEffect(() => {
    children.value = slots.default ? slots.default() : [];
  });
  requestAnimationFrame(() => {
    isVisible.value = true;
  });
});

function getRevealStyle(index: number): CSSProperties {
  return {
    opacity: isVisible.value ? 1 : 0,
    filter: isVisible.value ? 'blur(0px)' : `blur(${props.blur})`,
    transform: `translateY(${isVisible.value ? 0 : props.yOffset}px)`,
    transition: [
      `opacity ${props.duration}s ease-in-out ${props.delay * index}s`,
      `filter ${props.duration}s ease-in-out ${props.delay * index}s`,
      `transform ${props.duration}s ease-in-out ${props.delay * index}s`,
    ].join(', '),
  };
}
</script>
