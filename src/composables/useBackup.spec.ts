import { afterEach, describe, expect, it, vi } from 'vitest';

import * as backupExport from '@/backup/backupExport';
import { useBackup } from './useBackup';
import { gymTrackerDatabase } from '@/persistence/gymTrackerDatabase';
import { listAllWorkouts, saveWorkout } from '@/persistence/workoutRepository';
import { createDraftWorkout } from '@/domain/workoutFactory';
import { todayLocalDate } from '@/domain/localDate';

afterEach(async () => {
    vi.restoreAllMocks();
    await gymTrackerDatabase.workouts.clear();
    await gymTrackerDatabase.appMeta.clear();
});

describe('loadLastBackupDate', () => {
    it('legge undefined quando non è mai stato esportato un backup', async () => {
        const backup = useBackup();

        await backup.loadLastBackupDate();

        expect(backup.lastBackupDate.value).toBeUndefined();
    });
});

describe('exportBackup', () => {
    it('scarica il file del giorno e registra la data dell ultimo backup', async () => {
        const downloadSpy = vi.spyOn(backupExport, 'downloadBackupFile').mockImplementation(() => {});
        await saveWorkout(createDraftWorkout('2026-01-10'));
        const backup = useBackup();

        await backup.exportBackup();

        const today = todayLocalDate();
        expect(downloadSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ formatVersion: 1 }), `gym-tracker-backup-${today}.json`);
        expect(backup.lastBackupDate.value).toBe(today);
        const secondBackup = useBackup();
        await secondBackup.loadLastBackupDate();
        expect(secondBackup.lastBackupDate.value).toBe(today);
    });
});

describe('prepareImport', () => {
    it('rifiuta un testo che non è JSON valido', async () => {
        const backup = useBackup();

        await backup.prepareImport('non è json');

        expect(backup.importReadiness.value).toEqual({
            state: 'invalid',
            reason: 'Il file non contiene un JSON valido.'
        });
    });

    it('rifiuta un file strutturalmente non valido', async () => {
        const backup = useBackup();

        await backup.prepareImport(JSON.stringify({ formatVersion: 2, exportedAt: '2026-01-01', workouts: [] }));

        expect(backup.importReadiness.value.state).toBe('invalid');
    });

    it('produce il riepilogo di un file valido senza scrivere nel database', async () => {
        const local = createDraftWorkout('2026-01-01');
        await saveWorkout(local);
        const fromFile = createDraftWorkout('2026-02-01');
        const fileContent = JSON.stringify({
            formatVersion: 1,
            exportedAt: '2026-02-01T00:00:00.000Z',
            workouts: [local, fromFile]
        });
        const backup = useBackup();

        await backup.prepareImport(fileContent);

        expect(backup.importReadiness.value).toEqual({
            state: 'ready',
            summary: { totalInFile: 2, newCount: 1, alreadyPresentCount: 1, newerThanLocalCount: 0 }
        });
        expect(await listAllWorkouts()).toEqual([local]);
    });
});

describe('confirmMerge', () => {
    it('unisce il piano preparato e torna allo stato inattivo', async () => {
        const local = createDraftWorkout('2026-01-01');
        await saveWorkout(local);
        const fromFile = createDraftWorkout('2026-03-01');
        const backup = useBackup();
        await backup.prepareImport(JSON.stringify({
            formatVersion: 1,
            exportedAt: '2026-03-01T00:00:00.000Z',
            workouts: [fromFile]
        }));

        await backup.confirmMerge();

        expect(backup.importReadiness.value).toEqual({ state: 'idle' });
        const all = await listAllWorkouts();
        expect(all.map((workout) => workout.id).sort()).toEqual([local.id, fromFile.id].sort());
    });
});

describe('confirmReplace', () => {
    it('sostituisce tutto con i workout del file e torna allo stato inattivo', async () => {
        await saveWorkout(createDraftWorkout('2026-01-01'));
        const fromFile = createDraftWorkout('2026-04-01');
        const backup = useBackup();
        await backup.prepareImport(JSON.stringify({
            formatVersion: 1,
            exportedAt: '2026-04-01T00:00:00.000Z',
            workouts: [fromFile]
        }));

        await backup.confirmReplace();

        expect(backup.importReadiness.value).toEqual({ state: 'idle' });
        expect(await listAllWorkouts()).toEqual([fromFile]);
    });
});

describe('resetAllData', () => {
    it('svuota i workout e dimentica la data dell ultimo backup in memoria', async () => {
        vi.spyOn(backupExport, 'downloadBackupFile').mockImplementation(() => {});
        await saveWorkout(createDraftWorkout('2026-01-10'));
        const backup = useBackup();
        await backup.exportBackup();
        expect(backup.lastBackupDate.value).toBe(todayLocalDate());

        await backup.resetAllData();

        expect(backup.lastBackupDate.value).toBeUndefined();
        expect(await listAllWorkouts()).toEqual([]);
    });
});
