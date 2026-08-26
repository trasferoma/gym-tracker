import { describe, expect, it } from 'vitest';

import { collectStatEntries } from './statEntries';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from '@/domain/workoutFactory';
import type { Exercise, MuscleGroupWorkout, Workout } from '@/domain/workout';

function exerciseWithSets(
        name: string, sets: readonly { readonly repetitions: number; readonly weight: number; readonly completed: boolean }[]
): Exercise {
    const builtSets = sets.map((set, index) => (
        { ...createExerciseSet(index, set.repetitions, set.weight), completed: set.completed }
    ));
    return { ...createExercise(name, 0), sets: builtSets };
}

function group(name: string, position: number, exercises: readonly Exercise[]): MuscleGroupWorkout {
    return { ...createMuscleGroupWorkout(name, position), position, exercises };
}

function completedWorkout(muscleGroups: readonly MuscleGroupWorkout[]): Workout {
    return { ...createDraftWorkout('2026-01-15'), status: 'completed', muscleGroups };
}

describe('collectStatEntries', () => {
    it('considera solo gli allenamenti completati e tutte le loro serie, a prescindere dal flag completed', () => {
        const validExercise = exerciseWithSets('Panca piana', [
            { repetitions: 10, weight: 20, completed: false },
            { repetitions: 10, weight: 22, completed: true }
        ]);
        const completed = completedWorkout([group('Petto', 0, [validExercise])]);
        const draft = { ...completedWorkout([group('Petto', 0, [validExercise])]), status: 'draft' as const };

        const entries = collectStatEntries([completed, draft]);

        expect(entries).toHaveLength(1);
        expect(entries[0]!.weights).toEqual([20, 22]);
    });

    it('esclude gli esercizi senza serie', () => {
        const exerciseWithoutSets = { ...createExercise('Croci', 1), sets: [] };
        const workout = completedWorkout([group('Petto', 0, [exerciseWithoutSets])]);

        const entries = collectStatEntries([workout]);

        expect(entries).toHaveLength(0);
    });

    it('due giornate con sequenze di gruppi diverse producono la stessa chiave quando il gruppo è nella stessa posizione', () => {
        const pettoExercise = exerciseWithSets('Panca piana', [{ repetitions: 10, weight: 20, completed: true }]);
        const dayWithBicipitiAfterPetto = completedWorkout([
            group('Petto', 0, [pettoExercise]),
            group('Bicipiti', 1, [exerciseWithSets('Curl', [{ repetitions: 10, weight: 10, completed: true }])])
        ]);
        const dayWithSpalleAfterPetto = completedWorkout([
            group('Petto', 0, [pettoExercise]),
            group('Spalle', 1, [exerciseWithSets('Alzate', [{ repetitions: 10, weight: 5, completed: true }])])
        ]);

        const entries = collectStatEntries([dayWithBicipitiAfterPetto, dayWithSpalleAfterPetto]);

        const pettoEntries = entries.filter((entry) => entry.key.groupName === 'Petto');
        expect(pettoEntries).toHaveLength(2);
        expect(pettoEntries[0]!.key).toEqual(pettoEntries[1]!.key);
    });

    it('la stessa combinazione in posizione diversa produce chiavi diverse', () => {
        const pettoExercise = exerciseWithSets('Panca piana', [{ repetitions: 10, weight: 20, completed: true }]);
        const pettoFirst = completedWorkout([group('Petto', 0, [pettoExercise])]);
        const pettoSecond = completedWorkout([
            group('Schiena', 0, [exerciseWithSets('Rematore', [{ repetitions: 10, weight: 30, completed: true }])]),
            group('Petto', 1, [pettoExercise])
        ]);

        const entries = collectStatEntries([pettoFirst, pettoSecond]);

        const pettoEntries = entries.filter((entry) => entry.key.groupName === 'Petto');
        expect(pettoEntries).toHaveLength(2);
        expect(pettoEntries[0]!.key.groupPosition).not.toBe(pettoEntries[1]!.key.groupPosition);
    });
});
