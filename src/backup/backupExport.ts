import { toLocalDate } from '@/domain/localDate';
import type { Workout } from '@/domain/workout';
import { BACKUP_FORMAT_VERSION, type BackupFile } from './backupFormat';

export function buildBackupFile(workouts: readonly Workout[], exportedAt: Date): BackupFile {
    return {
        formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt: exportedAt.toISOString(),
        workouts
    };
}

export function backupFileName(exportedAt: Date): string {
    return `gym-tracker-backup-${toLocalDate(exportedAt)}.json`;
}

export function downloadBackupFile(backup: BackupFile, fileName: string): void {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}
