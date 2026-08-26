<script setup lang="ts">
import { nextTick, onUnmounted, useId, useTemplateRef, watch } from 'vue';

import BusyButton from './BusyButton.vue';

const props = withDefaults(defineProps<{
    open: boolean;
    title: string;
    body: string;
    confirmLabel?: string;
    busy?: boolean;
}>(), {
    confirmLabel: 'Elimina',
    busy: false
});

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const titleId = useId();
const boxRef = useTemplateRef('box');

watch(() => props.open, (isOpen) => {
    if (isOpen) {
        document.addEventListener('keydown', handleKeydown);
        void nextTick(() => boxRef.value?.focus());
    } else {
        document.removeEventListener('keydown', handleKeydown);
    }
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});

function requestCancel(): void {
    if (props.busy) {
        return;
    }
    emit('cancel');
}

function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        requestCancel();
    }
}
</script>

<template>
  <div
    v-if="open"
    class="confirm"
    @click.self="requestCancel"
  >
    <div
      ref="box"
      class="confirm-box"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <h3 :id="titleId">
        {{ title }}
      </h3>
      <p>{{ body }}</p>
      <div class="row-actions">
        <button
          type="button"
          class="btn btn--outline"
          :disabled="busy"
          @click="requestCancel"
        >
          Annulla
        </button>
        <BusyButton
          class="btn btn--danger"
          :busy="busy"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </BusyButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: end center;
    padding: 14px;
    background: rgba(9, 11, 10, .72);
    z-index: 6;
}

.confirm-box {
    width: 100%;
    padding: 16px;
    border-radius: var(--r-xl);
    background: var(--surface);
    border: 1px solid var(--border-strong);
}

.confirm-box h3 {
    margin: 0 0 6px;
    font-size: 16.5px;
}

.confirm-box p {
    margin: 0 0 14px;
    font-size: 13.5px;
    color: var(--text-dim);
}

.confirm-box .row-actions {
    margin-top: 0;
}
</style>
