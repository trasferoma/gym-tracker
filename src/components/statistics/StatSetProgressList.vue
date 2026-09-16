<script setup lang="ts">
import { computed } from 'vue';

import StatSetProgressCard from './StatSetProgressCard.vue';
import { listSetProgress } from '@/domain/statistics/setProgress';
import {
    buildSparklineChart,
    MINI_SPARKLINE_DIMENSIONS,
    type SparklineSeries
} from '@/domain/statistics/sparklineGeometry';
import type { StatSession } from '@/domain/statistics/statSessions';
import { formatWorkoutDayCompact } from '@/presentation/italianFormat';

const props = defineProps<{ sessions: readonly StatSession[] }>();

const chart = computed(() => {
    const sessionWeights = props.sessions.map((session) => session.weights);
    return buildSparklineChart(sessionWeights, MINI_SPARKLINE_DIMENSIONS);
});
const setProgressList = computed(() => listSetProgress(props.sessions));
const firstSessionLabel = computed(() => sessionLabelAt(0));
const lastSessionLabel = computed(() => sessionLabelAt(props.sessions.length - 1));

function sessionLabelAt(sessionIndex: number): string {
    const session = props.sessions[sessionIndex];
    return session === undefined ? '' : formatWorkoutDayCompact(session.workoutDate);
}

function seriesFor(setIndex: number): SparklineSeries {
    const series = chart.value.series.find((candidate) => candidate.setIndex === setIndex);
    return series ?? { setIndex, points: [] };
}
</script>

<template>
  <div class="stack">
    <StatSetProgressCard
      v-for="setProgress in setProgressList"
      :key="setProgress.setIndex"
      :series="seriesFor(setProgress.setIndex)"
      :progress="setProgress"
      :dimensions="chart.dimensions"
      :grid-lines="chart.gridLines"
      :first-session-label="firstSessionLabel"
      :last-session-label="lastSessionLabel"
    />
  </div>
</template>
