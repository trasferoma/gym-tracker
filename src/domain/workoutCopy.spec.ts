import { describe, expect, it } from 'vitest';

import { copyWorkoutStructure } from './workoutCopy';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from './workoutFactory';
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
    const group = { ...createMuscleGroupWorkout('Petto', 0), exercises: [exercise] };
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
        expect(copy.muscleGroups[0]!.exercises[0]!.id).not.toBe(source.muscleGroups[0]!.exercises[0]!.id);
        expect(copy.muscleGroups[0]!.exercises[0]!.sets[0]!.id).not.toBe(
                source.muscleGroups[0]!.exercises[0]!.sets[0]!.id);
    });

    it('non copia data, stato completato, spunte delle serie e note generali', () => {
        const source = buildSourceWorkout();

        const copy = copyWorkoutStructure(source, '2026-01-20');

        expect(copy.workoutDate).toBe('2026-01-20');
        expect(copy.status).toBe('draft');
        expect(copy.notes).toBe('');
        expect(copy.muscleGroups[0]!.exercises[0]!.sets.every((set) => !set.completed)).toBe(true);
    });

    it('riporta gruppi, esercizi, ordine, numero e ordine delle serie, ripetizioni, pesi e note degli esercizi', () => {
        const source = buildSourceWorkout();

        const copy = copyWorkoutStructure(source, '2026-01-20');

        const copiedGroup = copy.muscleGroups[0]!;
        const copiedExercise = copiedGroup.exercises[0]!;
        expect(copiedGroup.name).toBe('Petto');
        expect(copiedExercise.name).toBe('Panca piana');
        expect(copiedExercise.notes).toBe('Presa larga');
        expect(copiedExercise.sets).toHaveLength(2);
        expect(copiedExercise.sets.map((set) => set.repetitions)).toEqual([6, 6]);
        expect(copiedExercise.sets.map((set) => set.weight)).toEqual([20, 22]);
        expect(copiedExercise.sets.map((set) => set.position)).toEqual([0, 1]);
    });
});
