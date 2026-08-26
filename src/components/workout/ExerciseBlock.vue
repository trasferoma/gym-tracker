<script setup lang="ts">
import { computed, ref } from 'vue';

import ExercisePicker from './ExercisePicker.vue';
import SetRegister from './SetRegister.vue';
import AppIcon from '@/components/icon/AppIcon.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import { sharedStatisticsPath } from '@/composables/useStatisticsPath';
import { deriveStatKey, schemeLabel } from '@/domain/statistics/statKey';
import type { Exercise, MuscleGroupWorkout } from '@/domain/workout';
import { router } from '@/router';

const props = defineProps<{
    exercise: Exercise;
    group: MuscleGroupWorkout;
    groupPosition: number;
    index: number;
    total: number;
    suggestions: readonly string[];
    draft: UseWorkoutDraft;
}>();

const emit = defineEmits<{ delete: [] }>();

const renaming = ref(false);

const schemeChip = computed(() => schemeLabel(props.exercise.sets.map((set) => set.repetitions)));

function reorderUp(): void {
    props.draft.reorderExercise(props.group.id, props.exercise.id, 'up');
}

function reorderDown(): void {
    props.draft.reorderExercise(props.group.id, props.exercise.id, 'down');
}

function requestDelete(): void {
    emit('delete');
}

function renameExercise(name: string): void {
    props.draft.renameExercise(props.group.id, props.exercise.id, name);
    renaming.value = false;
}

function viewTrend(): void {
    const key = deriveStatKey(props.groupPosition, props.group, props.exercise);
    sharedStatisticsPath.enterFromShortcut(key);
    void router.push({ name: 'statistics' });
}
</script>

<template>
  <div class="ex">
    <div class="ex-head">
      <span class="ex-name">{{ exercise.name }}</span>
      <span class="chip">{{ schemeChip }}</span>
      <button
        type="button"
        class="icon-btn"
        :disabled="index === 0"
        aria-label="Sposta su"
        @click="reorderUp"
      >
        <AppIcon name="up" />
      </button>
      <button
        type="button"
        class="icon-btn"
        :disabled="index === total - 1"
        aria-label="Sposta giù"
        @click="reorderDown"
      >
        <AppIcon name="down" />
      </button>
      <button
        type="button"
        class="icon-btn"
        aria-label="Rinomina esercizio"
        @click="renaming = true"
      >
        <AppIcon name="pencil" />
      </button>
      <button
        type="button"
        class="icon-btn icon-btn--danger"
        aria-label="Elimina esercizio"
        @click="requestDelete"
      >
        <AppIcon name="trash" />
      </button>
    </div>
    <ExercisePicker
      v-if="renaming"
      mode="rename"
      :group-name="group.name"
      :suggestions="suggestions"
      :initial-name="exercise.name"
      @confirm="renameExercise"
      @cancel="renaming = false"
    />
    <p
      v-if="exercise.notes"
      class="ex-note"
    >
      <AppIcon name="note" />
      <span>{{ exercise.notes }}</span>
    </p>
    <SetRegister
      :sets="exercise.sets"
      :group-id="group.id"
      :exercise-id="exercise.id"
      :draft="draft"
      @view-trend="viewTrend"
    />
  </div>
</template>

<style scoped>
.ex + .ex {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
}

.ex-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
}

.ex-name {
    font-weight: 650;
    font-size: 14.5px;
    flex: 1 1 100%;
    min-width: 0;
}

.ex-note {
    margin: 5px 0 0;
    font-size: 12.5px;
    color: var(--text-dim);
    display: flex;
    gap: 6px;
    align-items: flex-start;
}

.ex-note svg {
    width: 13px;
    height: 13px;
    margin-top: 2px;
    flex: 0 0 auto;
    color: var(--text-faint);
}
</style>
