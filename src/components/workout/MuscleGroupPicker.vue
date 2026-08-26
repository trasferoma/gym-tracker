<script setup lang="ts">
import type { MuscleGroupName } from '@/domain/muscleGroups';

defineProps<{ groups: readonly MuscleGroupName[] }>();
const emit = defineEmits<{ pick: [name: MuscleGroupName]; cancel: [] }>();
</script>

<template>
  <div class="add-panel">
    <p
      v-if="groups.length === 0"
      class="faint"
    >
      Hai già aggiunto tutti i gruppi disponibili.
    </p>
    <div
      v-else
      class="sugg"
    >
      <button
        v-for="name in groups"
        :key="name"
        type="button"
        @click="emit('pick', name)"
      >
        {{ name }}
      </button>
    </div>
    <div class="row-actions">
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

.add-panel p {
    margin: 0;
    font-size: 13px;
}

.sugg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
</style>
