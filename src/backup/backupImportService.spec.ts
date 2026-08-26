import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyMergeImport, applyReplaceImport } from './backupImportService';
import { planImport } from './backupImportPlan';
import { validateBackupFile } from './backupValidation';
import { gymTrackerDatabase } from '@/persistence/gymTrackerDatabase';
import { listAllWorkouts, saveWorkout } from '@/persistence/workoutRepository';
import { createDraftWorkout } from '@/domain/workoutFactory';

afterEach(async () => {
    vi.restoreAllMocks();
    await gymTrackerDatabase.workouts.clear();
});

describe('applyMergeImport', () => {
    it('scrive nel database il piano di unione per id, workout intero', async () => {
        const local = createDraftWorkout('2026-01-01');
        await saveWorkout(local);
        const fromFile = { ...local, notes: 'aggiornato dal file', updatedAt: '2099-01-01T00:00:00.000Z' };

        const plan = planImport([fromFile], [local]);
        await applyMergeImport(plan);

        const all = await listAllWorkouts();
        expect(all).toEqual([fromFile]);
    });
});

describe('applyReplaceImport', () => {
    it('sostituisce tutto in una sola transazione', async () => {
        const existing = createDraftWorkout('2026-01-01');
        await saveWorkout(existing);
        const replacement = createDraftWorkout('2026-02-01');

        await applyReplaceImport([replacement]);

        const all = await listAllWorkouts();
        expect(all).toEqual([replacement]);
    });

    it('lascia intatti i dati preesistenti se la sostituzione fallisce a metà', async () => {
        const existing = createDraftWorkout('2026-01-01');
        await saveWorkout(existing);
        vi.spyOn(gymTrackerDatabase.workouts, 'bulkPut').mockRejectedValueOnce(new Error('errore simulato'));

        await expect(applyReplaceImport([createDraftWorkout('2026-03-01')])).rejects.toThrow();

        const all = await listAllWorkouts();
        expect(all).toEqual([existing]);
    });
});

describe('un backup non valido non tocca il database', () => {
    it('la validazione fallisce e il contenuto del database resta identico', async () => {
        const existing = createDraftWorkout('2026-01-01');
        await saveWorkout(existing);

        const result = validateBackupFile({ formatVersion: 2, exportedAt: '2026-01-01', workouts: [] });

        expect(result.valid).toBe(false);
        const all = await listAllWorkouts();
        expect(all).toEqual([existing]);
    });
});
