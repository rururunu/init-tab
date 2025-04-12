<template>
    <label class="relative flex items-center cursor-pointer">
        <input 
            type="radio"
            :name="name"
            :checked="checked"
            @change="$emit('update:modelValue', value)"
            class="absolute opacity-0 w-0 h-0"
        />
        <div 
            :class="[
                'w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center transition-all duration-200',
                checked 
                    ? 'bg-[#0A84FF] border-[#0A84FF]' 
                    : 'bg-white border-[#8E8E93] dark:border-[#636366] dark:bg-zinc-900',
                'hover:border-[#0A84FF] dark:hover:border-[#0A84FF]'
            ]"
        >
            <svg 
                class="w-3 h-3 transition-all duration-200"
                :style="{ opacity: checked ? 1 : 0 }"
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <path 
                    d="M20 6L9 17L4 12" 
                    stroke="white" 
                    stroke-width="3" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                />
            </svg>
        </div>
        <span class="ml-2 text-sm text-gray-900 dark:text-zinc-100">
            <slot></slot>
        </span>
    </label>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    value: string
    name: string
    checked: boolean
}>();

defineEmits<{
    'update:modelValue': [value: string]
}>();
</script> 