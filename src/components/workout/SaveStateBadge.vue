<script setup lang="ts">
import { computed } from 'vue';

import type { AutosaveStatus } from '@/composables/useAutosave';

const props = defineProps<{ status: AutosaveStatus }>();

const LABELS: Record<AutosaveStatus, string> = {
    saving: 'Salvataggio...',
    saved: 'Salvato',
    error: 'Errore di salvataggio'
};

const label = computed(() => LABELS[props.status]);
</script>

<template>
  <span
    class="save"
    :class="`save--${status}`"
    role="status"
  >
    <i />{{ label }}
  </span>
</template>

<style scoped>
.save {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 8px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    background: var(--surface-2);
    color: var(--text-dim);
    white-space: nowrap;
}

.save i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
}

.save--saved {
    background: var(--ok-soft);
    color: var(--ok);
}

.save--saving {
    background: var(--surface-3);
    color: var(--text-dim);
}

.save--saving i {
    animation: pulse 1s ease-in-out infinite;
}

.save--error {
    background: var(--danger-soft);
    color: var(--danger);
}

@keyframes pulse {
    0%, 100% {
        opacity: .25;
    }

    50% {
        opacity: 1;
    }
}
</style>
