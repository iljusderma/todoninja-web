<template>
    <div @click.stop="() => doneClick()" v-if="!done" :class="`w-4 h-4 border-2 ${borderClass} rounded`"></div>
    <div
        @click.stop="$emit('input', null)"
        v-else
        class="w-4 h-4 border-2 border-green-600 rounded bg-green-600 flex flex-row items-center justify-center"
    >
        <i class="hero solid check text-white text-base"></i>
    </div>
</template>

<script lang="ts" setup>
import { computed } from '@vue/reactivity'
import { DateTime } from 'luxon'

const props = withDefaults(defineProps<{ value: DateTime | null; borderClass?: string }>(), {
    borderClass: 'border-on-surface',
})
const emit = defineEmits(['input'])

const done = computed(() => props.value != null && props.value <= DateTime.now())
const doneClick = () => emit('input', DateTime.now())
</script>
