<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import AppIcon from '@/components/icon/AppIcon.vue';
import BusyButton from '@/components/feedback/BusyButton.vue';
import InfoBanner from '@/components/feedback/InfoBanner.vue';
import AppTopBar from '@/components/shell/AppTopBar.vue';
import { useAsyncAction } from '@/composables/useAsyncAction';
import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';
import { useWorkoutDraft } from '@/composables/useWorkoutDraft';
import { useWorkoutHistory } from '@/composables/useWorkoutHistory';
import { isValidLocalDate, todayLocalDate } from '@/domain/localDate';
import type { Workout } from '@/domain/workout';
import { countWorkout } from '@/domain/workoutCounts';
import { formatCount, formatWorkoutDayShort } from '@/presentation/italianFormat';

const history = useWorkoutHistory();
const draft = useWorkoutDraft();
const router = useRouter();

onMounted(() => {
    void sharedLoadingIndicator.track(() => history.reload());
});

const today = todayLocalDate();
const selectedDate = ref(today);
const copyFromId = ref<string>();

const sameDateCount = computed(() => (
    history.allWorkouts.value.filter((workout) => workout.workoutDate === selectedDate.value).length
));
const canCreate = computed(() => isValidLocalDate(selectedDate.value));

function summaryFor(workout: Workout): string {
    const counts = countWorkout(workout);
    const exercisesLabel = formatCount(counts.exercises, 'esercizio', 'esercizi');
    const setsLabel = formatCount(counts.sets, 'serie', 'serie');
    const draftSuffix = workout.status === 'draft' ? ' · bozza' : '';
    return `${exercisesLabel} · ${setsLabel}${draftSuffix}`;
}

function labelFor(workout: Workout): string {
    const dayLabel = formatWorkoutDayShort(workout.workoutDate);
    const groupNames = workout.muscleGroups.map((group) => group.name).join(' > ');
    return `${dayLabel} - ${groupNames}`;
}

const createAction = useAsyncAction(async () => {
    const source = history.copyCandidates.value.find((workout) => workout.id === copyFromId.value);
    const created = await draft.createDraft(selectedDate.value, source);
    await router.push({ name: 'workout', params: { id: created.id } });
});
</script>

<template>
  <AppTopBar
    title="Nuovo allenamento"
    show-back
  />

  <div class="date-field">
    <label class="field">
      <span>Data dell'allenamento</span>
      <input
        v-model="selectedDate"
        type="date"
      >
    </label>
  </div>

  <InfoBanner
    v-if="sameDateCount > 0"
    tone="info"
  >
    In questa data hai già {{ formatCount(sameDateCount, 'allenamento', 'allenamenti') }}.
    Ne verrà creato un altro, nulla viene sovrascritto.
  </InfoBanner>

  <div class="sec">
    <h2>Parti da una giornata precedente</h2>
  </div>
  <div class="stack">
    <button
      type="button"
      class="pick"
      :aria-pressed="copyFromId === undefined"
      @click="copyFromId = undefined"
    >
      <span class="pick-mark"><AppIcon name="check" /></span>
      <span class="pick-body">
        <b>Parti da zero</b>
        <small>Giornata vuota, aggiungi tu i gruppi</small>
      </span>
    </button>
    <button
      v-for="workout in history.copyCandidates.value"
      :key="workout.id"
      type="button"
      class="pick"
      :aria-pressed="copyFromId === workout.id"
      @click="copyFromId = workout.id"
    >
      <span class="pick-mark"><AppIcon name="check" /></span>
      <span class="pick-body">
        <b>{{ labelFor(workout) }}</b>
        <small>{{ summaryFor(workout) }}</small>
      </span>
    </button>
  </div>

  <InfoBanner
    tone="info"
    class="copy-note"
  >
    La copia porta gruppi, esercizi, serie, ripetizioni, pesi e note degli esercizi.
    Non copia la data, lo stato completato e le spunte delle serie.
  </InfoBanner>

  <BusyButton
    class="btn btn--primary btn--block create-button"
    icon="plus"
    :busy="createAction.pending.value"
    :disabled="!canCreate"
    @click="createAction.run"
  >
    Crea allenamento
  </BusyButton>
</template>

<style scoped>
.date-field {
    margin-top: 8px;
}

.copy-note {
    margin-top: 14px;
}

.create-button {
    margin-top: 16px;
}

.pick {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    text-align: left;
    padding: 12px 13px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface);
    color: inherit;
    font: inherit;
}

.pick[aria-pressed="true"] {
    border-color: var(--accent);
    background: var(--accent-soft);
}

.pick-mark {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--border-strong);
    display: grid;
    place-items: center;
    color: var(--accent-ink);
}

.pick-mark svg {
    width: 12px;
    height: 12px;
    opacity: 0;
}

.pick[aria-pressed="true"] .pick-mark {
    border-color: var(--accent);
    background: var(--accent);
}

.pick[aria-pressed="true"] .pick-mark svg {
    opacity: 1;
}

.pick-body {
    flex: 1 1 auto;
    min-width: 0;
}

.pick-body b {
    display: block;
    font-size: 14px;
    text-transform: capitalize;
}

.pick-body small {
    color: var(--text-dim);
    font-size: 12px;
}
</style>
