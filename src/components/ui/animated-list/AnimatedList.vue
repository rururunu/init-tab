<template>
  <div :class="cn('flex flex-col items-center gap-4', $props.class)">
    <transition-group
      name="list"
      tag="div"
      class="flex flex-col-reverse items-center gap-3"
      move-class="move"
    >
      <div
        v-for="data in itemsToShow"
        :key="data.id"
        :class="cn('mx-auto w-full')"
      >
        <component :is="data.node" />
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useSlots } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  class?: string;
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  delay: 1000,
});

const slots = useSlots();
const displayedItems = ref<{ node: unknown; id: string }[]>([]);
const nextIndex = ref(0);

onMounted(startLoop);

async function startLoop() {
  const notifications = slots.default ? (slots.default()[0].children ?? []) : [];
  if (!notifications.length) return;

  while (displayedItems.value.length < notifications.length) {
    displayedItems.value.push({
      node: notifications[nextIndex.value],
      id: `${nextIndex.value}-${Date.now()}`,
    });
    nextIndex.value = (nextIndex.value + 1) % notifications.length;
    await wait(props.delay);
  }

  while (true) {
    displayedItems.value.shift();
    displayedItems.value.push({
      node: notifications[nextIndex.value],
      id: `${nextIndex.value}-${Date.now()}`,
    });
    nextIndex.value = (nextIndex.value + 1) % notifications.length;
    await wait(props.delay);
  }
}

const itemsToShow = computed(() => displayedItems.value);

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
</script>

<style scoped>
.move {
  transition: transform 0.4s ease-out;
}

.list-enter-active,
.list-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>
