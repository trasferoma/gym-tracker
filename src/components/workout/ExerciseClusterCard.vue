<script setup lang="ts">
import { computed, ref } from 'vue';

import ExerciseBlock from './ExerciseBlock.vue';
import ExerciseClusterHeader from './ExerciseClusterHeader.vue';
import ExercisePicker from './ExercisePicker.vue';
import AppIcon from '@/components/icon/AppIcon.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import { isMultipleCluster } from '@/domain/exerciseClusters';
import type { Exercise, ExerciseCluster, MuscleGroupWorkout } from '@/domain/workout';

const props = defineProps<{
    cluster: ExerciseCluster;
    group: MuscleGroupWorkout;
    index: number;
    total: number;
    colorSlot: number | undefined;
    suggestions: readonly string[];
    draft: UseWorkoutDraft;
}>();

const emit = defineEmits<{ deleteExercise: [exercise: Exercise] }>();

const addingExercise = ref(false);

const isMultiple = computed(() => isMultipleCluster(props.cluster));
const colorClass = computed(() => (
    props.colorSlot === undefined ? undefined : `cluster--${props.colorSlot + 1}`
));

function requestDeleteExercise(exercise: Exercise): void {
    emit('deleteExercise', exercise);
}

function addExerciseToCluster(name: string): void {
    props.draft.addExerciseToCluster(props.group.id, props.cluster.id, name);
    addingExercise.value = false;
}
</script>

<template>
  <div
    class="cluster"
    :class="colorClass"
  >
    <ExerciseClusterHeader
      :cluster="cluster"
      :group-id="group.id"
      :index="index"
      :total="total"
      :draft="draft"
    />
    <ExerciseBlock
      v-for="(exercise, exerciseIndex) in cluster.exercises"
      :key="exercise.id"
      :exercise="exercise"
      :group="group"
      :cluster="cluster"
      :index="exerciseIndex"
      :suggestions="suggestions"
      :draft="draft"
      @delete="requestDeleteExercise(exercise)"
    />
    <template v-if="isMultiple">
      <ExercisePicker
        v-if="addingExercise"
        :group-name="group.name"
        :suggestions="suggestions"
        @confirm="addExerciseToCluster"
        @cancel="addingExercise = false"
      />
      <div
        v-else
        class="row-actions"
      >
        <button
          type="button"
          class="btn btn--outline btn--sm cluster-add"
          @click="addingExercise = true"
        >
          <AppIcon name="plus" />Esercizio
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cluster[class*="cluster--"] {
    padding: 8px 10px 10px;
    border-radius: var(--r-md);
}

.cluster--1 {
    background: var(--cluster-1);
}

.cluster--2 {
    background: var(--cluster-2);
}

.cluster--3 {
    background: var(--cluster-3);
}

.cluster--4 {
    background: var(--cluster-4);
}
</style>
