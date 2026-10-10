import { describe, expect, it } from 'vitest';

import { validateBackupFile } from './backupValidation';
import { wrapExercisesInSingleClusters } from '@/domain/exerciseClusters';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from '@/domain/workoutFactory';
import type { Exercise, ExerciseCluster, Workout } from '@/domain/workout';

function buildValidWorkout(): Workout {
    const exercise = { ...createExercise('Panca piana', 0), sets: [createExerciseSet(0, 6, 20)] };
    const group = { ...createMuscleGroupWorkout('Petto', 0), clusters: wrapExercisesInSingleClusters([exercise]) };
    return { ...createDraftWorkout('2026-01-15'), muscleGroups: [group] };
}

function buildBackupFilePayload(workouts: readonly unknown[] = [buildValidWorkout()]): Record<string, unknown> {
    return { formatVersion: 2, exportedAt: '2026-01-20T10:00:00.000Z', workouts };
}

function firstCluster(workout: Workout): ExerciseCluster {
    return workout.muscleGroups[0]!.clusters[0]!;
}

function firstExercise(workout: Workout): Exercise {
    return firstCluster(workout).exercises[0]!;
}

function workoutWithClusters(workout: Workout, clusters: readonly unknown[]): unknown {
    const group = { ...workout.muscleGroups[0]!, clusters };
    return { ...workout, muscleGroups: [group] };
}

function workoutWithFirstCluster(workout: Workout, changes: Record<string, unknown>): unknown {
    return workoutWithClusters(workout, [{ ...firstCluster(workout), ...changes }]);
}

function workoutWithFirstExercise(workout: Workout, changes: Record<string, unknown>): unknown {
    const exercise = { ...firstExercise(workout), ...changes };
    return workoutWithFirstCluster(workout, { exercises: [exercise] });
}

function workoutWithFirstSet(workout: Workout, changes: Record<string, unknown>): unknown {
    const set = { ...firstExercise(workout).sets[0]!, ...changes };
    return workoutWithFirstExercise(workout, { sets: [set] });
}

function buildMultipleCluster(kind: string, exerciseCount: number): Record<string, unknown> {
    const exercises = Array.from({ length: exerciseCount }, (_, index) => createExercise(`Esercizio ${index}`, index));
    return { ...firstCluster(buildValidWorkout()), kind, exercises };
}

function expectRejection(invalidWorkout: unknown, expectedReason: string): void {
    const outcome = validateBackupFile(buildBackupFilePayload([invalidWorkout]));

    expect(outcome.valid).toBe(false);
    if (!outcome.valid) {
        expect(outcome.reason).toContain(expectedReason);
    }
}

describe('validateBackupFile', () => {
    it('accetta un file corretto e restituisce il contenuto tipizzato', () => {
        const workout = buildValidWorkout();

        const result = validateBackupFile(buildBackupFilePayload([workout]));

        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(result.backup.formatVersion).toBe(2);
            expect(result.backup.workouts).toEqual([workout]);
        }
    });

    it('rifiuta un input che non è un oggetto', () => {
        const result = validateBackupFile('non un oggetto');

        expect(result.valid).toBe(false);
    });

    it('rifiuta una versione del formato ignota', () => {
        const invalidFile = { ...buildBackupFilePayload(), formatVersion: 1 };

        const outcome = validateBackupFile(invalidFile);

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('Versione del formato non supportata');
        }
    });

    it('rifiuta un file senza il campo workouts', () => {
        const invalidFile = { formatVersion: 2, exportedAt: '2026-01-20T10:00:00.000Z' };

        const outcome = validateBackupFile(invalidFile);

        expect(outcome.valid).toBe(false);
        if (!outcome.valid) {
            expect(outcome.reason).toContain('workouts');
        }
    });

    it('rifiuta la gerarchia violata: le serie non possono stare direttamente sotto il gruppo', () => {
        const workout = buildValidWorkout();
        const originalGroup = workout.muscleGroups[0]!;
        const groupWithSetsInsteadOfClusters = {
            id: originalGroup.id,
            name: originalGroup.name,
            position: originalGroup.position,
            sets: firstExercise(workout).sets
        };
        const invalidWorkout = { ...workout, muscleGroups: [groupWithSetsInsteadOfClusters] };

        expectRejection(invalidWorkout, 'clusters');
    });

    it('rifiuta gli esercizi direttamente sotto il gruppo, senza raggruppamenti', () => {
        const workout = buildValidWorkout();
        const groupWithExercises = { ...workout.muscleGroups[0]!, clusters: undefined, exercises: [firstExercise(workout)] };

        expectRejection({ ...workout, muscleGroups: [groupWithExercises] }, 'clusters');
    });

    it('rifiuta un workoutDate che non è una data locale valida', () => {
        const invalidWorkout = { ...buildValidWorkout(), workoutDate: '2026-02-30' };

        expectRejection(invalidWorkout, 'workoutDate');
    });

    it('rifiuta position non contigue', () => {
        const workout = buildValidWorkout();
        const shiftedGroup = { ...workout.muscleGroups[0]!, position: 3 };

        expectRejection({ ...workout, muscleGroups: [shiftedGroup] }, 'contigue');
    });

    it('rifiuta ripetizioni non intere o non positive', () => {
        expectRejection(workoutWithFirstSet(buildValidWorkout(), { repetitions: 0 }), 'repetitions');
    });

    it('rifiuta un peso negativo', () => {
        expectRejection(workoutWithFirstSet(buildValidWorkout(), { weight: -5 }), 'weight');
    });

    it('accetta un peso zero', () => {
        const workout = workoutWithFirstSet(buildValidWorkout(), { weight: 0 });

        const outcome = validateBackupFile(buildBackupFilePayload([workout]));

        expect(outcome.valid).toBe(true);
    });

    it('accetta una serie senza il campo issue, come nei backup precedenti alla funzionalità', () => {
        const workout = buildValidWorkout();

        const outcome = validateBackupFile(buildBackupFilePayload([workout]));

        expect(outcome.valid).toBe(true);
        if (outcome.valid) {
            expect(firstExercise(outcome.backup.workouts[0]!).sets[0]).not.toHaveProperty('issue');
        }
    });

    it.each(['warning', 'critical'] as const)('accetta una serie con issue "%s"', (issue) => {
        const workoutWithIssue = workoutWithFirstSet(buildValidWorkout(), { issue });

        const outcome = validateBackupFile(buildBackupFilePayload([workoutWithIssue]));

        expect(outcome.valid).toBe(true);
        if (outcome.valid) {
            expect(firstExercise(outcome.backup.workouts[0]!).sets[0]!.issue).toBe(issue);
        }
    });

    it.each([
        ['una stringa non ammessa', 'grave'],
        ['null', null],
        ['una stringa vuota', ''],
        ['un numero', 1],
        ['un oggetto', { livello: 'warning' }]
    ])('rifiuta una serie con un valore di issue non ammesso: %s', (_description, issue) => {
        expectRejection(workoutWithFirstSet(buildValidWorkout(), { issue }), 'issue');
    });
});

describe('validateBackupFile: raggruppamenti', () => {
    it.each([['superset', 2], ['circuit', 3]])('accetta un %s con almeno due esercizi e tempi validi', (kind, count) => {
        const cluster = { ...buildMultipleCluster(kind, count), restAfterRoundSeconds: 90, restBetweenExercisesSeconds: 30 };
        const workout = workoutWithClusters(buildValidWorkout(), [cluster]);

        const outcome = validateBackupFile(buildBackupFilePayload([workout]));

        expect(outcome.valid).toBe(true);
        if (outcome.valid) {
            expect(outcome.backup.workouts[0]!.muscleGroups[0]!.clusters).toEqual([cluster]);
        }
    });

    it('rifiuta un tipo di raggruppamento sconosciuto', () => {
        expectRejection(workoutWithFirstCluster(buildValidWorkout(), { kind: 'triset' }), 'kind');
    });

    it('rifiuta un singolo con due esercizi', () => {
        const workout = workoutWithClusters(buildValidWorkout(), [buildMultipleCluster('single', 2)]);

        expectRejection(workout, 'singolo');
    });

    it.each(['superset', 'circuit'])('rifiuta un %s con un solo esercizio', (kind) => {
        const workout = workoutWithClusters(buildValidWorkout(), [buildMultipleCluster(kind, 1)]);

        expectRejection(workout, 'almeno due');
    });

    it('rifiuta un raggruppamento vuoto', () => {
        expectRejection(workoutWithFirstCluster(buildValidWorkout(), { exercises: [] }), 'non contiene esercizi');
    });

    it.each([
        ['negativo', -1],
        ['decimale', 1.5],
        ['testuale', '30']
    ])('rifiuta un recupero a fine giro %s', (_description, seconds) => {
        expectRejection(workoutWithFirstCluster(buildValidWorkout(), { restAfterRoundSeconds: seconds }), 'restAfterRoundSeconds');
    });

    it.each([
        ['negativo', -1],
        ['decimale', 0.5]
    ])('rifiuta un recupero fra esercizi %s', (_description, seconds) => {
        const changes = { restBetweenExercisesSeconds: seconds };

        expectRejection(workoutWithFirstCluster(buildValidWorkout(), changes), 'restBetweenExercisesSeconds');
    });

    it('rifiuta posizioni dei raggruppamenti non contigue dentro il gruppo', () => {
        const workout = buildValidWorkout();
        const shiftedCluster = { ...firstCluster(workout), position: 2 };

        expectRejection(workoutWithClusters(workout, [shiftedCluster]), 'contigue');
    });

    it('rifiuta posizioni degli esercizi non contigue dentro il raggruppamento', () => {
        const cluster = buildMultipleCluster('superset', 2);
        const exercises = (cluster.exercises as readonly Exercise[]).map((exercise, index) => ({
            ...exercise,
            position: index * 2
        }));
        const workout = workoutWithClusters(buildValidWorkout(), [{ ...cluster, exercises }]);

        expectRejection(workout, 'contigue');
    });

    it('rifiuta un esercizio che conserva la posizione che aveva nel gruppo', () => {
        expectRejection(workoutWithFirstExercise(buildValidWorkout(), { position: 3 }), 'contigue');
    });
});
