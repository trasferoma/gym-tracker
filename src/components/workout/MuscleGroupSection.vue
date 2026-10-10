<script setup lang="ts">
import { computed, ref } from 'vue';

import ExerciseClusterCard from './ExerciseClusterCard.vue';
import ExercisePicker from './ExercisePicker.vue';
import AppIcon from '@/components/icon/AppIcon.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import { findClusterColorSlot } from '@/domain/exerciseClusters';
import { suggestExerciseNames } from '@/domain/exerciseSuggestions';
import type { Exercise, ExerciseCluster, MuscleGroupWorkout, Workout } from '@/domain/workout';
import { countMuscleGroup } from '@/domain/workoutCounts';

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

const groupCounts = computed(() => countMuscleGroup(props.group));
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

function colorSlotOf(cluster: ExerciseCluster): number | undefined {
    return findClusterColorSlot(props.group.clusters, cluster.id);
}

function linkToNext(cluster: ExerciseCluster): void {
    props.draft.linkClusterToNext(props.group.id, cluster.id);
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
        <span class="grp-meta">{{ groupCounts.exercises }} es. &middot; {{ groupCounts.sets }} serie</span>
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
        v-if="groupCounts.exercises === 0"
        class="faint"
      >
        Nessun esercizio in questo gruppo.
      </p>
      <template
        v-for="(cluster, clusterIndex) in group.clusters"
        :key="cluster.id"
      >
        <ExerciseClusterCard
          :cluster="cluster"
          :group="group"
          :index="clusterIndex"
          :total="group.clusters.length"
          :color-slot="colorSlotOf(cluster)"
          :suggestions="suggestions"
          :draft="draft"
          @delete-exercise="requestDeleteExercise"
        />
        <div
          v-if="clusterIndex < group.clusters.length - 1"
          class="cluster-link"
        >
          <button
            type="button"
            class="icon-btn"
            aria-label="Collega al successivo"
            @click="linkToNext(cluster)"
          >
            <AppIcon name="link" />
          </button>
        </div>
      </template>
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

.cluster-link {
    display: flex;
    justify-content: center;
    margin: 2px 0;
}

.chev {
    transition: transform .18s ease;
}

.grp.open .chev {
    transform: rotate(180deg);
}
</style>
