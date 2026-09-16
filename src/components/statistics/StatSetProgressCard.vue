<script setup lang="ts">
import { computed } from 'vue';

import type { SetProgress, SetProgressDirection } from '@/domain/statistics/setProgress';
import type {
    SparklineDimensions,
    SparklinePoint,
    SparklineSeries,
    WeightGridLine
} from '@/domain/statistics/sparklineGeometry';
import { formatWeight, formatWeightDifference, formatWorkoutDayCompact } from '@/presentation/italianFormat';

const LINE_COLOR_COUNT = 6;
const VALUE_LABEL_OFFSET = 5;
const GRID_LABEL_OFFSET = 3;
const AXIS_LABEL_OFFSET = 3;
const DIRECTION_ARROWS: Record<SetProgressDirection, string> = { up: '↑', down: '↓', flat: '—' };

const props = defineProps<{
    series: SparklineSeries;
    progress: SetProgress;
    dimensions: SparklineDimensions;
    gridLines: readonly WeightGridLine[];
    firstSessionLabel: string;
    lastSessionLabel: string;
}>();

const setNumber = computed(() => props.series.setIndex + 1);
const colorIndex = computed(() => (props.series.setIndex % LINE_COLOR_COUNT) + 1);
const chartLabel = computed(() => `Progressione del peso della serie ${setNumber.value}`);
const pointsAttribute = computed(() => props.series.points.map(formatPoint).join(' '));
const firstPoint = computed(() => props.series.points[0]);
const lastPoint = computed(() => (props.series.points.length > 1 ? props.series.points.at(-1) : undefined));
const previousComparison = computed(() => {
    const comparison = props.progress.comparison;
    return comparison.kind === 'previous' ? comparison : undefined;
});

function formatPoint(point: SparklinePoint): string {
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
}

function directionArrow(direction: SetProgressDirection): string {
    return DIRECTION_ARROWS[direction];
}
</script>

<template>
  <div class="card set-card">
    <span
      class="set-tag"
      :class="`tx${colorIndex}`"
    >S{{ setNumber }}</span>
    <svg
      class="set-chart"
      :viewBox="`0 0 ${dimensions.width} ${dimensions.height}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="chartLabel"
    >
      <template
        v-for="gridLine in gridLines"
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
          :y="gridLine.y + GRID_LABEL_OFFSET"
        >
          {{ formatWeight(gridLine.weight) }}
        </text>
      </template>
      <polyline
        class="ln"
        :class="`ln${colorIndex}`"
        :points="pointsAttribute"
      />
      <circle
        v-for="point in series.points"
        :key="point.x"
        :class="`dt${colorIndex}`"
        :cx="point.x"
        :cy="point.y"
        r="2.2"
      />
      <text
        v-if="firstPoint"
        class="pv"
        :x="firstPoint.x"
        :y="firstPoint.y - VALUE_LABEL_OFFSET"
      >
        {{ formatWeight(firstPoint.weight) }}
      </text>
      <text
        v-if="lastPoint"
        class="pv"
        :x="lastPoint.x"
        :y="lastPoint.y - VALUE_LABEL_OFFSET"
        text-anchor="end"
      >
        {{ formatWeight(lastPoint.weight) }}
      </text>
      <text
        class="axl"
        :x="dimensions.leftMargin"
        :y="dimensions.height - AXIS_LABEL_OFFSET"
      >
        {{ firstSessionLabel }}
      </text>
      <text
        class="axl"
        :x="dimensions.width"
        :y="dimensions.height - AXIS_LABEL_OFFSET"
        text-anchor="end"
      >
        {{ lastSessionLabel }}
      </text>
    </svg>
    <div class="set-latest">
      <span class="set-weight">{{ formatWeight(progress.latestWeight) }} kg</span>
      <template v-if="previousComparison">
        <span
          class="set-delta"
          :class="previousComparison.direction"
        >
          {{ directionArrow(previousComparison.direction) }}
          {{ formatWeightDifference(previousComparison.difference) }} kg
        </span>
        <span class="set-versus">vs {{ formatWorkoutDayCompact(previousComparison.previousDate) }}</span>
      </template>
      <span
        v-else
        class="set-versus"
      >prima volta</span>
    </div>
  </div>
</template>

<style scoped>
.set-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
}

.set-tag {
    flex: 0 0 auto;
    min-width: 26px;
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -.02em;
}

.set-chart {
    flex: 1 1 auto;
    min-width: 0;
    display: block;
    height: 62px;
    overflow: visible;
}

.set-latest {
    flex: 0 0 auto;
    min-width: 62px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
}

.set-weight {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.set-delta {
    font-size: 11.5px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.set-delta.up {
    color: var(--ok);
}

.set-delta.down {
    color: var(--danger);
}

.set-delta.flat {
    color: var(--text-dim);
}

.set-versus {
    font-size: 10.5px;
    color: var(--text-dim);
    white-space: nowrap;
}

.gl {
    stroke: var(--border);
    stroke-width: 1;
}

.axl {
    fill: var(--text-faint);
    font-size: 8.5px;
    font-variant-numeric: tabular-nums;
}

.pv {
    fill: var(--text);
    font-size: 9px;
    font-weight: 700;
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

.tx1 { color: var(--line-1); }
.tx2 { color: var(--line-2); }
.tx3 { color: var(--line-3); }
.tx4 { color: var(--line-4); }
.tx5 { color: var(--line-5); }
.tx6 { color: var(--line-6); }
</style>
