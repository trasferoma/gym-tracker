<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';

import AppIcon from '@/components/icon/AppIcon.vue';
import BusyButton from '@/components/feedback/BusyButton.vue';
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue';
import EmptyState from '@/components/feedback/EmptyState.vue';
import InfoBanner from '@/components/feedback/InfoBanner.vue';
import ToastMessage from '@/components/feedback/ToastMessage.vue';
import AppTopBar from '@/components/shell/AppTopBar.vue';
import MuscleGroupPicker from '@/components/workout/MuscleGroupPicker.vue';
import MuscleGroupSection from '@/components/workout/MuscleGroupSection.vue';
import SaveStateBadge from '@/components/workout/SaveStateBadge.vue';
import { useAsyncAction } from '@/composables/useAsyncAction';
import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';
import { useWorkoutDraft } from '@/composables/useWorkoutDraft';
import { useWorkoutHistory } from '@/composables/useWorkoutHistory';
import type { MuscleGroupName } from '@/domain/muscleGroups';
import { checkCompletionEligibility } from '@/domain/workoutCompletion';
import { availableMuscleGroupsToAdd } from '@/domain/workoutStructure';
import { countMuscleGroup } from '@/domain/workoutCounts';
import { MAX_COMPLETED_MUSCLE_GROUPS, type Exercise, type MuscleGroupWorkout } from '@/domain/workout';
import { describeWorkoutDeletion, formatCount, formatIsoTime, formatWorkoutDayShort } from '@/presentation/italianFormat';
import { backTargetRoute } from '@/router';

type PendingGroupOrExerciseDeletion =
    | { readonly kind: 'group'; readonly group: MuscleGroupWorkout }
    | { readonly kind: 'exercise'; readonly group: MuscleGroupWorkout; readonly exercise: Exercise };

const props = defineProps<{ id: string }>();

const draft = useWorkoutDraft();
const history = useWorkoutHistory();
const router = useRouter();

const ready = ref(false);
const addingGroup = ref(false);
const pendingDelete = ref(false);
const pendingRemoval = ref<PendingGroupOrExerciseDeletion>();
const toastMessage = ref<string>();

async function loadEverything(id: string): Promise<void> {
    ready.value = false;
    await sharedLoadingIndicator.track(async () => {
        const loadDraftPromise = draft.load(id);
        const loadHistoryPromise = history.reload();
        await Promise.all([loadDraftPromise, loadHistoryPromise]);
    });
    ready.value = true;
}

onMounted(() => {
    void loadEverything(props.id);
    document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});

watch(() => props.id, (id) => {
    void loadEverything(id);
});

onBeforeRouteLeave(async () => {
    await draft.flushPendingSave();
});

function flushNotes(): void {
    void draft.flushPendingSave();
}

function handleVisibilityChange(): void {
    if (document.hidden) {
        void draft.flushPendingSave();
    }
}

const workout = computed(() => draft.workout.value);
const notFound = computed(() => ready.value && !workout.value);

const titleLabel = computed(() => (workout.value ? formatWorkoutDayShort(workout.value.workoutDate) : ''));
const subtitleLabel = computed(() => {
    if (!workout.value) {
        return '';
    }
    const timeLabel = formatIsoTime(workout.value.createdAt);
    const statusLabel = workout.value.status === 'draft' ? 'bozza' : 'completato';
    return `${timeLabel} · ${statusLabel}`;
});

const notesText = computed({
    get: () => workout.value?.notes ?? '',
    set: (value: string) => draft.updateNotes(value)
});

const availableGroups = computed<readonly MuscleGroupName[]>(() => (
    workout.value ? availableMuscleGroupsToAdd(workout.value) : []
));
const canAddGroup = computed(() => (workout.value?.muscleGroups.length ?? 0) < MAX_COMPLETED_MUSCLE_GROUPS);

const completionEligibility = computed(() => (
    workout.value ? checkCompletionEligibility(workout.value) : { eligible: false, reason: '' }
));

const dayDeleteBody = computed(() => (workout.value ? describeWorkoutDeletion(workout.value) : ''));

const removalTitle = computed(() => {
    const removal = pendingRemoval.value;
    if (!removal) {
        return '';
    }
    const name = removal.kind === 'group' ? removal.group.name : removal.exercise.name;
    return `Eliminare ${name}?`;
});

const removalBody = computed(() => {
    const removal = pendingRemoval.value;
    if (!removal) {
        return '';
    }
    if (removal.kind === 'exercise') {
        const setsLabel = formatCount(removal.exercise.sets.length, 'serie', 'serie');
        return `${setsLabel} andranno perse.`;
    }
    const counts = countMuscleGroup(removal.group);
    const exercisesLabel = formatCount(counts.exercises, 'esercizio', 'esercizi');
    const setsLabel = formatCount(counts.sets, 'serie', 'serie');
    return `${exercisesLabel} e ${setsLabel} andranno persi.`;
});

function pickGroup(name: MuscleGroupName): void {
    draft.addMuscleGroup(name);
    addingGroup.value = false;
}

const completeAction = useAsyncAction(() => {
    draft.complete();
    if (!draft.rejectionReason.value) {
        toastMessage.value = 'Giornata completata';
    }
});

const deleteAction = useAsyncAction(async () => {
    const current = workout.value;
    if (!current) {
        return;
    }
    try {
        await history.remove(current.id);
        await router.push({ name: backTargetRoute.value });
    } finally {
        pendingDelete.value = false;
    }
});

function requestGroupDeletion(group: MuscleGroupWorkout): void {
    pendingRemoval.value = { kind: 'group', group };
}

function requestExerciseDeletion(group: MuscleGroupWorkout, exercise: Exercise): void {
    pendingRemoval.value = { kind: 'exercise', group, exercise };
}

function cancelRemoval(): void {
    pendingRemoval.value = undefined;
}

const removalAction = useAsyncAction(() => {
    const removal = pendingRemoval.value;
    if (!removal) {
        return;
    }
    try {
        if (removal.kind === 'exercise') {
            draft.removeExercise(removal.group.id, removal.exercise.id);
            return;
        }
        draft.removeMuscleGroup(removal.group.id);
    } finally {
        pendingRemoval.value = undefined;
    }
});
</script>

<template>
  <AppTopBar
    :title="titleLabel"
    :subtitle="subtitleLabel"
    show-back
  >
    <template #actions>
      <SaveStateBadge
        v-if="workout"
        :status="draft.saveStatus.value"
      />
    </template>
  </AppTopBar>

  <EmptyState
    v-if="notFound"
    title="Allenamento non trovato"
    description="Torna allo storico per scegliere un'altra giornata."
  />

  <template v-else-if="workout">
    <div class="card notes-box">
      <label class="field">
        <span>Note della giornata</span>
        <textarea
          v-model="notesText"
          placeholder="Come è andata?"
          @blur="flushNotes"
        />
      </label>
    </div>

    <InfoBanner
      v-if="draft.rejectionReason.value"
      tone="warn"
    >
      {{ draft.rejectionReason.value }}
    </InfoBanner>

    <div class="sec">
      <h2>Gruppi muscolari</h2>
      <span>{{ workout.muscleGroups.length }} di {{ MAX_COMPLETED_MUSCLE_GROUPS }}</span>
    </div>
    <MuscleGroupSection
      v-for="(group, index) in workout.muscleGroups"
      :key="group.id"
      :group="group"
      :group-position="index + 1"
      :index="index"
      :total="workout.muscleGroups.length"
      :workouts="history.allWorkouts.value"
      :draft="draft"
      @delete="requestGroupDeletion(group)"
      @delete-exercise="requestExerciseDeletion(group, $event)"
    />

    <MuscleGroupPicker
      v-if="addingGroup"
      :groups="availableGroups"
      @pick="pickGroup"
      @cancel="addingGroup = false"
    />
    <div
      v-else
      class="row-actions"
    >
      <button
        type="button"
        class="btn btn--outline"
        :disabled="!canAddGroup"
        @click="addingGroup = true"
      >
        <AppIcon name="plus" />Gruppo muscolare
      </button>
    </div>
    <p
      v-if="!canAddGroup"
      class="faint max-groups"
    >
      Massimo {{ MAX_COMPLETED_MUSCLE_GROUPS }} gruppi per giornata.
    </p>

    <template v-if="workout.status === 'draft'">
      <InfoBanner
        v-if="!completionEligibility.eligible"
        tone="warn"
        class="completion-banner"
      >
        {{ completionEligibility.reason }}
      </InfoBanner>
      <BusyButton
        class="btn btn--primary btn--block complete-button"
        icon="check"
        :busy="completeAction.pending.value"
        :disabled="!completionEligibility.eligible"
        @click="completeAction.run"
      >
        Contrassegna come completato
      </BusyButton>
    </template>
    <template v-else>
      <InfoBanner
        tone="info"
        class="completion-banner"
      >
        Giornata completata.
      </InfoBanner>
      <button
        type="button"
        class="btn btn--outline btn--block reopen-button"
        @click="draft.reopen()"
      >
        Riporta a bozza
      </button>
    </template>

    <button
      type="button"
      class="btn btn--danger btn--block delete-button"
      @click="pendingDelete = true"
    >
      <AppIcon name="trash" />Elimina la giornata
    </button>
  </template>

  <ConfirmDialog
    :open="pendingDelete"
    title="Eliminare la giornata?"
    :body="dayDeleteBody"
    confirm-label="Elimina"
    :busy="deleteAction.pending.value"
    @cancel="pendingDelete = false"
    @confirm="deleteAction.run"
  />
  <ConfirmDialog
    :open="pendingRemoval !== undefined"
    :title="removalTitle"
    :body="removalBody"
    confirm-label="Elimina"
    :busy="removalAction.pending.value"
    @cancel="cancelRemoval"
    @confirm="removalAction.run"
  />
  <ToastMessage
    :message="toastMessage"
    @dismissed="toastMessage = undefined"
  />
</template>

<style scoped>
.notes-box {
    padding: 12px 14px;
    margin-top: 8px;
}

.max-groups {
    font-size: 12.5px;
    margin: 8px 2px 0;
}

.completion-banner {
    margin-top: 16px;
}

.complete-button,
.reopen-button {
    margin-top: 12px;
}

.delete-button {
    margin-top: 10px;
}
</style>
