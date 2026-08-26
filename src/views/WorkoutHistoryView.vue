<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import AppIcon from '@/components/icon/AppIcon.vue';
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue';
import EmptyState from '@/components/feedback/EmptyState.vue';
import ToastMessage from '@/components/feedback/ToastMessage.vue';
import AppTopBar from '@/components/shell/AppTopBar.vue';
import WorkoutCard from '@/components/workout/WorkoutCard.vue';
import { useAsyncAction } from '@/composables/useAsyncAction';
import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';
import { useWorkoutHistory } from '@/composables/useWorkoutHistory';
import { describeWorkoutDeletion, formatCount, formatWorkoutDayLong } from '@/presentation/italianFormat';
import { todayLocalDate } from '@/domain/localDate';
import type { Workout } from '@/domain/workout';

const history = useWorkoutHistory();
const router = useRouter();

onMounted(() => {
    void sharedLoadingIndicator.track(() => history.reload());
});

const subtitle = computed(() => formatCount(history.allWorkouts.value.length, 'giornata registrata', 'giornate registrate'));
const todayLabel = computed(() => {
    const today = todayLocalDate();
    return formatWorkoutDayLong(today);
});
const hasEntries = computed(() => history.todayEntries.value.length > 0 || history.previousEntries.value.length > 0);
const filterIsActive = computed(() => history.groupFilter.value !== undefined);

const pendingDelete = ref<Workout>();
const toastMessage = ref<string>();

function openWorkout(workout: Workout): void {
    void router.push({ name: 'workout', params: { id: workout.id } });
}

function askDelete(workout: Workout): void {
    pendingDelete.value = workout;
}

function cancelDelete(): void {
    pendingDelete.value = undefined;
}

const deleteAction = useAsyncAction(async () => {
    const workout = pendingDelete.value;
    if (!workout) {
        return;
    }
    try {
        await history.remove(workout.id);
        toastMessage.value = 'Giornata eliminata';
    } finally {
        pendingDelete.value = undefined;
    }
});

const deleteBody = computed(() => (pendingDelete.value ? describeWorkoutDeletion(pendingDelete.value) : ''));
</script>

<template>
  <AppTopBar
    title="Allenamenti"
    :subtitle="subtitle"
  />

  <RouterLink
    class="btn btn--primary btn--block new-workout"
    :to="{ name: 'new' }"
  >
    <AppIcon name="plus" />Nuovo allenamento
  </RouterLink>

  <div class="filter-field">
    <label class="field">
      <span>Filtra per gruppo muscolare</span>
      <select v-model="history.groupFilter.value">
        <option :value="undefined">Tutti</option>
        <option
          v-for="group in history.availableGroupFilters.value"
          :key="group"
          :value="group"
        >
          {{ group }}
        </option>
      </select>
    </label>
  </div>

  <EmptyState
    v-if="!hasEntries && filterIsActive"
    icon="empty"
    title="Nessun allenamento con questo gruppo"
    description="Cambia il filtro oppure registra una nuova giornata."
  />
  <EmptyState
    v-else-if="!hasEntries"
    icon="dumbbell"
    title="Nessun allenamento registrato"
    description="Crea la tua prima giornata di allenamento."
  />
  <template v-else>
    <template v-if="history.todayEntries.value.length > 0">
      <div class="sec">
        <h2>Oggi</h2>
        <span>{{ todayLabel }}</span>
      </div>
      <div class="stack">
        <WorkoutCard
          v-for="workout in history.todayEntries.value"
          :key="workout.id"
          :workout="workout"
          highlight-today
          @open="openWorkout(workout)"
          @delete="askDelete(workout)"
        />
      </div>
    </template>
    <template v-if="history.previousEntries.value.length > 0">
      <div class="sec">
        <h2>Giornate precedenti</h2>
        <span>{{ history.previousEntries.value.length }}</span>
      </div>
      <div class="stack">
        <WorkoutCard
          v-for="workout in history.previousEntries.value"
          :key="workout.id"
          :workout="workout"
          @open="openWorkout(workout)"
          @delete="askDelete(workout)"
        />
      </div>
    </template>
  </template>

  <ConfirmDialog
    :open="pendingDelete !== undefined"
    title="Eliminare la giornata?"
    :body="deleteBody"
    confirm-label="Elimina"
    :busy="deleteAction.pending.value"
    @cancel="cancelDelete"
    @confirm="deleteAction.run"
  />
  <ToastMessage
    :message="toastMessage"
    @dismissed="toastMessage = undefined"
  />
</template>

<style scoped>
.new-workout {
    margin-top: 8px;
}

.filter-field {
    margin-top: 14px;
}
</style>
