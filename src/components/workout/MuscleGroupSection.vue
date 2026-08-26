<script setup lang="ts">
import { computed, ref } from 'vue';

import ExerciseBlock from './ExerciseBlock.vue';
import ExercisePicker from './ExercisePicker.vue';
import AppIcon from '@/components/icon/AppIcon.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import { suggestExerciseNames } from '@/domain/exerciseSuggestions';
import type { Exercise, MuscleGroupWorkout, Workout } from '@/domain/workout';

const props = defineProps<{
    group: MuscleGroupWorkout;
    groupPosition: number;
    index: number;
    total: number;
    workouts: readonly Workout[];
    draft: UseWorkoutDraft;
}>();

const emit = defineEmits<{ delete: []; deleteExercise: [exercise: Exercise] }>();

const expanded = ref(true);
const addingExercise = ref(false);

const exerciseCount = computed(() => props.group.exercises.length);
const setCount = computed(() => props.group.exercises.reduce((total, exercise) => total + exercise.sets.length, 0));
const suggestions = computed(() => suggestExerciseNames(props.workouts, props.group.name));

function toggleExpanded(): void {
    expanded.value = !expanded.value;
}

function reorderUp(): void {
    props.draft.reorderMuscleGroup(props.group.id, 'up');
}

function reorderDown(): void {
    props.draft.reorderMuscleGroup(props.group.id, 'down');
}

function requestDelete(): void {
    emit('delete');
}

function requestDeleteExercise(exercise: Exercise): void {
    emit('deleteExercise', exercise);
}

function addExercise(name: string): void {
    props.draft.addExercise(props.group.id, name);
    addingExercise.value = false;
}
</script>

<template>
  <section
    class="card grp"
    :class="{ open: expanded }"
  >
    <div class="grp-head">
      <span class="grp-pos">{{ groupPosition }}</span>
      <span>
        <span class="grp-name">{{ group.name }}</span>
        <span class="grp-meta">{{ exerciseCount }} es. &middot; {{ setCount }} serie</span>
      </span>
      <span class="spacer" />
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
        class="icon-btn icon-btn--danger"
        aria-label="Elimina gruppo"
        @click="requestDelete"
      >
        <AppIcon name="trash" />
      </button>
      <button
        type="button"
        class="icon-btn"
        :aria-expanded="expanded"
        aria-label="Espandi o riduci"
        @click="toggleExpanded"
      >
        <AppIcon
          name="chev"
          class="chev"
        />
      </button>
    </div>
    <div
      v-if="expanded"
      class="grp-body"
    >
      <p
        v-if="group.exercises.length === 0"
        class="faint"
      >
        Nessun esercizio in questo gruppo.
      </p>
      <ExerciseBlock
        v-for="(exercise, exerciseIndex) in group.exercises"
        :key="exercise.id"
        :exercise="exercise"
        :group="group"
        :group-position="groupPosition"
        :index="exerciseIndex"
        :total="group.exercises.length"
        :suggestions="suggestions"
        :draft="draft"
        @delete="requestDeleteExercise(exercise)"
      />
      <ExercisePicker
        v-if="addingExercise"
        :group-name="group.name"
        :suggestions="suggestions"
        @confirm="addExercise"
        @cancel="addingExercise = false"
      />
      <div
        v-else
        class="row-actions"
      >
        <button
          type="button"
          class="btn btn--outline btn--sm"
          @click="addingExercise = true"
        >
          <AppIcon name="plus" />Esercizio
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grp {
    overflow: hidden;
}

.grp + .grp {
    margin-top: 12px;
}

.grp-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 10px 11px 12px;
    background: var(--surface-2);
    border-bottom: 1px solid transparent;
}

.grp.open .grp-head {
    border-bottom-color: var(--border);
}

.grp-pos {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 11px;
    font-weight: 800;
}

.grp-name {
    display: block;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -.01em;
}

.grp-meta {
    display: block;
    font-size: 11.5px;
    color: var(--text-faint);
}

.grp-head .spacer {
    flex: 1 1 auto;
}

.grp-body {
    padding: 12px;
}

.grp-body .faint {
    margin: 2px 0 0;
    font-size: 13px;
}

.chev {
    transition: transform .18s ease;
}

.grp.open .chev {
    transform: rotate(180deg);
}
</style>
