<script setup lang="ts">
import { computed } from 'vue';

import RestSecondsField from './RestSecondsField.vue';
import AppIcon, { type IconName } from '@/components/icon/AppIcon.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import { isMultipleCluster } from '@/domain/exerciseClusters';
import type { ExerciseCluster, ExerciseClusterKind } from '@/domain/workout';
import {
    formatClusterKind,
    formatRestAfterRoundLabel,
    formatRestAfterRoundShortLabel,
    formatRestBetweenExercisesLabel,
    formatRestBetweenExercisesShortLabel
} from '@/presentation/clusterLabels';

const props = defineProps<{
    cluster: ExerciseCluster;
    groupId: string;
    index: number;
    total: number;
    draft: UseWorkoutDraft;
}>();

const KIND_ICONS: Readonly<Partial<Record<ExerciseClusterKind, IconName>>> = {
    superset: 'bolt',
    circuit: 'cycle'
};

const isMultiple = computed(() => isMultipleCluster(props.cluster));
const isCircuit = computed(() => props.cluster.kind === 'circuit');
const kindLabel = computed(() => formatClusterKind(props.cluster.kind));
const kindIcon = computed(() => KIND_ICONS[props.cluster.kind]);
const restAfterRoundLabel = computed(() => formatRestAfterRoundLabel(props.cluster.kind));
const restAfterRoundShortLabel = computed(() => formatRestAfterRoundShortLabel(props.cluster.kind));
const topRowRestShortLabel = computed(() => (
    props.cluster.kind === 'single' ? restAfterRoundShortLabel.value : undefined
));
const restBetweenExercisesLabel = formatRestBetweenExercisesLabel();
const restBetweenExercisesShortLabel = formatRestBetweenExercisesShortLabel();

function updateRestAfterRound(seconds: number): void {
    props.draft.updateClusterRestAfterRound(props.groupId, props.cluster.id, seconds);
}

function updateRestBetweenExercises(seconds: number): void {
    props.draft.updateClusterRestBetweenExercises(props.groupId, props.cluster.id, seconds);
}

function saveNow(): void {
    void props.draft.flushPendingSave();
}

function changeKind(kind: ExerciseClusterKind): void {
    props.draft.changeClusterKind(props.groupId, props.cluster.id, kind);
}

function reorderUp(): void {
    props.draft.reorderCluster(props.groupId, props.cluster.id, 'up');
}

function reorderDown(): void {
    props.draft.reorderCluster(props.groupId, props.cluster.id, 'down');
}
</script>

<template>
  <div class="cl-head">
    <div class="cl-top">
      <span class="cl-kind">
        <AppIcon
          v-if="kindIcon"
          :name="kindIcon"
        />{{ kindLabel }}
      </span>
      <RestSecondsField
        v-if="!isCircuit"
        :seconds="cluster.restAfterRoundSeconds"
        :label="restAfterRoundLabel"
        :visible-label="topRowRestShortLabel"
        @change="updateRestAfterRound"
        @commit="saveNow"
      />
      <span class="spacer" />
      <template v-if="isMultiple">
        <button
          type="button"
          class="icon-btn cl-kind-btn"
          :aria-pressed="cluster.kind === 'superset'"
          aria-label="Imposta superserie"
          @click="changeKind('superset')"
        >
          <AppIcon name="bolt" />
        </button>
        <button
          type="button"
          class="icon-btn cl-kind-btn"
          :aria-pressed="isCircuit"
          aria-label="Imposta circuito"
          @click="changeKind('circuit')"
        >
          <AppIcon name="cycle" />
        </button>
      </template>
      <button
        type="button"
        class="icon-btn"
        :disabled="index === 0"
        aria-label="Sposta raggruppamento su"
        @click="reorderUp"
      >
        <AppIcon name="up" />
      </button>
      <button
        type="button"
        class="icon-btn"
        :disabled="index === total - 1"
        aria-label="Sposta raggruppamento giù"
        @click="reorderDown"
      >
        <AppIcon name="down" />
      </button>
    </div>
    <div
      v-if="isCircuit"
      class="cl-rests"
    >
      <RestSecondsField
        :seconds="cluster.restAfterRoundSeconds"
        :label="restAfterRoundLabel"
        :visible-label="restAfterRoundShortLabel"
        @change="updateRestAfterRound"
        @commit="saveNow"
      />
      <RestSecondsField
        :seconds="cluster.restBetweenExercisesSeconds"
        :label="restBetweenExercisesLabel"
        :visible-label="restBetweenExercisesShortLabel"
        @change="updateRestBetweenExercises"
        @commit="saveNow"
      />
    </div>
  </div>
</template>

<style scoped>
.cl-head {
    margin-bottom: 10px;
}

.cl-top {
    display: flex;
    align-items: center;
    gap: 4px;
}

.cl-top .spacer {
    flex: 1 1 auto;
}

.cl-kind {
    display: inline-flex;
    min-width: 0;
    margin-right: 6px;
    white-space: nowrap;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.cl-kind svg {
    width: 15px;
    height: 15px;
}

.cl-kind-btn[aria-pressed="true"] {
    background: var(--accent-soft);
    color: var(--accent);
}

.cl-rests {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 2px;
}
</style>
