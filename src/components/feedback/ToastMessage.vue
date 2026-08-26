<script setup lang="ts">
import { onUnmounted, watch } from 'vue';

const props = defineProps<{ message: string | undefined }>();
const emit = defineEmits<{ dismissed: [] }>();

const TOAST_DURATION_MS = 1900;
let dismissTimer: ReturnType<typeof setTimeout> | undefined;

watch(() => props.message, (message) => {
    clearDismissTimer();
    if (message) {
        dismissTimer = setTimeout(() => emit('dismissed'), TOAST_DURATION_MS);
    }
});

onUnmounted(clearDismissTimer);

function clearDismissTimer(): void {
    if (dismissTimer !== undefined) {
        clearTimeout(dismissTimer);
        dismissTimer = undefined;
    }
}
</script>

<template>
  <div
    v-if="message"
    class="toast"
    role="status"
  >
    {{ message }}
  </div>
</template>

<style scoped>
.toast {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(env(safe-area-inset-bottom) + 78px);
    padding: 9px 15px;
    border-radius: 999px;
    background: var(--surface-3);
    border: 1px solid var(--border-strong);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    z-index: 5;
}
</style>
