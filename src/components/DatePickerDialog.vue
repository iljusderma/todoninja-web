<template>
    <Dialog>
        <template #trigger="{ open, close }">
            <slot :open="open" :close="close"></slot>
        </template>
        <template #content="{ close }">
            <lit-datetime-picker-calendar
                startOfWeek="1"
                @input=" (e: any) => $emit('input', DateTime.fromJSDate(e.detail), close) "
                :value="value?.toJSDate()"
            ></lit-datetime-picker-calendar>
        </template>
    </Dialog>
</template>

<script lang="ts" setup>
import Dialog from './Dialog.vue'
import { DateTime } from 'luxon'

defineProps<{ value: DateTime | null }>()
defineEmits<{
    (e: 'input', datetime: DateTime, close: () => Promise<void>): void
}>()
</script>
