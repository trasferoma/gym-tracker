<script setup lang="ts">
import { computed, onMounted } from 'vue';

import StatBreadcrumb from '@/components/statistics/StatBreadcrumb.vue';
import StatDrillItem from '@/components/statistics/StatDrillItem.vue';
import StatSparkline from '@/components/statistics/StatSparkline.vue';
import StatWeightTable from '@/components/statistics/StatWeightTable.vue';
import EmptyState from '@/components/feedback/EmptyState.vue';
import InfoBanner from '@/components/feedback/InfoBanner.vue';
import AppTopBar from '@/components/shell/AppTopBar.vue';
import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';
import { sharedStatisticsPath as path } from '@/composables/useStatisticsPath';
import { schemeLabel } from '@/domain/statistics/statKey';
import { formatCount, formatWorkoutDayShort } from '@/presentation/italianFormat';

onMounted(() => {
    void sharedLoadingIndicator.track(() => path.reload());
});

const positionLabel = computed(() => (
    path.groupPosition.value === undefined ? undefined : `${path.groupPosition.value}a pos.`
));
const schemeLabelText = computed(() => (
    path.repetitionScheme.value === undefined ? undefined : schemeLabel(path.repetitionScheme.value)
));

const showNoStatisticsEmptyState = computed(() => (
    !path.loading.value && path.step.value === 'position' && path.positionOptions.value.length === 0
));
</script>

<template>
  <AppTopBar
    title="Statistiche"
    subtitle="solo giornate completate"
  />

  <EmptyState
    v-if="showNoStatisticsEmptyState"
    icon="chart"
    title="Nessuna statistica"
    description="Le statistiche usano solo le giornate completate."
  />

  <template v-else>
    <StatBreadcrumb
      :position-label="positionLabel"
      :group-label="path.groupName.value"
      :exercise-label="path.exerciseName.value"
      :scheme-label="schemeLabelText"
      @select="path.goToStep"
    />

    <div
      v-if="path.step.value === 'position'"
      class="stack"
    >
      <StatDrillItem
        v-for="option in path.positionOptions.value"
        :key="option.groupPosition"
        :key-label="`${option.groupPosition}a`"
        :title="`${option.groupPosition}a posizione della giornata`"
        :subtitle="option.groupNames.join(', ')"
        @click="path.selectPosition(option.groupPosition)"
      />
    </div>

    <div
      v-else-if="path.step.value === 'group'"
      class="stack"
    >
      <StatDrillItem
        v-for="option in path.groupOptions.value"
        :key="option.groupName"
        :key-label="option.groupName.slice(0, 2)"
        :title="option.groupName"
        :subtitle="formatCount(option.sessionCount, 'giornata', 'giornate')"
        @click="path.selectGroup(option.groupName)"
      />
    </div>

    <template v-else-if="path.step.value === 'exercise'">
      <label class="field exercise-search">
        <span>Cerca esercizio</span>
        <input
          v-model="path.exerciseSearchQuery.value"
          placeholder="Nome esercizio"
          autocomplete="off"
        >
      </label>
      <EmptyState
        v-if="path.exerciseOptions.value.length === 0"
        icon="empty"
        title="Nessun esercizio"
        description="Nessun nome corrisponde alla ricerca."
      />
      <div
        v-else
        class="stack"
      >
        <StatDrillItem
          v-for="option in path.exerciseOptions.value"
          :key="option.exerciseName"
          :key-label="String(option.sessionCount)"
          :title="option.exerciseName"
          :subtitle="`${formatCount(option.sessionCount, 'sessione', 'sessioni')} · ${formatCount(option.schemeCount, 'schema', 'schemi')}`"
          @click="path.selectExercise(option.exerciseName)"
        />
      </div>
    </template>

    <div
      v-else-if="path.step.value === 'scheme'"
      class="stack"
    >
      <StatDrillItem
        v-for="option in path.schemeOptions.value"
        :key="option.label + option.repetitionScheme.join('-')"
        scheme-variant
        :key-label="option.label"
        :title="option.label"
        :subtitle="`${formatCount(option.sessionCount, 'sessione', 'sessioni')} · ultima ${formatWorkoutDayShort(option.lastSessionDate)}`"
        @click="path.selectScheme(option.repetitionScheme)"
      />
    </div>

    <template v-else>
      <EmptyState
        v-if="path.sessions.value.length === 0"
        icon="chart"
        title="Nessuna sessione"
        description="Nessuno storico per questo schema: sarà la prima."
      />
      <template v-else>
        <InfoBanner
          v-if="path.sessions.value.length === 1"
          tone="info"
          class="single-session-banner"
        >
          Una sola sessione con questo schema: non c'è ancora una progressione da mostrare.
        </InfoBanner>
        <StatSparkline :sessions="path.sessions.value" />
        <StatWeightTable :sessions="path.sessions.value" />
      </template>
    </template>
  </template>
</template>

<style scoped>
.exercise-search {
    margin-bottom: 12px;
}

.single-session-banner {
    margin-bottom: 12px;
}
</style>
