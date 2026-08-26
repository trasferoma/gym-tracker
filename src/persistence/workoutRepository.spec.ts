import { afterEach, describe, expect, it, vi } from 'vitest';

import { gymTrackerDatabase } from './gymTrackerDatabase';
import { readLastBackupDate, writeLastBackupDate } from './appMetaStore';
import {
    deleteWorkout,
    findWorkoutById,
    listAllWorkouts,
    replaceAllWorkouts,
    resetAllLocalData,
    saveWorkout
} from './workoutRepository';
import { toLocalDate } from '@/domain/localDate';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from '@/domain/workoutFactory';
import type { Workout } from '@/domain/workout';

function buildNestedWorkout(workoutDate: string): Workout {
    const draft = createDraftWorkout(workoutDate);
    const exercise = { ...createExercise('Panca piana', 0), sets: [createExerciseSet(0, 6, 20), createExerciseSet(1, 6, 22)] };
    const group = { ...createMuscleGroupWorkout('Petto', 0), exercises: [exercise] };
    return { ...draft, muscleGroups: [group] };
}

afterEach(async () => {
    vi.restoreAllMocks();
    await gymTrackerDatabase.workouts.clear();
    await gymTrackerDatabase.appMeta.clear();
});

describe('findWorkoutById / saveWorkout', () => {
    it('mantiene le serie sotto l esercizio con le position contigue dopo un giro di salvataggio e rilettura', async () => {
        const workout = buildNestedWorkout('2026-01-15');

        await saveWorkout(workout);
        const reloaded = await findWorkoutById(workout.id);

        expect(reloaded).toEqual(workout);
        expect(reloaded?.muscleGroups[0]?.exercises[0]?.sets.map((set) => set.position)).toEqual([0, 1]);
        expect(reloaded?.muscleGroups[0]).not.toHaveProperty('sets');
    });

    it('restituisce undefined per un id inesistente', async () => {
        expect(await findWorkoutById('id-inesistente')).toBeUndefined();
    });
});

describe('deleteWorkout', () => {
    it('rimuove il workout dalla tabella', async () => {
        const workout = buildNestedWorkout('2026-01-15');
        await saveWorkout(workout);

        await deleteWorkout(workout.id);

        expect(await findWorkoutById(workout.id)).toBeUndefined();
    });
});

describe('replaceAllWorkouts', () => {
    it('sostituisce tutti i dati in una sola transazione', async () => {
        const previous = buildNestedWorkout('2026-01-01');
        await saveWorkout(previous);

        const replacement = buildNestedWorkout('2026-02-01');
        await replaceAllWorkouts([replacement]);

        const all = await listAllWorkouts();
        expect(all).toEqual([replacement]);
    });

    it('lascia intatti i dati preesistenti se la sostituzione fallisce a metà', async () => {
        const existing = buildNestedWorkout('2026-01-01');
        await saveWorkout(existing);
        vi.spyOn(gymTrackerDatabase.workouts, 'bulkPut').mockRejectedValueOnce(new Error('errore simulato a metà scrittura'));

        await expect(replaceAllWorkouts([buildNestedWorkout('2026-03-01')])).rejects.toThrow();

        const remaining = await listAllWorkouts();
        expect(remaining).toEqual([existing]);
    });
});

describe('resetAllLocalData', () => {
    it('svuota sia gli allenamenti sia la data dell ultimo backup in una sola transazione', async () => {
        const workout = buildNestedWorkout('2026-01-01');
        await saveWorkout(workout);
        await writeLastBackupDate('2026-01-10');

        await resetAllLocalData();

        expect(await listAllWorkouts()).toEqual([]);
        expect(await readLastBackupDate()).toBeUndefined();
    });

    it('lascia intatti allenamenti e data di backup se il reset fallisce a metà', async () => {
        const workout = buildNestedWorkout('2026-01-01');
        await saveWorkout(workout);
        await writeLastBackupDate('2026-01-10');
        vi.spyOn(gymTrackerDatabase.appMeta, 'delete').mockRejectedValueOnce(new Error('errore simulato a metà scrittura'));

        await expect(resetAllLocalData()).rejects.toThrow();

        expect(await listAllWorkouts()).toEqual([workout]);
        expect(await readLastBackupDate()).toBe('2026-01-10');
    });
});

describe('data locale attraverso salvataggio e rilettura', () => {
    it('non sposta workoutDate quando viene salvato e riletto a un ora limite in un fuso diverso da UTC', async () => {
        vi.stubEnv('TZ', 'Pacific/Honolulu');
        const lateEveningLocal = new Date(2026, 0, 15, 23, 30);
        const workoutDate = toLocalDate(lateEveningLocal);
        const workout = buildNestedWorkout(workoutDate);

        await saveWorkout(workout);
        const reloaded = await findWorkoutById(workout.id);

        expect(reloaded?.workoutDate).toBe('2026-01-15');
        vi.unstubAllEnvs();
    });
});
