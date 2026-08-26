import type { BackupImportPlan } from './backupImportPlan';
import type { Workout } from '@/domain/workout';
import { replaceAllWorkouts, saveWorkouts } from '@/persistence/workoutRepository';

export async function applyMergeImport(plan: BackupImportPlan): Promise<void> {
    await saveWorkouts(plan.mergedWorkouts);
}

export async function applyReplaceImport(fileWorkouts: readonly Workout[]): Promise<void> {
    await replaceAllWorkouts(fileWorkouts);
}
