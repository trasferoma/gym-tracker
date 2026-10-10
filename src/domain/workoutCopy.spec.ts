import { describe, expect, it } from 'vitest';

import { wrapExercisesInSingleClusters } from './exerciseClusters';
import { copyWorkoutStructure } from './workoutCopy';
import { createDraftWorkout, createExercise, createExerciseCluster, createExerciseSet, createMuscleGroupWorkout } from './workoutFactory';
import type { Workout } from './workout';

function buildSourceWorkout(): Workout {
    const draft = createDraftWorkout('2026-01-10');
    const exercise = {
        ...createExercise('Panca piana', 0),
        notes: 'Presa larga',
        sets: [
            { ...createExerciseSet(0, 6, 20), completed: true, notes: 'Ultima serie tirata' },
            { ...createExerciseSet(1, 6, 22), completed: true }
        ]
    };
    const group = {
        ...createMuscleGroupWorkout('Petto', 0),
        clusters: wrapExercisesInSingleClusters([exercise])
    };
    return {
        ...draft,
        status: 'completed',
        notes: 'Poco tempo oggi',
        muscleGroups: [group]
    };
}

describe('copyWorkoutStructure', () => {
    it('genera nuovi UUID a tutti e quattro i livelli', () => {
        const source = buildSourceWorkout();

        const copy = copyWorkoutStructure(source, '2026-01-20');

        expect(copy.id).not.toBe(source.id);
        expect(copy.muscleGroups[0]!.id).not.toBe(source.muscleGroups[0]!.id);
        expect(copy.muscleGroups[0]!.clusters[0]!.exercises[0]!.id).not.toBe(source.muscleGroups[0]!.clusters[0]!.exercises[0]!.id);
        expect(copy.muscleGroups[0]!.clusters[0]!.exercises[0]!.sets[0]!.id).not.toBe(
                source.muscleGroups[0]!.clusters[0]!.exercises[0]!.sets[0]!.id);
    });

    it('non copia data, stato completato, spunte delle serie e note generali', () => {
        const source = buildSourceWorkout();

        const copy = copyWorkoutStructure(source, '2026-01-20');

        expect(copy.workoutDate).toBe('2026-01-20');
        expect(copy.status).toBe('draft');
        expect(copy.notes).toBe('');
        expect(copy.muscleGroups[0]!.clusters[0]!.exercises[0]!.sets.every((set) => !set.completed)).toBe(true);
    });

    it('non copia il marcatore di problema di una serie', () => {
        const source = buildSourceWorkout();
        const sourceExercise = source.muscleGroups[0]!.clusters[0]!.exercises[0]!;
        const setWithIssue = { ...sourceExercise.sets[0]!, issue: 'critical' as const };
        const exerciseWithIssue = { ...sourceExercise, sets: [setWithIssue] };
        const sourceWithIssue = {
            ...source,
            muscleGroups: [{
                ...source.muscleGroups[0]!,
                clusters: wrapExercisesInSingleClusters([exerciseWithIssue])
            }]
        };

        const copy = copyWorkoutStructure(sourceWithIssue, '2026-01-20');

        expect(copy.muscleGroups[0]!.clusters[0]!.exercises[0]!.sets[0]).not.toHaveProperty('issue');
    });

    it('riporta gruppi, esercizi, ordine, numero e ordine delle serie, ripetizioni, pesi e note degli esercizi', () => {
        const source = buildSourceWorkout();

        const copy = copyWorkoutStructure(source, '2026-01-20');

        const copiedGroup = copy.muscleGroups[0]!;
        const copiedExercise = copiedGroup.clusters[0]!.exercises[0]!;
        expect(copiedGroup.name).toBe('Petto');
        expect(copiedExercise.name).toBe('Panca piana');
        expect(copiedExercise.notes).toBe('Presa larga');
        expect(copiedExercise.sets).toHaveLength(2);
        expect(copiedExercise.sets.map((set) => set.repetitions)).toEqual([6, 6]);
        expect(copiedExercise.sets.map((set) => set.weight)).toEqual([20, 22]);
        expect(copiedExercise.sets.map((set) => set.position)).toEqual([0, 1]);
    });

    it('copia i raggruppamenti con tipo e tempi, con id nuovi a tutti i livelli', () => {
        const source = buildSourceWorkout();
        const sourceGroup = source.muscleGroups[0]!;
        const sourceExercise = sourceGroup.clusters[0]!.exercises[0]!;
        const secondExercise = { ...createExercise('Croci', 1), sets: [createExerciseSet(0, 12, 10)] };
        const circuit = {
            ...createExerciseCluster(sourceExercise, 0),
            kind: 'circuit' as const,
            restAfterRoundSeconds: 90,
            restBetweenExercisesSeconds: 15,
            exercises: [sourceExercise, secondExercise]
        };
        const superset = { ...createExerciseCluster(createExercise('Alzate', 0), 1), kind: 'superset' as const, restAfterRoundSeconds: 45 };
        const sourceWithClusters = { ...source, muscleGroups: [{ ...sourceGroup, clusters: [circuit, superset] }] };

        const copy = copyWorkoutStructure(sourceWithClusters, '2026-01-20');

        const copiedClusters = copy.muscleGroups[0]!.clusters;
        expect(copiedClusters.map((cluster) => cluster.kind)).toEqual(['circuit', 'superset']);
        expect(copiedClusters.map((cluster) => cluster.position)).toEqual([0, 1]);
        expect(copiedClusters.map((cluster) => cluster.restAfterRoundSeconds)).toEqual([90, 45]);
        expect(copiedClusters.map((cluster) => cluster.restBetweenExercisesSeconds)).toEqual([15, 0]);
        expect(copiedClusters[0]!.exercises.map((exercise) => exercise.name)).toEqual(['Panca piana', 'Croci']);
        expect(copiedClusters[0]!.id).not.toBe(circuit.id);
        expect(copiedClusters[1]!.id).not.toBe(superset.id);
        expect(copiedClusters[0]!.exercises[1]!.id).not.toBe(secondExercise.id);
    });
});
