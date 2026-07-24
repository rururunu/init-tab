<template>
  <component
    :is="interactive ? 'a' : 'div'"
    class="quick-link-chip"
    :href="interactive ? link.url : undefined"
    :target="interactive ? '_blank' : undefined"
    :rel="interactive ? 'noopener noreferrer' : undefined"
    :title="link.url"
  >
    <FaviconImg :url="link.url" :size="16" />
    <span>{{ link.label }}</span>
  </component>
</template>

<script setup lang="ts">
import FaviconImg from '@/components/ui/FaviconImg.vue';
import type { QuickLink } from '@/composables/useQuickLinks';

withDefaults(defineProps<{ link: QuickLink; interactive?: boolean }>(), {
  interactive: true,
});
</script>

<style scoped>
.quick-link-chip {
  height: 38px;
  max-width: 180px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(15, 23, 42, 0.18);
  border-radius: 999px;
  color: #374151;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-size: 13px;
  font-weight: 550;
  text-decoration: none;
  transition: transform 0.15s, background 0.15s, border-color 0.15s;
}

.quick-link-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

a.quick-link-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 23, 42, 0.34);
  background: rgba(255, 255, 255, 0.94);
}

@media (prefers-color-scheme: dark) {
  .quick-link-chip {
    color: #e5e7eb;
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(24, 24, 27, 0.68);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  }

  a.quick-link-chip:hover {
    border-color: rgba(255, 255, 255, 0.38);
    background: rgba(39, 39, 42, 0.86);
  }
}
</style>
