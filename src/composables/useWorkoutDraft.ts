import { ref, shallowRef, type Ref } from 'vue';

import { type AutosaveStatus, useAutosave } from './useAutosave';
import * as completion from '@/domain/workoutCompletion';
import * as structure from '@/domain/workoutStructure';
import type { ReorderDirection } from '@/domain/workoutStructure';
import { copyWorkoutStructure } from '@/domain/workoutCopy';
import { createDraftWorkout } from '@/domain/workoutFactory';
import { nextSetIssueLevel } from '@/domain/setIssue';
import type { Workout, WorkoutOperationOutcome } from '@/domain/workout';
import { findWorkoutById, saveWorkout } from '@/persistence/workoutRepository';

export interface UseWorkoutDraft {
    readonly workout: Ref<Workout | undefined>;
    readonly saveStatus: Ref<AutosaveStatus>;
    readonly saveErrorMessage: Ref<string | undefined>;
    readonly rejectionReason: Ref<string | undefined>;
    load(id: string): Promise<void>;
    createDraft(workoutDate: string, source?: Workout): Promise<Workout>;
    flushPendingSave(): Promise<void>;
    updateNotes(notes: string): void;
    updateDate(workoutDate: string): void;
    addMuscleGroup(name: string): void;
    removeMuscleGroup(groupId: string): void;
    reorderMuscleGroup(groupId: string, direction: ReorderDirection): void;
    addExercise(groupId: string, name: string): void;
    renameExercise(groupId: string, exerciseId: string, name: string): void;
    removeExercise(groupId: string, exerciseId: string): void;
    reorderExercise(groupId: string, exerciseId: string, direction: ReorderDirection): void;
    addExerciseSet(groupId: string, exerciseId: string): void;
    duplicateLastExerciseSet(groupId: string, exerciseId: string): void;
    removeExerciseSet(groupId: string, exerciseId: string, setId: string): void;
    updateSetRepetitions(groupId: string, exerciseId: string, setId: string, repetitions: number): void;
    updateSetWeight(groupId: string, exerciseId: string, setId: string, weight: number): void;
    toggleSetCompleted(groupId: string, exerciseId: string, setId: string): void;
    cycleSetIssue(groupId: string, exerciseId: string, setId: string): void;
    complete(): void;
    reopen(): void;
}

export function useWorkoutDraft(): UseWorkoutDraft {
    const workout = shallowRef<Workout>();
    const rejectionReason = ref<string>();
    const autosave = useAutosave<Workout>(saveWorkout);

    async function load(id: string): Promise<void> {
        await autosave.flush();
        rejectionReason.value = undefined;
        workout.value = await findWorkoutById(id);
    }

    async function createDraft(workoutDate: string, source?: Workout): Promise<Workout> {
        const created = source ? copyWorkoutStructure(source, workoutDate) : createDraftWorkout(workoutDate);
        await saveWorkout(created);
        rejectionReason.value = undefined;
        workout.value = created;
        return created;
    }

    function requireLoadedWorkout(): Workout {
        const current = workout.value;
        if (!current) {
            throw new Error('Nessun allenamento caricato.');
        }
        return current;
    }

    function commitWorkout(next: Workout): void {
        const updatedAt = new Date().toISOString();
        const stamped: Workout = { ...next, updatedAt };
        workout.value = stamped;
        autosave.schedule(stamped);
    }

    function applyOutcome(outcome: WorkoutOperationOutcome): void {
        if (outcome.outcome === 'rejected') {
            rejectionReason.value = outcome.reason;
            return;
        }
        rejectionReason.value = undefined;
        commitWorkout(outcome.workout);
    }

    function updateNotes(notes: string): void {
        const current = requireLoadedWorkout();
        const next = structure.updateWorkoutNotes(current, notes);
        commitWorkout(next);
    }

    function updateDate(workoutDate: string): void {
        const current = requireLoadedWorkout();
        const next = structure.updateWorkoutDate(current, workoutDate);
        commitWorkout(next);
    }

    function addMuscleGroup(name: string): void {
        const current = requireLoadedWorkout();
        const outcome = structure.addMuscleGroup(current, name);
        applyOutcome(outcome);
    }

    function removeMuscleGroup(groupId: string): void {
        const current = requireLoadedWorkout();
        const outcome = structure.removeMuscleGroup(current, groupId);
        applyOutcome(outcome);
    }

    function reorderMuscleGroup(groupId: string, direction: ReorderDirection): void {
        const current = requireLoadedWorkout();
        const next = structure.reorderMuscleGroup(current, groupId, direction);
        commitWorkout(next);
    }

    function addExercise(groupId: string, name: string): void {
        const current = requireLoadedWorkout();
        const next = structure.addExercise(current, groupId, name);
        commitWorkout(next);
    }

    function renameExercise(groupId: string, exerciseId: string, name: string): void {
        const current = requireLoadedWorkout();
        const next = structure.renameExercise(current, groupId, exerciseId, name);
        commitWorkout(next);
    }

    function removeExercise(groupId: string, exerciseId: string): void {
        const current = requireLoadedWorkout();
        const next = structure.removeExercise(current, groupId, exerciseId);
        commitWorkout(next);
    }

    function reorderExercise(groupId: string, exerciseId: string, direction: ReorderDirection): void {
        const current = requireLoadedWorkout();
        const next = structure.reorderExercise(current, groupId, exerciseId, direction);
        commitWorkout(next);
    }

    function addExerciseSet(groupId: string, exerciseId: string): void {
        const current = requireLoadedWorkout();
        const next = structure.addExerciseSet(current, groupId, exerciseId);
        commitWorkout(next);
    }

    function duplicateLastExerciseSet(groupId: string, exerciseId: string): void {
        const current = requireLoadedWorkout();
        const next = structure.duplicateLastExerciseSet(current, groupId, exerciseId);
        commitWorkout(next);
    }

    function removeExerciseSet(groupId: string, exerciseId: string, setId: string): void {
        const current = requireLoadedWorkout();
        const next = structure.removeExerciseSet(current, groupId, exerciseId, setId);
        commitWorkout(next);
    }

    function updateSetRepetitions(groupId: string, exerciseId: string, setId: string, repetitions: number): void {
        const current = requireLoadedWorkout();
        const next = structure.updateExerciseSet(current, groupId, exerciseId, setId, (set) => ({ ...set, repetitions }));
        commitWorkout(next);
    }

    function updateSetWeight(groupId: string, exerciseId: string, setId: string, weight: number): void {
        const current = requireLoadedWorkout();
        const next = structure.updateExerciseSet(current, groupId, exerciseId, setId, (set) => ({ ...set, weight }));
        commitWorkout(next);
    }

    function toggleSetCompleted(groupId: string, exerciseId: string, setId: string): void {
        const current = requireLoadedWorkout();
        const next = structure.updateExerciseSet(
                current, groupId, exerciseId, setId, (set) => ({ ...set, completed: !set.completed }));
        commitWorkout(next);
    }

    function cycleSetIssue(groupId: string, exerciseId: string, setId: string): void {
        const current = requireLoadedWorkout();
        const next = structure.updateExerciseSet(current, groupId, exerciseId, setId, (set) => {
            const issue = nextSetIssueLevel(set.issue);
            return { ...set, issue };
        });
        commitWorkout(next);
    }

    function complete(): void {
        const current = requireLoadedWorkout();
        const outcome = completion.completeWorkout(current);
        applyOutcome(outcome);
    }

    function reopen(): void {
        const current = requireLoadedWorkout();
        const next = completion.reopenWorkout(current);
        commitWorkout(next);
    }

    return {
        workout,
        saveStatus: autosave.status,
        saveErrorMessage: autosave.errorMessage,
        rejectionReason,
        load,
        createDraft,
        flushPendingSave: () => autosave.flush(),
        updateNotes,
        updateDate,
        addMuscleGroup,
        removeMuscleGroup,
        reorderMuscleGroup,
        addExercise,
        renameExercise,
        removeExercise,
        reorderExercise,
        addExerciseSet,
        duplicateLastExerciseSet,
        removeExerciseSet,
        updateSetRepetitions,
        updateSetWeight,
        toggleSetCompleted,
        cycleSetIssue,
        complete,
        reopen
    };
}
