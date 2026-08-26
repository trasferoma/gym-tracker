import type { Workout } from '@/domain/workout';

export const BACKUP_FORMAT_VERSION = 1 as const;

export interface BackupFile {
    readonly formatVersion: typeof BACKUP_FORMAT_VERSION;
    readonly exportedAt: string;
    readonly workouts: readonly Workout[];
}
