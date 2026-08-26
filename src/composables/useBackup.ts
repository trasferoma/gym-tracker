import { ref, type Ref } from 'vue';

import { backupFileName, buildBackupFile, downloadBackupFile } from '@/backup/backupExport';
import { applyMergeImport, applyReplaceImport } from '@/backup/backupImportService';
import { planImport, type BackupImportPlan, type BackupImportSummary } from '@/backup/backupImportPlan';
import { validateBackupFile } from '@/backup/backupValidation';
import { todayLocalDate } from '@/domain/localDate';
import type { Workout } from '@/domain/workout';
import { readLastBackupDate, writeLastBackupDate } from '@/persistence/appMetaStore';
import { listAllWorkouts, resetAllLocalData } from '@/persistence/workoutRepository';

export type ImportReadiness =
    | { readonly state: 'idle' }
    | { readonly state: 'invalid'; readonly reason: string }
    | { readonly state: 'ready'; readonly summary: BackupImportSummary };

export interface UseBackup {
    readonly lastBackupDate: Ref<string | undefined>;
    readonly importReadiness: Ref<ImportReadiness>;
    loadLastBackupDate(): Promise<void>;
    exportBackup(): Promise<void>;
    prepareImport(fileContent: string): Promise<void>;
    confirmMerge(): Promise<void>;
    confirmReplace(): Promise<void>;
    resetAllData(): Promise<void>;
}

interface PendingImport {
    readonly fileWorkouts: readonly Workout[];
    readonly plan: BackupImportPlan;
}

export function useBackup(): UseBackup {
    const lastBackupDate = ref<string>();
    const importReadiness = ref<ImportReadiness>({ state: 'idle' });
    let pendingImport: PendingImport | undefined;

    async function loadLastBackupDate(): Promise<void> {
        lastBackupDate.value = await readLastBackupDate();
    }

    async function exportBackup(): Promise<void> {
        const workouts = await listAllWorkouts();
        const now = new Date();
        const backup = buildBackupFile(workouts, now);
        const fileName = backupFileName(now);
        downloadBackupFile(backup, fileName);
        const backupDate = todayLocalDate();
        await writeLastBackupDate(backupDate);
        lastBackupDate.value = backupDate;
    }

    async function prepareImport(fileContent: string): Promise<void> {
        const parsedJson = parseJson(fileContent);
        if (parsedJson === undefined) {
            importReadiness.value = { state: 'invalid', reason: 'Il file non contiene un JSON valido.' };
            return;
        }
        const validation = validateBackupFile(parsedJson);
        if (!validation.valid) {
            importReadiness.value = { state: 'invalid', reason: validation.reason };
            return;
        }
        const localWorkouts = await listAllWorkouts();
        const plan = planImport(validation.backup.workouts, localWorkouts);
        pendingImport = { fileWorkouts: validation.backup.workouts, plan };
        importReadiness.value = { state: 'ready', summary: plan.summary };
    }

    async function confirmMerge(): Promise<void> {
        if (!pendingImport) {
            return;
        }
        await applyMergeImport(pendingImport.plan);
        resetImportState();
    }

    async function confirmReplace(): Promise<void> {
        if (!pendingImport) {
            return;
        }
        await applyReplaceImport(pendingImport.fileWorkouts);
        resetImportState();
    }

    function resetImportState(): void {
        pendingImport = undefined;
        importReadiness.value = { state: 'idle' };
    }

    async function resetAllData(): Promise<void> {
        await resetAllLocalData();
        lastBackupDate.value = undefined;
    }

    return {
        lastBackupDate,
        importReadiness,
        loadLastBackupDate,
        exportBackup,
        prepareImport,
        confirmMerge,
        confirmReplace,
        resetAllData
    };
}

function parseJson(fileContent: string): unknown {
    try {
        return JSON.parse(fileContent) as unknown;
    } catch {
        return undefined;
    }
}
