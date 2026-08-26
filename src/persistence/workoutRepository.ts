import { gymTrackerDatabase } from './gymTrackerDatabase';
import { clearLastBackupDate } from './appMetaStore';
import type { Workout } from '@/domain/workout';

export async function findWorkoutById(id: string): Promise<Workout | undefined> {
    return gymTrackerDatabase.workouts.get(id);
}

export async function listAllWorkouts(): Promise<readonly Workout[]> {
    return gymTrackerDatabase.workouts.toArray();
}

export async function saveWorkout(workout: Workout): Promise<void> {
    await gymTrackerDatabase.workouts.put(workout);
}

export async function deleteWorkout(id: string): Promise<void> {
    await gymTrackerDatabase.workouts.delete(id);
}

export async function saveWorkouts(workouts: readonly Workout[]): Promise<void> {
    await gymTrackerDatabase.workouts.bulkPut(workouts);
}

export async function replaceAllWorkouts(workouts: readonly Workout[]): Promise<void> {
    await gymTrackerDatabase.transaction('rw', gymTrackerDatabase.workouts, async () => {
        await gymTrackerDatabase.workouts.clear();
        await gymTrackerDatabase.workouts.bulkPut(workouts);
    });
}

export async function resetAllLocalData(): Promise<void> {
    await gymTrackerDatabase.transaction('rw', gymTrackerDatabase.workouts, gymTrackerDatabase.appMeta, async () => {
        await gymTrackerDatabase.workouts.clear();
        await clearLastBackupDate();
    });
}
