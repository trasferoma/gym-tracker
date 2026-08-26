<script setup lang="ts">
import SetRow from './SetRow.vue';
import AppIcon from '@/components/icon/AppIcon.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import type { ExerciseSet } from '@/domain/workout';

const props = defineProps<{
    sets: readonly ExerciseSet[];
    groupId: string;
    exerciseId: string;
    draft: UseWorkoutDraft;
}>();

const emit = defineEmits<{ 'view-trend': [] }>();

function addSet(): void {
    props.draft.addExerciseSet(props.groupId, props.exerciseId);
}

function duplicateLastSet(): void {
    props.draft.duplicateLastExerciseSet(props.groupId, props.exerciseId);
}
</script>

<template>
  <div class="sets">
    <div class="sets-row sets-head">
      <div>#</div>
      <div>Ripetizioni</div>
      <div>Peso</div>
      <div />
      <div />
    </div>
    <SetRow
      v-for="(set, index) in sets"
      :key="set.id"
      :set="set"
      :index="index + 1"
      :group-id="groupId"
      :exercise-id="exerciseId"
      :draft="draft"
    />
  </div>
  <div class="row-actions">
    <button
      type="button"
      class="btn btn--outline btn--sm"
      @click="addSet"
    >
      <AppIcon name="plus" />Serie
    </button>
    <button
      type="button"
      class="btn btn--outline btn--sm"
      :disabled="sets.length === 0"
      @click="duplicateLastSet"
    >
      <AppIcon name="copy" />Duplica ultima
    </button>
    <button
      type="button"
      class="btn btn--ghost btn--sm"
      aria-label="Statistiche di questo esercizio"
      @click="emit('view-trend')"
    >
      <AppIcon name="chart" />
    </button>
  </div>
</template>

<style scoped>
.sets {
    margin-top: 10px;
}

.sets-row {
    display: grid;
    grid-template-columns: 26px 1fr 1fr 38px 30px;
    gap: 10px;
    align-items: center;
}

.sets-row + .sets-row {
    margin-top: 6px;
}

.sets-head {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .09em;
    text-transform: uppercase;
    color: var(--text-faint);
    padding: 0 0 5px;
}

.sets-head > *:nth-child(1) {
    text-align: center;
}
</style>
