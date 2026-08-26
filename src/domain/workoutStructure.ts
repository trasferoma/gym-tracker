import { MUSCLE_GROUPS, type MuscleGroupName } from './muscleGroups';
import { createExercise, createExerciseSet, createMuscleGroupWorkout } from './workoutFactory';
import {
    MIN_COMPLETED_MUSCLE_GROUPS,
    type Exercise,
    type ExerciseSet,
    type MuscleGroupWorkout,
    type Workout,
    type WorkoutOperationOutcome
} from './workout';

export type ReorderDirection = 'up' | 'down';

export function availableMuscleGroupsToAdd(workout: Workout): readonly MuscleGroupName[] {
    const usedNames = new Set(workout.muscleGroups.map((group) => group.name));
    return MUSCLE_GROUPS.filter((name) => !usedNames.has(name));
}

export function addMuscleGroup(workout: Workout, name: string): WorkoutOperationOutcome {
    const alreadyPresent = workout.muscleGroups.some((group) => group.name === name);
    if (alreadyPresent) {
        return { outcome: 'rejected', reason: `Il gruppo "${name}" è già presente in questa giornata.` };
    }
    const newGroup = createMuscleGroupWorkout(name, workout.muscleGroups.length);
    const muscleGroups = reindexPositions([...workout.muscleGroups, newGroup]);
    return { outcome: 'applied', workout: withMuscleGroups(workout, muscleGroups) };
}

export function removeMuscleGroup(workout: Workout, groupId: string): WorkoutOperationOutcome {
    findMuscleGroup(workout, groupId);
    const remainingGroups = workout.muscleGroups.filter((group) => group.id !== groupId);
    const breaksCompletedInvariant = workout.status === 'completed'
            && remainingGroups.length < MIN_COMPLETED_MUSCLE_GROUPS;
    if (breaksCompletedInvariant) {
        return {
            outcome: 'rejected',
            reason: 'Una giornata completata non può restare senza gruppi muscolari. Riportala a bozza per modificarla liberamente.'
        };
    }
    const muscleGroups = reindexPositions(remainingGroups);
    return { outcome: 'applied', workout: withMuscleGroups(workout, muscleGroups) };
}

export function reorderMuscleGroup(workout: Workout, groupId: string, direction: ReorderDirection): Workout {
    const muscleGroups = reorderByPosition(workout.muscleGroups, groupId, direction);
    return withMuscleGroups(workout, muscleGroups);
}

export function addExercise(workout: Workout, groupId: string, name: string): Workout {
    return replaceMuscleGroup(workout, groupId, (group) => {
        const newExercise = createExercise(name, group.exercises.length);
        const exercises = reindexPositions([...group.exercises, newExercise]);
        return withExercises(group, exercises);
    });
}

export function renameExercise(workout: Workout, groupId: string, exerciseId: string, name: string): Workout {
    return replaceExerciseWithin(workout, groupId, exerciseId, (exercise) => ({ ...exercise, name }));
}

export function removeExercise(workout: Workout, groupId: string, exerciseId: string): Workout {
    return replaceMuscleGroup(workout, groupId, (group) => {
        findExercise(group, exerciseId);
        const exercises = reindexPositions(group.exercises.filter((exercise) => exercise.id !== exerciseId));
        return withExercises(group, exercises);
    });
}

export function reorderExercise(
        workout: Workout, groupId: string, exerciseId: string, direction: ReorderDirection): Workout {
    return replaceMuscleGroup(workout, groupId, (group) => {
        const exercises = reorderByPosition(group.exercises, exerciseId, direction);
        return withExercises(group, exercises);
    });
}

export function addExerciseSet(workout: Workout, groupId: string, exerciseId: string): Workout {
    return replaceExerciseWithin(workout, groupId, exerciseId, (exercise) => {
        const newSet = createExerciseSet(exercise.sets.length);
        const sets = reindexPositions([...exercise.sets, newSet]);
        return withSets(exercise, sets);
    });
}

export function duplicateLastExerciseSet(workout: Workout, groupId: string, exerciseId: string): Workout {
    return replaceExerciseWithin(workout, groupId, exerciseId, (exercise) => {
        const lastSet = exercise.sets.at(-1);
        if (!lastSet) {
            return exercise;
        }
        const duplicatedSet = createExerciseSet(exercise.sets.length, lastSet.repetitions, lastSet.weight);
        const sets = reindexPositions([...exercise.sets, duplicatedSet]);
        return withSets(exercise, sets);
    });
}

export function removeExerciseSet(workout: Workout, groupId: string, exerciseId: string, setId: string): Workout {
    return replaceExerciseWithin(workout, groupId, exerciseId, (exercise) => {
        const sets = reindexPositions(exercise.sets.filter((set) => set.id !== setId));
        return withSets(exercise, sets);
    });
}

export function updateWorkoutNotes(workout: Workout, notes: string): Workout {
    return { ...workout, notes };
}

export function updateExerciseSet(
        workout: Workout, groupId: string, exerciseId: string, setId: string,
        updater: (set: ExerciseSet) => ExerciseSet): Workout {
    return replaceExerciseWithin(workout, groupId, exerciseId, (exercise) => {
        const sets = exercise.sets.map((set) => (set.id === setId ? updater(set) : set));
        return withSets(exercise, sets);
    });
}

function reindexPositions<T extends { readonly position: number }>(items: readonly T[]): T[] {
    return items.map((item, index) => ({ ...item, position: index }));
}

function reorderByPosition<T extends { readonly id: string; readonly position: number }>(
        items: readonly T[], id: string, direction: ReorderDirection): T[] {
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex < 0) {
        throw new Error(`Elemento non trovato: ${id}`);
    }
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const isOutOfBounds = targetIndex < 0 || targetIndex >= items.length;
    if (isOutOfBounds) {
        return [...items];
    }
    const swapped = [...items];
    const currentItem = swapped[currentIndex]!;
    const targetItem = swapped[targetIndex]!;
    swapped[currentIndex] = targetItem;
    swapped[targetIndex] = currentItem;
    return reindexPositions(swapped);
}

function findMuscleGroup(workout: Workout, groupId: string): MuscleGroupWorkout {
    const group = workout.muscleGroups.find((candidate) => candidate.id === groupId);
    if (!group) {
        throw new Error(`Gruppo muscolare non trovato: ${groupId}`);
    }
    return group;
}

function findExercise(group: MuscleGroupWorkout, exerciseId: string): Exercise {
    const exercise = group.exercises.find((candidate) => candidate.id === exerciseId);
    if (!exercise) {
        throw new Error(`Esercizio non trovato: ${exerciseId}`);
    }
    return exercise;
}

function withMuscleGroups(workout: Workout, muscleGroups: readonly MuscleGroupWorkout[]): Workout {
    return { ...workout, muscleGroups };
}

function replaceMuscleGroup(
        workout: Workout, groupId: string,
        updater: (group: MuscleGroupWorkout) => MuscleGroupWorkout): Workout {
    const group = findMuscleGroup(workout, groupId);
    const updatedGroup = updater(group);
    const muscleGroups = workout.muscleGroups.map((candidate) => (
        candidate.id === groupId ? updatedGroup : candidate
    ));
    return withMuscleGroups(workout, muscleGroups);
}

function withExercises(group: MuscleGroupWorkout, exercises: readonly Exercise[]): MuscleGroupWorkout {
    return { ...group, exercises };
}

function replaceExercise(
        group: MuscleGroupWorkout, exerciseId: string,
        updater: (exercise: Exercise) => Exercise): MuscleGroupWorkout {
    const exercise = findExercise(group, exerciseId);
    const updatedExercise = updater(exercise);
    const exercises = group.exercises.map((candidate) => (
        candidate.id === exerciseId ? updatedExercise : candidate
    ));
    return withExercises(group, exercises);
}

function withSets(exercise: Exercise, sets: readonly ExerciseSet[]): Exercise {
    return { ...exercise, sets };
}

function replaceExerciseWithin(
        workout: Workout, groupId: string, exerciseId: string,
        updater: (exercise: Exercise) => Exercise): Workout {
    return replaceMuscleGroup(workout, groupId, (group) => replaceExercise(group, exerciseId, updater));
}
