<script setup lang="ts">
import { computed } from 'vue';

import AppIcon from '@/components/icon/AppIcon.vue';
import { countWorkout } from '@/domain/workoutCounts';
import type { Workout } from '@/domain/workout';
import { formatCount, formatWorkoutDayShort } from '@/presentation/italianFormat';

const props = withDefaults(defineProps<{
    workout: Workout;
    highlightToday?: boolean;
}>(), {
    highlightToday: false
});

const emit = defineEmits<{ open: []; delete: [] }>();

const counts = computed(() => countWorkout(props.workout));
const dateLabel = computed(() => formatWorkoutDayShort(props.workout.workoutDate));
</script>

<template>
  <div
    class="wk"
    :class="{ 'wk--today': highlightToday }"
  >
    <div
      class="wk-top"
      role="button"
      tabindex="0"
      @click="emit('open')"
      @keydown.enter="emit('open')"
    >
      <span class="wk-date">{{ dateLabel }}</span>
      <span class="wk-status">
        <span
          class="badge"
          :class="workout.status === 'completed' ? 'badge--done' : 'badge--draft'"
        >
          <i />{{ workout.status === 'completed' ? 'Completato' : 'Bozza' }}
        </span>
      </span>
    </div>
    <div class="wk-chips">
      <span
        v-for="group in workout.muscleGroups"
        :key="group.id"
        class="chip"
      >{{ group.name }}</span>
    </div>
    <div class="wk-foot">
      <span class="num">
        {{ formatCount(counts.exercises, 'esercizio', 'esercizi') }} &middot;
        {{ formatCount(counts.sets, 'serie', 'serie') }}
      </span>
      <button
        type="button"
        class="icon-btn icon-btn--danger"
        aria-label="Elimina allenamento"
        @click="emit('delete')"
      >
        <AppIcon name="trash" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.wk {
    display: block;
    width: 100%;
    text-align: left;
    padding: 13px 14px;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
}

.wk--today {
    border-color: var(--accent-line);
}

.wk-top {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.wk-date {
    font-weight: 700;
    font-size: 15.5px;
    letter-spacing: -.01em;
    text-transform: capitalize;
}

.wk-status {
    margin-left: auto;
}

.wk-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 9px;
}

.wk-foot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding-top: 9px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-dim);
}

.wk-foot .icon-btn {
    margin-left: auto;
}
</style>
