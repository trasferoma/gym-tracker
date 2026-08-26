<script setup lang="ts">
import { computed, onMounted } from 'vue';

import AppIcon from '@/components/icon/AppIcon.vue';
import AppTopBar from '@/components/shell/AppTopBar.vue';
import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';
import { useWorkoutHistory } from '@/composables/useWorkoutHistory';
import { countWorkout } from '@/domain/workoutCounts';
import { formatCount, formatWorkoutDayShort } from '@/presentation/italianFormat';

const history = useWorkoutHistory();

onMounted(() => {
    void sharedLoadingIndicator.track(() => history.reload());
});

const draftCounts = computed(() => (history.currentDraft.value ? countWorkout(history.currentDraft.value) : undefined));
const lastCompletedGroups = computed(() => (
    history.lastCompletedWorkout.value?.muscleGroups.map((group) => group.name).join(' > ') ?? ''
));
</script>

<template>
  <AppTopBar />
  <div class="home">
    <img
      class="home-logo"
      src="/logo-320.png"
      alt=""
      width="320"
      height="320"
    >
    <h2 class="home-name">
      Gym Tracker
    </h2>
    <p class="home-sub">
      Il registro dei tuoi allenamenti, sempre offline.
    </p>

    <div
      v-if="history.currentDraft.value"
      class="card home-draft"
    >
      <div class="wk-top">
        <span class="badge badge--draft"><i />In corso</span>
        <span class="wk-time num">{{ formatWorkoutDayShort(history.currentDraft.value.workoutDate) }}</span>
      </div>
      <div class="wk-chips">
        <span
          v-for="group in history.currentDraft.value.muscleGroups"
          :key="group.id"
          class="chip"
        >
          {{ group.name }}
        </span>
      </div>
      <div
        v-if="draftCounts"
        class="wk-foot"
      >
        <span class="num">
          {{ formatCount(draftCounts.exercises, 'esercizio', 'esercizi') }} &middot;
          {{ formatCount(draftCounts.sets, 'serie', 'serie') }}
        </span>
      </div>
      <RouterLink
        class="btn btn--primary btn--block btn--sm resume"
        :to="{ name: 'workout', params: { id: history.currentDraft.value.id } }"
      >
        Riprendi
      </RouterLink>
    </div>

    <RouterLink
      class="btn btn--block new-workout"
      :class="history.currentDraft.value ? 'btn--outline' : 'btn--primary'"
      :to="{ name: 'new' }"
    >
      <AppIcon name="plus" />Nuovo allenamento
    </RouterLink>

    <p
      v-if="history.lastCompletedWorkout.value"
      class="home-last"
    >
      Ultima giornata completata:
      <b>{{ formatWorkoutDayShort(history.lastCompletedWorkout.value.workoutDate) }}</b>
      <br>
      {{ lastCompletedGroups }}
    </p>

    <RouterLink
      class="btn btn--ghost btn--block history-link"
      :to="{ name: 'history' }"
    >
      Vai allo storico<AppIcon name="next" />
    </RouterLink>
  </div>
</template>

<style scoped>
.home {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    text-align: center;
    padding-top: 10px;
}

.home-logo {
    display: block;
    width: 62%;
    max-width: 216px;
    height: auto;
    margin: 8px auto 16px;
}

.home-name {
    margin: 0;
    font-size: 27px;
    font-weight: 800;
    letter-spacing: -.035em;
}

.home-sub {
    margin: 7px 0 0;
    color: var(--text-dim);
    font-size: 13.5px;
}

.home-draft {
    text-align: left;
    padding: 13px 14px;
    margin-top: 24px;
}

.wk-top {
    display: flex;
    align-items: center;
    gap: 8px;
}

.wk-time {
    margin-left: auto;
}

.wk-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 9px;
}

.wk-foot {
    margin-top: 9px;
    font-size: 12px;
    color: var(--text-dim);
}

.resume {
    margin-top: 11px;
}

.new-workout {
    margin-top: 12px;
}

.home-last {
    margin: 22px 0 0;
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--text-faint);
}

.home-last b {
    color: var(--text-dim);
    font-weight: 650;
    text-transform: capitalize;
}

.history-link {
    margin-top: auto;
    margin-bottom: 4px;
}

.history-link svg {
    width: 15px;
    height: 15px;
}
</style>
