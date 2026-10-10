import * as exerciseClusters from './exerciseClusters';
import { MUSCLE_GROUPS, type MuscleGroupName } from './muscleGroups';
import { reindexPositions, reorderByPosition, type ReorderDirection } from './positions';
import { createExercise, createExerciseCluster, createExerciseSet, createMuscleGroupWorkout } from './workoutFactory';
import {
    MIN_COMPLETED_MUSCLE_GROUPS,
    type Exercise,
    type ExerciseCluster,
    type ExerciseClusterKind,
    type ExerciseSet,
    type MuscleGroupWorkout,
    type Workout,
    type WorkoutOperationOutcome
} from './workout';

export type { ReorderDirection };

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
        const newExercise = createExercise(name, 0);
        const newCluster = createExerciseCluster(newExercise, group.clusters.length);
        const clusters = reindexPositions([...group.clusters, newCluster]);
        return withClusters(group, clusters);
    });
}

export function renameExercise(workout: Workout, groupId: string, exerciseId: string, name: string): Workout {
    return replaceExerciseWithin(workout, groupId, exerciseId, (exercise) => ({ ...exercise, name }));
}

export function removeExercise(workout: Workout, groupId: string, exerciseId: string): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.removeExerciseFromClusters(clusters, exerciseId)
    ));
}

export function reorderExercise(
        workout: Workout, groupId: string, exerciseId: string, direction: ReorderDirection): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.reorderExerciseWithinCluster(clusters, exerciseId, direction)
    ));
}

export function linkClusterToNext(workout: Workout, groupId: string, clusterId: string): Workout {
    return replaceClusters(workout, groupId, (clusters) => exerciseClusters.linkClusterToNext(clusters, clusterId));
}

export function detachExercise(workout: Workout, groupId: string, exerciseId: string): Workout {
    return replaceClusters(workout, groupId, (clusters) => exerciseClusters.detachExercise(clusters, exerciseId));
}

export function changeClusterKind(
        workout: Workout, groupId: string, clusterId: string, kind: ExerciseClusterKind): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.changeClusterKind(clusters, clusterId, kind)
    ));
}

export function updateClusterRestAfterRound(
        workout: Workout, groupId: string, clusterId: string, seconds: number): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.updateClusterRestAfterRound(clusters, clusterId, seconds)
    ));
}

export function updateClusterRestBetweenExercises(
        workout: Workout, groupId: string, clusterId: string, seconds: number): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.updateClusterRestBetweenExercises(clusters, clusterId, seconds)
    ));
}

export function reorderCluster(
        workout: Workout, groupId: string, clusterId: string, direction: ReorderDirection): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.reorderCluster(clusters, clusterId, direction)
    ));
}

export function addExerciseToCluster(workout: Workout, groupId: string, clusterId: string, name: string): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.addExerciseToCluster(clusters, clusterId, name)
    ));
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
        const remainingSets = exercise.sets.filter((set) => set.id !== setId);
        const sets = reindexPositions(remainingSets);
        return withSets(exercise, sets);
    });
}

export function updateWorkoutNotes(workout: Workout, notes: string): Workout {
    return { ...workout, notes };
}

export function updateWorkoutDate(workout: Workout, workoutDate: string): Workout {
    return { ...workout, workoutDate };
}

export function updateExerciseSet(
        workout: Workout, groupId: string, exerciseId: string, setId: string,
        updater: (set: ExerciseSet) => ExerciseSet): Workout {
    return replaceExerciseWithin(workout, groupId, exerciseId, (exercise) => {
        const sets = exercise.sets.map((set) => (set.id === setId ? updater(set) : set));
        return withSets(exercise, sets);
    });
}

function findMuscleGroup(workout: Workout, groupId: string): MuscleGroupWorkout {
    const group = workout.muscleGroups.find((candidate) => candidate.id === groupId);
    if (!group) {
        throw new Error(`Gruppo muscolare non trovato: ${groupId}`);
    }
    return group;
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

function withClusters(group: MuscleGroupWorkout, clusters: readonly ExerciseCluster[]): MuscleGroupWorkout {
    return { ...group, clusters };
}

function replaceClusters(
        workout: Workout, groupId: string,
        updater: (clusters: readonly ExerciseCluster[]) => readonly ExerciseCluster[]): Workout {
    return replaceMuscleGroup(workout, groupId, (group) => {
        const clusters = updater(group.clusters);
        return withClusters(group, clusters);
    });
}

function withSets(exercise: Exercise, sets: readonly ExerciseSet[]): Exercise {
    return { ...exercise, sets };
}

function replaceExerciseWithin(
        workout: Workout, groupId: string, exerciseId: string,
        updater: (exercise: Exercise) => Exercise): Workout {
    return replaceClusters(workout, groupId, (clusters) => (
        exerciseClusters.updateExerciseInClusters(clusters, exerciseId, updater)
    ));
}
