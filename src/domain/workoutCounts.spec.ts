import { describe, expect, it } from 'vitest';

import { wrapExercisesInSingleClusters } from './exerciseClusters';
import { countMuscleGroup, countWorkout } from './workoutCounts';
import {
    createDraftWorkout,
    createExercise,
    createExerciseCluster,
    createExerciseSet,
    createMuscleGroupWorkout
} from './workoutFactory';
import type { MuscleGroupWorkout } from './workout';

function exerciseWithSets(name: string, setCount: number) {
    const sets = Array.from({ length: setCount }, (_, position) => createExerciseSet(position));
    return { ...createExercise(name, 0), sets };
}

function groupWithSingles(name: string, setCounts: readonly number[]): MuscleGroupWorkout {
    const exercises = setCounts.map((setCount, index) => exerciseWithSets(`Esercizio ${index}`, setCount));
    return { ...createMuscleGroupWorkout(name, 0), clusters: wrapExercisesInSingleClusters(exercises) };
}

function groupWithSupersetAndSingle(): MuscleGroupWorkout {
    const first = exerciseWithSets('Panca', 3);
    const second = exerciseWithSets('Croci', 2);
    const superset = { ...createExerciseCluster(first, 0), kind: 'superset' as const, exercises: [first, second] };
    const single = createExerciseCluster(exerciseWithSets('Piegamenti', 4), 1);
    return { ...createMuscleGroupWorkout('Petto', 0), clusters: [superset, single] };
}

describe('countMuscleGroup', () => {
    it('conta esercizi e serie di un gruppo senza raggruppamenti', () => {
        expect(countMuscleGroup(createMuscleGroupWorkout('Petto', 0))).toEqual({ exercises: 0, sets: 0 });
    });

    it('conta gli stessi valori di prima per raggruppamenti singoli', () => {
        expect(countMuscleGroup(groupWithSingles('Petto', [3, 2]))).toEqual({ exercises: 2, sets: 5 });
    });

    it('conta gli esercizi dentro i raggruppamenti multipli', () => {
        expect(countMuscleGroup(groupWithSupersetAndSingle())).toEqual({ exercises: 3, sets: 9 });
    });
});

describe('countWorkout', () => {
    it('somma esercizi e serie di tutti i gruppi attraverso i raggruppamenti', () => {
        const workout = {
            ...createDraftWorkout('2026-01-15'),
            muscleGroups: [groupWithSupersetAndSingle(), groupWithSingles('Schiena', [5])]
        };

        expect(countWorkout(workout)).toEqual({ exercises: 4, sets: 14 });
    });
});
