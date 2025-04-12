<template>
    <button 
        :disabled="disabled"
        :class="[
            'h-9 px-4 rounded-lg text-sm transition-all duration-200 flex items-center gap-2',
            'focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20',
            disabled 
                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700' 
                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800',
            'border focus:border-[#0A84FF]'
        ]"
        v-bind="$attrs"
        @click="$emit('click', $event)"
    >
        <Icon v-if="icon" :icon="icon" class="text-lg" />
        <slot></slot>
    </button>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
    disabled?: boolean
    icon?: string
}>();

defineEmits<{
    click: [event: MouseEvent]
}>();
</script> 