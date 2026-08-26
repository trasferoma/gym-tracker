<script setup lang="ts">
import { computed } from 'vue';

import { buildSparklineChart, type SparklineSeries } from '@/domain/statistics/sparklineGeometry';
import type { StatSession } from '@/domain/statistics/statSessions';
import { formatWeight, formatWorkoutDayCompact } from '@/presentation/italianFormat';

const LINE_COLOR_COUNT = 6;

const props = defineProps<{ sessions: readonly StatSession[] }>();

const chart = computed(() => {
    const sessionWeights = props.sessions.map((session) => session.weights);
    return buildSparklineChart(sessionWeights);
});
const dimensions = computed(() => chart.value.dimensions);
const firstSessionLabel = computed(() => formatWorkoutDayCompact(props.sessions[0]!.workoutDate));
const lastSessionLabel = computed(() => formatWorkoutDayCompact(props.sessions.at(-1)!.workoutDate));

function colorIndex(series: SparklineSeries): number {
    return (series.setIndex % LINE_COLOR_COUNT) + 1;
}

function pointsAttribute(series: SparklineSeries): string {
    return series.points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}
</script>

<template>
  <div class="card spark">
    <svg
      :viewBox="`0 0 ${dimensions.width} ${dimensions.height}`"
      preserveAspectRatio="none"
      role="img"
      aria-label="Progressione del peso per serie"
    >
      <template
        v-for="gridLine in chart.gridLines"
        :key="gridLine.weight"
      >
        <line
          class="gl"
          :x1="dimensions.leftMargin"
          :y1="gridLine.y"
          :x2="dimensions.width"
          :y2="gridLine.y"
        />
        <text
          class="axl"
          x="0"
          :y="gridLine.y + 3"
        >
          {{ formatWeight(gridLine.weight) }}
        </text>
      </template>
      <template
        v-for="series in chart.series"
        :key="series.setIndex"
      >
        <polyline
          class="ln"
          :class="`ln${colorIndex(series)}`"
          :points="pointsAttribute(series)"
        />
        <circle
          v-for="point in series.points"
          :key="`${series.setIndex}-${point.x}`"
          :class="`dt${colorIndex(series)}`"
          :cx="point.x"
          :cy="point.y"
          r="2.4"
        />
      </template>
      <text
        class="axl"
        :x="dimensions.leftMargin"
        :y="dimensions.height - 4"
      >
        {{ firstSessionLabel }}
      </text>
      <text
        class="axl"
        :x="dimensions.width"
        :y="dimensions.height - 4"
        text-anchor="end"
      >
        {{ lastSessionLabel }}
      </text>
    </svg>
    <div class="spark-legend">
      <span
        v-for="series in chart.series"
        :key="series.setIndex"
      >
        <i :class="`lg${colorIndex(series)}`" />Serie {{ series.setIndex + 1 }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.spark {
    padding: 14px 12px 10px;
}

.spark svg {
    display: block;
    width: 100%;
    height: 132px;
    overflow: visible;
}

.spark-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin-top: 11px;
}

.spark-legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-dim);
}

.spark-legend i {
    width: 12px;
    height: 3px;
    border-radius: 2px;
}

.gl {
    stroke: var(--border);
    stroke-width: 1;
}

.axl {
    fill: var(--text-faint);
    font-size: 9.5px;
    font-variant-numeric: tabular-nums;
}

.ln {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.ln1 { stroke: var(--line-1); }
.ln2 { stroke: var(--line-2); }
.ln3 { stroke: var(--line-3); }
.ln4 { stroke: var(--line-4); }
.ln5 { stroke: var(--line-5); }
.ln6 { stroke: var(--line-6); }

.dt1 { fill: var(--line-1); }
.dt2 { fill: var(--line-2); }
.dt3 { fill: var(--line-3); }
.dt4 { fill: var(--line-4); }
.dt5 { fill: var(--line-5); }
.dt6 { fill: var(--line-6); }

.lg1 { background: var(--line-1); }
.lg2 { background: var(--line-2); }
.lg3 { background: var(--line-3); }
.lg4 { background: var(--line-4); }
.lg5 { background: var(--line-5); }
.lg6 { background: var(--line-6); }
</style>
