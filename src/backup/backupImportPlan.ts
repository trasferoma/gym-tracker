import type { Workout } from '@/domain/workout';

export interface BackupImportSummary {
    readonly totalInFile: number;
    readonly newCount: number;
    readonly alreadyPresentCount: number;
    readonly newerThanLocalCount: number;
}

export interface BackupImportPlan {
    readonly summary: BackupImportSummary;
    readonly mergedWorkouts: readonly Workout[];
}

export function planImport(fileWorkouts: readonly Workout[], localWorkouts: readonly Workout[]): BackupImportPlan {
    const localEntries: (readonly [string, Workout])[] = localWorkouts.map((workout) => [workout.id, workout]);
    const localById = new Map(localEntries);
    const summary = summarizeImport(fileWorkouts, localById);
    const mergedWorkouts = mergeWorkouts(fileWorkouts, localById);
    return { summary, mergedWorkouts };
}

function summarizeImport(fileWorkouts: readonly Workout[], localById: ReadonlyMap<string, Workout>): BackupImportSummary {
    const alreadyPresentWorkouts = fileWorkouts.filter((workout) => localById.has(workout.id));
    const newerThanLocalCount = alreadyPresentWorkouts.filter((workout) => isNewerThanLocal(workout, localById)).length;
    return {
        totalInFile: fileWorkouts.length,
        newCount: fileWorkouts.length - alreadyPresentWorkouts.length,
        alreadyPresentCount: alreadyPresentWorkouts.length,
        newerThanLocalCount
    };
}

function isNewerThanLocal(fileWorkout: Workout, localById: ReadonlyMap<string, Workout>): boolean {
    const localWorkout = localById.get(fileWorkout.id);
    return localWorkout !== undefined && fileWorkout.updatedAt > localWorkout.updatedAt;
}

function mergeWorkouts(fileWorkouts: readonly Workout[], localById: ReadonlyMap<string, Workout>): readonly Workout[] {
    const mergedById = new Map(localById);
    for (const fileWorkout of fileWorkouts) {
        const localWorkout = mergedById.get(fileWorkout.id);
        const winner = pickMoreRecentWorkout(fileWorkout, localWorkout);
        mergedById.set(fileWorkout.id, winner);
    }
    return Array.from(mergedById.values());
}

function pickMoreRecentWorkout(fileWorkout: Workout, localWorkout: Workout | undefined): Workout {
    if (!localWorkout) {
        return fileWorkout;
    }
    return fileWorkout.updatedAt > localWorkout.updatedAt ? fileWorkout : localWorkout;
}
