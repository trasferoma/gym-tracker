<script setup lang="ts">
import { ref } from 'vue';

import AppIcon from '@/components/icon/AppIcon.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import { parseRepetitionsInput, parseWeightInput } from '@/domain/setInput';
import type { SetIssueLevel } from '@/domain/setIssue';
import type { ExerciseSet } from '@/domain/workout';
import { formatWeight } from '@/presentation/italianFormat';

const props = defineProps<{
    set: ExerciseSet;
    index: number;
    groupId: string;
    exerciseId: string;
    draft: UseWorkoutDraft;
}>();

const initialRepetitionsText = String(props.set.repetitions);
const repetitionsText = ref(initialRepetitionsText);

const initialWeightText = formatWeight(props.set.weight);
const weightText = ref(initialWeightText);

function handleRepetitionsInput(): void {
    const parsed = parseRepetitionsInput(repetitionsText.value);
    if (parsed.valid) {
        props.draft.updateSetRepetitions(props.groupId, props.exerciseId, props.set.id, parsed.value);
    }
}

function handleRepetitionsBlur(): void {
    repetitionsText.value = String(props.set.repetitions);
    void props.draft.flushPendingSave();
}

function handleWeightInput(): void {
    const parsed = parseWeightInput(weightText.value);
    if (parsed.valid) {
        props.draft.updateSetWeight(props.groupId, props.exerciseId, props.set.id, parsed.value);
    }
}

function handleWeightBlur(): void {
    weightText.value = formatWeight(props.set.weight);
    void props.draft.flushPendingSave();
}

function toggleCompleted(): void {
    props.draft.toggleSetCompleted(props.groupId, props.exerciseId, props.set.id);
}

function cycleIssue(): void {
    props.draft.cycleSetIssue(props.groupId, props.exerciseId, props.set.id);
}

function describeIssue(issue: SetIssueLevel | undefined): string {
    if (issue === 'warning') {
        return `Serie ${props.index}: problema segnalato, livello attenzione`;
    }
    if (issue === 'critical') {
        return `Serie ${props.index}: problema segnalato, livello critico`;
    }
    return `Serie ${props.index}: nessun problema segnalato`;
}

function removeSet(): void {
    props.draft.removeExerciseSet(props.groupId, props.exerciseId, props.set.id);
}
</script>

<template>
  <div class="sets-row">
    <button
      type="button"
      class="set-n"
      :class="{ 'set-n--warning': set.issue === 'warning', 'set-n--critical': set.issue === 'critical' }"
      :aria-label="describeIssue(set.issue)"
      @click="cycleIssue"
    >
      <AppIcon
        v-if="set.issue"
        name="warn"
      />
      <template v-else>
        {{ index }}
      </template>
    </button>
    <div class="set-in">
      <input
        v-model="repetitionsText"
        inputmode="numeric"
        pattern="[0-9]*"
        :aria-label="`Ripetizioni serie ${index}`"
        @input="handleRepetitionsInput"
        @blur="handleRepetitionsBlur"
      >
      <u>rip</u>
    </div>
    <div class="set-in">
      <input
        v-model="weightText"
        inputmode="decimal"
        :aria-label="`Peso serie ${index}`"
        @input="handleWeightInput"
        @blur="handleWeightBlur"
      >
      <u>kg</u>
    </div>
    <button
      type="button"
      class="set-ok"
      :aria-pressed="set.completed"
      :aria-label="`Serie ${index} completata`"
      @click="toggleCompleted"
    >
      <AppIcon name="check" />
    </button>
    <button
      type="button"
      class="icon-btn icon-btn--danger"
      :aria-label="`Elimina serie ${index}`"
      @click="removeSet"
    >
      <AppIcon name="trash" />
    </button>
    <div
      v-if="set.notes"
      class="set-note"
    >
      <AppIcon name="note" />
      <span>{{ set.notes }}</span>
    </div>
  </div>
</template>

<style scoped>
.set-n {
    position: relative;
    display: grid;
    place-items: center;
    height: 42px;
    padding: 0;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-faint);
    font-variant-numeric: tabular-nums;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-2);
}

.set-n::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: max(100%, var(--tap));
    height: max(100%, var(--tap));
    transform: translate(-50%, -50%);
}

.set-n svg {
    width: 15px;
    height: 15px;
}

.set-n--warning {
    color: var(--warn);
}

.set-n--critical {
    color: var(--danger);
}

.set-in {
    position: relative;
}

.set-in input {
    min-height: 42px;
    padding: 8px 30px 8px 11px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    border-radius: 10px;
}

.set-in u {
    position: absolute;
    right: 9px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    text-decoration: none;
    color: var(--text-faint);
    pointer-events: none;
}

.set-ok {
    position: relative;
    width: 38px;
    height: 42px;
    display: grid;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-2);
    color: var(--text-faint);
    padding: 0;
}

.set-ok::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: max(100%, var(--tap));
    height: max(100%, var(--tap));
    transform: translate(-50%, -50%);
}

.set-ok svg {
    width: 17px;
    height: 17px;
}

.set-ok[aria-pressed="true"] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-ink);
}

.set-note {
    grid-column: 2 / -1;
    margin-top: 2px;
    font-size: 12px;
    color: var(--text-dim);
    display: flex;
    gap: 6px;
}

.set-note svg {
    width: 12px;
    height: 12px;
    margin-top: 3px;
    flex: 0 0 auto;
    color: var(--text-faint);
}
</style>
