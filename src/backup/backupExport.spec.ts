import { describe, expect, it } from 'vitest';

import { backupFileName, buildBackupFile } from './backupExport';
import { createDraftWorkout } from '@/domain/workoutFactory';

describe('buildBackupFile', () => {
    it('produce formatVersion 1, l istante di esportazione e l elenco completo degli allenamenti', () => {
        const workouts = [createDraftWorkout('2026-01-10'), createDraftWorkout('2026-01-15')];
        const exportedAt = new Date(2026, 0, 20, 10, 30);

        const backup = buildBackupFile(workouts, exportedAt);

        expect(backup.formatVersion).toBe(1);
        expect(backup.exportedAt).toBe(exportedAt.toISOString());
        expect(backup.workouts).toEqual(workouts);
    });
});

describe('backupFileName', () => {
    it('usa la data locale del giorno di esportazione', () => {
        const exportedAt = new Date(2026, 0, 20, 23, 45);

        expect(backupFileName(exportedAt)).toBe('gym-tracker-backup-2026-01-20.json');
    });
});
