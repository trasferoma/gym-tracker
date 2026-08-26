<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';

import { filterSuggestionsByQuery } from '@/domain/exerciseSuggestions';

const props = defineProps<{
    groupName: string;
    suggestions: readonly string[];
}>();

const emit = defineEmits<{ add: [name: string]; cancel: [] }>();

const nameInput = ref('');
const inputRef = useTemplateRef('input');
const filtered = computed(() => filterSuggestionsByQuery(props.suggestions, nameInput.value));

function confirm(): void {
    const trimmedName = nameInput.value.trim();
    if (!trimmedName) {
        inputRef.value?.focus();
        return;
    }
    emit('add', trimmedName);
    nameInput.value = '';
}

function pickSuggestion(name: string): void {
    emit('add', name);
    nameInput.value = '';
}
</script>

<template>
  <div class="add-panel">
    <label class="field">
      <span>Nome del nuovo esercizio</span>
      <input
        ref="input"
        v-model="nameInput"
        placeholder="Es. Panca inclinata"
        autocomplete="off"
        @keydown.enter="confirm"
      >
    </label>
    <div
      v-if="suggestions.length > 0"
      class="sugg-region"
      aria-live="polite"
      aria-atomic="true"
    >
      <template v-if="filtered.names.length > 0">
        <div class="sec">
          <h2>Già usati per {{ groupName }}</h2>
        </div>
        <div class="sugg">
          <button
            v-for="name in filtered.names"
            :key="name"
            type="button"
            @click="pickSuggestion(name)"
          >
            {{ name }}
          </button>
        </div>
        <p
          v-if="filtered.hiddenCount > 0"
          class="sugg-more"
        >
          +{{ filtered.hiddenCount }} altri
        </p>
      </template>
      <p
        v-else
        class="sugg-empty"
      >
        Nessun esercizio simile in archivio: sarà un esercizio nuovo.
      </p>
    </div>
    <div class="row-actions">
      <button
        type="button"
        class="btn btn--primary btn--sm"
        @click="confirm"
      >
        Aggiungi
      </button>
      <button
        type="button"
        class="btn btn--ghost btn--sm"
        @click="emit('cancel')"
      >
        Annulla
      </button>
    </div>
  </div>
</template>

<style scoped>
.add-panel {
    margin-top: 11px;
    padding: 12px;
    border-radius: var(--r-md);
    background: var(--surface-2);
    border: 1px solid var(--border);
}

.sec {
    margin: 12px 0 0;
}

.sugg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 9px;
}

.sugg button {
    font: inherit;
    font-size: 12.5px;
    padding: 6px 11px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--text);
}

.sugg button:hover {
    border-color: var(--accent-line);
    color: var(--accent);
}

.sugg-more,
.sugg-empty {
    margin: 8px 0 0;
    font-size: 12.5px;
    color: var(--text-faint);
}
</style>
