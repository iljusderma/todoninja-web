<template>
    <Menu>
        <template #trigger="{ open }">
            <slot :open="open"></slot>
        </template>
        <template #content="{ close: closeOptions }">
            <DeadlinePickerPopup v-slot="{ open }" :task="task" @change="closeOptions">
                <MenuItem @click="open" icon="flag"> {{ task.deadlineAt ? 'Change' : 'Add' }} Deadline </MenuItem>
            </DeadlinePickerPopup>
            <Dialog icon="trash">
                <template #trigger="{ open }">
                    <MenuItem @click="open" icon="trash"> Delete </MenuItem>
                </template>
                <template #title>Delete this task?</template>
                <template #content>
                    Do you really want to delete the task "<b>{{ task.title }}</b
                    >"?
                </template>
                <template #actions="{ close: closeConfirmation }">
                    <TextButton @click="closeConfirmation()">Cancel</TextButton>
                    <TextButton
                        @click="
                            closeConfirmation()
                                .then(() => closeOptions())
                                .then(() => deleteClick())
                        "
                        >Delete</TextButton
                    >
                </template>
            </Dialog>
        </template>
    </Menu>
</template>

<script setup lang="ts">
import { Task } from '../models/Task'
import DeadlinePickerPopup from './DeadlinePickerPopup.vue'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'
import Dialog from './Dialog.vue'
import TextButton from './TextButton.vue'

const props = defineProps<{ task: Task }>()

function deleteClick() {
    return props.task.delete()
}
</script>
