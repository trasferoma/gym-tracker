import { describe, expect, it } from 'vitest';

import { validateBackupFile } from './backupValidation';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from '@/domain/workoutFactory';
import type { Workout } from '@/domain/workout';

function buildValidWorkout(): Workout {
    const exercise = { ...createExercise('Panca piana', 0), sets: [createExerciseSet(0, 6, 20)] };
    const group = { ...createMuscleGroupWorkout('Petto', 0), exercises: [exercise] };
    return { ...createDraftWorkout('2026-01-15'), muscleGroups: [group] };
}

function buildBackupFilePayload(workouts: readonly unknown[] = [buildValidWorkout()]): Record<string, unknown> {
    return { formatVersion: 1, exportedAt: '2026-01-20T10:00:00.000Z', workouts };
}

describe('validateBackupFile', () => {
    it('accetta un file corretto e restituisce il contenuto tipizzato', () => {
        const workout = buildValidWorkout();

        const result = validateBackupFile(buildBackupFilePayload([workout]));

        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(result.backup.formatVersion).toBe(1);
            expect(result.backup.workouts).toEqual([workout]);
        }
    });

    it('rifiuta un input che non è un oggetto', () => {
        const result = validateBackupFile('non un oggetto');

        expect(result.valid).toBe(false);
    });

    it('rifiuta una versione del formato ignota', () => {
        const invalidFile = { ...buildBackupFilePayload(), formatVersion: 2 };

        const outcome = validateBackupFile(invalidFile);

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('Versione del formato');
        }
    });

    it('rifiuta un file senza il campo workouts', () => {
        const invalidFile = { formatVersion: 1, exportedAt: '2026-01-20T10:00:00.000Z' };

        const outcome = validateBackupFile(invalidFile);

        expect(outcome.valid).toBe(false);
    });

    it('rifiuta la gerarchia violata: le serie non possono stare direttamente sotto il gruppo', () => {
        const workout = buildValidWorkout();
        const originalGroup = workout.muscleGroups[0]!;
        const groupWithSetsInsteadOfExercises = {
            id: originalGroup.id,
            name: originalGroup.name,
            position: originalGroup.position,
            sets: originalGroup.exercises[0]!.sets
        };
        const invalidWorkout = { ...workout, muscleGroups: [groupWithSetsInsteadOfExercises] };

        const outcome = validateBackupFile(buildBackupFilePayload([invalidWorkout]));

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('exercises');
        }
    });

    it('rifiuta un workoutDate che non è una data locale valida', () => {
        const invalidWorkout = { ...buildValidWorkout(), workoutDate: '2026-02-30' };

        const outcome = validateBackupFile(buildBackupFilePayload([invalidWorkout]));

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('workoutDate');
        }
    });

    it('rifiuta position non contigue', () => {
        const workout = buildValidWorkout();
        const shiftedGroup = { ...workout.muscleGroups[0]!, position: 3 };

        const outcome = validateBackupFile(buildBackupFilePayload([{ ...workout, muscleGroups: [shiftedGroup] }]));

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('contigue');
        }
    });

    it('rifiuta ripetizioni non intere o non positive', () => {
        const workout = buildValidWorkout();
        const invalidSet = { ...workout.muscleGroups[0]!.exercises[0]!.sets[0]!, repetitions: 0 };
        const invalidExercise = { ...workout.muscleGroups[0]!.exercises[0]!, sets: [invalidSet] };
        const invalidGroup = { ...workout.muscleGroups[0]!, exercises: [invalidExercise] };

        const outcome = validateBackupFile(buildBackupFilePayload([{ ...workout, muscleGroups: [invalidGroup] }]));

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('repetitions');
        }
    });

    it('rifiuta un peso negativo', () => {
        const workout = buildValidWorkout();
        const invalidSet = { ...workout.muscleGroups[0]!.exercises[0]!.sets[0]!, weight: -5 };
        const invalidExercise = { ...workout.muscleGroups[0]!.exercises[0]!, sets: [invalidSet] };
        const invalidGroup = { ...workout.muscleGroups[0]!, exercises: [invalidExercise] };

        const outcome = validateBackupFile(buildBackupFilePayload([{ ...workout, muscleGroups: [invalidGroup] }]));

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('weight');
        }
    });

    it('accetta un peso zero', () => {
        const workout = buildValidWorkout();
        const zeroWeightSet = { ...workout.muscleGroups[0]!.exercises[0]!.sets[0]!, weight: 0 };
        const exerciseWithZeroWeight = { ...workout.muscleGroups[0]!.exercises[0]!, sets: [zeroWeightSet] };
        const groupWithZeroWeight = { ...workout.muscleGroups[0]!, exercises: [exerciseWithZeroWeight] };

        const outcome = validateBackupFile(buildBackupFilePayload([{ ...workout, muscleGroups: [groupWithZeroWeight] }]));

        expect(outcome.valid).toBe(true);
    });
});
