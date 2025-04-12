<template>
    <input 
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :disabled="disabled"
        :placeholder="placeholder"
        class="h-9 px-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 
            rounded-lg text-sm transition-all duration-200
            focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/20
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-zinc-800"
        v-bind="$attrs"
    />
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    type?: string
    disabled?: boolean
    placeholder?: string
}>();

defineEmits<{
    'update:modelValue': [value: string]
}>();
</script> 