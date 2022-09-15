<template>
    <div class="min-h-screen">
        <NotificationBarColor color="surface" />
        <TopAppBar>
            <template #right>
                <TaskOptionsMenu :task="task">
                    <template #default="{ open }">
                        <i
                            @click="open($event)"
                            class="hero dots-vertical outline p-4 -m-4 clickable-bg rounded-full text-on-surface-variant"
                        ></i>
                    </template>
                </TaskOptionsMenu>
            </template>
        </TopAppBar>
        <div class="grid grid-cols-[auto_1fr] gap-4 items-center text-xl p-4 bg-surface">
            <DoneCheckbox :value="task.doneAt" @input="(doneAt) => task.update({ doneAt })" />
            <input
                type="text"
                :value="task.title"
                @input="taskInput($event)"
                ref="input"
                class="bg-transparent w-full text-on-surface"
            />
        </div>
        <TaskActions :task="task" class="p-4 pt-2" />
        <div class="py-8">
            <DeadlineIndicator :task="task" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Task } from '../models/Task'
import { ref } from '@vue/reactivity'
import DoneCheckbox from '../components/DoneCheckbox.vue'
import { asyncRef } from '../asyncRef'
import TaskOptionsMenu from '../components/TaskMenu.vue'
import DeadlineIndicator from '../components/DeadlineIndicator.vue'
import TaskActions from '../components/TaskActions.vue'
import TopAppBar from '../components/TopAppBar.vue'
import NotificationBarColor from '../components/NotificationBarColor.vue'

const props = defineProps<{ id: number }>()
const input = ref<HTMLInputElement | null>(null)

const task = await asyncRef(() => Task.find(props.id))

async function taskInput(event: Event) {
    await task.value.update({
        title: (event.target as any)?.value,
    })
}
</script>
