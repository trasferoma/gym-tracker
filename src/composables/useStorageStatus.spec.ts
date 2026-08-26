import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStorageStatus } from './useStorageStatus';
import { gymTrackerDatabase } from '@/persistence/gymTrackerDatabase';
import { saveWorkout } from '@/persistence/workoutRepository';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from '@/domain/workoutFactory';

function stubStorageManager(persistResult: boolean): void {
    vi.stubGlobal('navigator', {
        storage: {
            persist: vi.fn().mockResolvedValue(persistResult),
            persisted: vi.fn().mockResolvedValue(persistResult),
            estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 0 })
        }
    });
}

afterEach(async () => {
    await gymTrackerDatabase.workouts.clear();
    vi.unstubAllGlobals();
});

describe('refresh', () => {
    it('conta allenamenti, esercizi e serie su tutto lo storico', async () => {
        const exercise = { ...createExercise('Panca piana', 0), sets: [createExerciseSet(0), createExerciseSet(1)] };
        const group = { ...createMuscleGroupWorkout('Petto', 0), exercises: [exercise] };
        const withOneExercise = { ...createDraftWorkout('2026-01-01'), muscleGroups: [group] };
        const withNoExercises = createDraftWorkout('2026-01-02');
        await saveWorkout(withOneExercise);
        await saveWorkout(withNoExercises);
        const storageStatus = useStorageStatus();

        await storageStatus.refresh();

        expect(storageStatus.totals.value).toEqual({ workouts: 2, exercises: 1, sets: 2 });
    });

    it('legge lo stato dello storage persistente senza sollevare errori quando l API non è disponibile', async () => {
        const storageStatus = useStorageStatus();

        await storageStatus.refresh();

        expect(storageStatus.storageStatus.value).toEqual({
            persisted: false,
            usageBytes: undefined,
            quotaBytes: undefined,
            canRequestPersistence: false
        });
    });
});

describe('requestPersistence', () => {
    it('restituisce "unavailable" quando l API storage non è disponibile', async () => {
        const storageStatus = useStorageStatus();

        const outcome = await storageStatus.requestPersistence();

        expect(outcome).toBe('unavailable');
    });

    it('restituisce "denied" quando il browser rifiuta la richiesta', async () => {
        stubStorageManager(false);
        const storageStatus = useStorageStatus();

        const outcome = await storageStatus.requestPersistence();

        expect(outcome).toBe('denied');
        expect(storageStatus.storageStatus.value?.persisted).toBe(false);
    });

    it('restituisce "granted" quando il browser concede la richiesta', async () => {
        stubStorageManager(true);
        const storageStatus = useStorageStatus();

        const outcome = await storageStatus.requestPersistence();

        expect(outcome).toBe('granted');
        expect(storageStatus.storageStatus.value?.persisted).toBe(true);
    });
});
