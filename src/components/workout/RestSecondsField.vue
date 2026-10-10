<script setup lang="ts">
import { ref, watch } from 'vue';

import { parseRestSecondsInput } from '@/domain/restInput';

const props = defineProps<{
    seconds: number;
    label: string;
    visibleLabel?: string | undefined;
}>();

const emit = defineEmits<{ change: [seconds: number]; commit: [] }>();

const text = ref(String(props.seconds));

watch(() => props.seconds, (seconds) => {
    text.value = String(seconds);
});

function handleInput(): void {
    const parsed = parseRestSecondsInput(text.value);
    if (parsed.valid) {
        emit('change', parsed.value);
    }
}

function handleBlur(): void {
    text.value = String(props.seconds);
    emit('commit');
}
</script>

<template>
  <div class="rest-field">
    <span
      v-if="visibleLabel"
      class="rest-label"
      aria-hidden="true"
    >{{ visibleLabel }}</span>
    <span class="rest-in">
      <input
        v-model="text"
        :aria-label="label"
        :title="label"
        inputmode="numeric"
        pattern="[0-9]*"
        @input="handleInput"
        @blur="handleBlur"
      >
      <u>s</u>
    </span>
  </div>
</template>

<style scoped>
.rest-field {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.rest-label {
    font-size: 11px;
    color: var(--text-faint);
    white-space: nowrap;
}

.rest-in {
    position: relative;
    display: block;
    width: 62px;
    flex: 0 0 auto;
}

.rest-in input {
    min-height: 36px;
    padding: 6px 18px 6px 8px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    border-radius: 10px;
}

.rest-in u {
    position: absolute;
    right: 7px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    text-decoration: none;
    color: var(--text-faint);
    pointer-events: none;
}
</style>
