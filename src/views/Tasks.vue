<template>
    <div class="px-8 min-h-screen grid grid-rows-[auto_1fr] text-on-background">
        <notification-bar-color :color="scrolled ? 'surface-2' : 'surface'" />
        <div
            :class="`grid grid-cols-[auto_1fr_auto] -mx-8 ${
                scrolled ? 'bg-surface-2' : 'bg-surface'
            } px-4 py-4 gap-6 items-center sticky top-0 left-0 right-0 transition`"
        >
            <navigation-drawer>
                <template #trigger="{ open }">
                    <i @click="open" class="hero menu solid text-on-surface text-2xl"></i>
                </template>
                <template #content="{ close }">
                    <navigation-drawer-title>Parchment</navigation-drawer-title>
                    <list-navigation-drawer-items
                        :value="list.id"
                        @input="
                            (id) => {
                                selectedListId = id
                                close()
                            }
                        "
                    ></list-navigation-drawer-items>
                </template>
            </navigation-drawer>
            <div class="text-on-surface text-[22px] text-center">{{ list.name }}</div>
            <div v-if="list.isDefault()" class="w-6"></div>
            <Menu v-else>
                <template #trigger="{ open }">
                    <i @click="open" class="hero dots-vertical solid text-on-surface-variant text-xl"></i>
                </template>
                <template #content="{ close: closeMenu }">
                    <edit-list-dialog :list="list">
                        <template #trigger="{ open }">
                            <menu-item @click="open" icon="pencil">Edit</menu-item>
                        </template>
                    </edit-list-dialog>
                    <Dialog icon="trash">
                        <template #trigger="{ open }">
                            <MenuItem @click="open" icon="trash">Delete</MenuItem>
                        </template>
                        <template #title>Delete this list?</template>
                        <template #content>
                            Do you really want to delete the list "<b>{{ list.name }}</b
                            >"?
                        </template>
                        <template #actions="{ close: closeConfirmation }">
                            <TextButton @click="closeConfirmation()">Cancel</TextButton>
                            <TextButton
                                @click="
                                    closeConfirmation()
                                        .then(() => closeMenu())
                                        .then(() => (selectedListId = null))
                                        .then(() => list.delete())
                                "
                                >Delete</TextButton
                            >
                        </template>
                    </Dialog>
                </template>
            </Menu>
        </div>
        <div class="mt-4 grid grid-rows-[1fr_auto]">
            <transition-group name="flip-list" tag="div">
                <task-item v-for="task of normalTasks" :key="task.id" :task="task" />
            </transition-group>
            <transition-group name="flip-list" tag="div">
                <div
                    v-if="groupedUpcomingTasks?.size > 0"
                    @click="showPostponed = !showPostponed"
                    class="mb-4"
                    key="upcomingtoggle"
                >
                    <div
                        v-if="!showPostponed"
                        class="flex flex-row items-center text-sm text-on-surface-variant mt-8 mb-8 clickable"
                    >
                        <i class="hero chevron-right solid mr-2"></i>
                        Show upcoming tasks
                    </div>
                    <div v-else class="flex flex-row items-center text-sm text-on-surface-variant mt-8 clickable">
                        <i class="hero chevron-down solid mr-2"></i>
                        Hide upcoming tasks
                    </div>
                </div>
                <template v-for="[index, group] of showPostponed ? groupedUpcomingTasks.entries() : []" :key="index">
                    <div class="mb-2 text-sm mt-8 text-on-surface-variant">
                        {{
                            DateTime.fromISO(index).toLocaleString({
                                weekday: 'short',
                                month: 'short',
                                day: '2-digit',
                            })
                        }}
                    </div>
                    <task-item v-for="task of group" :key="task.id" :task="task" />
                </template>
                <div v-if="(doneTasks?.length || 0) > 0" @click="showDone = !showDone" class="mb-4" key="donetoggle">
                    <div
                        v-if="!showDone"
                        class="flex flex-row items-center text-sm text-on-surface-variant mt-8 mb-8 clickable"
                    >
                        <i class="hero chevron-right solid mr-2"></i>
                        Show done tasks
                    </div>
                    <div v-else class="flex flex-row items-center text-sm text-on-surface-variant mt-8 clickable">
                        <i class="hero chevron-down solid mr-2"></i>
                        Hide done tasks
                    </div>
                </div>
                <task-item v-for="task of showDone ? doneTasks : []" :key="task.id" :task="task" />
                <div v-if="showDone || (showPostponed && doneTasks.length < 1)" class="h-8" key="spacing298734"></div>
            </transition-group>
        </div>
        <task-creator-dialog :task="newTask" v-slot="{ open }" @saved="newTaskSaved()">
            <floating-action-button @click="newTaskClick(open)" icon="plus" />
        </task-creator-dialog>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from '@vue/runtime-core'
import { asyncRef } from '../asyncRef'
import TaskItem from '../components/TaskItem.vue'
import { List } from '../models/List'
import { doneScope, normalScope, undoneScope, upcomingScope } from '../models/Task'
import { groupBy } from '../helpers'
import { DateTime } from 'luxon'
import TaskCreatorDialog from '../components/TaskCreatorDialog.vue'
import NavigationDrawer from '../components/NavigationDrawer.vue'
import NavigationDrawerTitle from '../components/NavigationDrawerTitle.vue'
import Dialog from '../components/Dialog.vue'
import Menu from '../components/Menu.vue'
import MenuItem from '../components/MenuItem.vue'
import ListNavigationDrawerItems from '../components/ListNavigationDrawerItems.vue'
import TextButton from '../components/TextButton.vue'
import EditListDialog from '../components/EditListDialog.vue'
import FloatingActionButton from '../components/FloatingActionButton.vue'
import NotificationBarColor from '../components/NotificationBarColor.vue'

const selectedListId = ref<number | null | undefined>(null)
const list = await asyncRef(async () => {
    if (selectedListId.value == null) {
        return List.default()
    }
    return (await List.find(selectedListId.value)) || List.default()
})
const normalTasks = await asyncRef(async () => [
    ...(await list.value
        .tasks()
        .query()
        .where(normalScope)
        .where('deadlineAt', '!=', null)
        .orderBy('deadlineAt', 'asc')
        .get()),
    ...(await list.value.tasks().query().where(normalScope).where('deadlineAt', '==', null).get()),
])
const upcomingTasks = await asyncRef(() =>
    list.value.tasks().query().where(upcomingScope).orderBy('postponedUntil', 'asc').get()
)
const doneTasks = await asyncRef(() => list.value.tasks().query().where(doneScope).orderBy('doneAt', 'desc').get())

const groupedUpcomingTasks = computed(() => groupBy(upcomingTasks.value, (task) => task.postponedUntil!.toISODate()))
const showDone = ref(false)
const showPostponed = ref(false)
const newTask = ref(list.value.tasks().make())
function resetNewTask() {
    newTask.value = list.value.tasks().make()
}
function newTaskClick(opener: () => void) {
    if (list.value.id != newTask.value.listId) {
        resetNewTask()
    }
    opener()
}
function newTaskSaved() {
    resetNewTask()
}

const scrolled = ref(false)
window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
        scrolled.value = true
    } else {
        scrolled.value = false
    }
})
</script>
