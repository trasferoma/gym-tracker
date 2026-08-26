import { ref, type Ref } from 'vue';

import { countWorkout, type WorkoutCounts } from '@/domain/workoutCounts';
import type { Workout } from '@/domain/workout';
import {
    readStorageStatus,
    requestPersistentStorage,
    type PersistenceRequestOutcome,
    type StorageStatus
} from '@/persistence/storagePersistence';
import { listAllWorkouts } from '@/persistence/workoutRepository';

export interface WorkoutTotals extends WorkoutCounts {
    readonly workouts: number;
}

export interface UseStorageStatus {
    readonly storageStatus: Ref<StorageStatus | undefined>;
    readonly totals: Ref<WorkoutTotals>;
    readonly loading: Ref<boolean>;
    refresh(): Promise<void>;
    requestPersistence(): Promise<PersistenceRequestOutcome>;
}

const EMPTY_TOTALS: WorkoutTotals = { workouts: 0, exercises: 0, sets: 0 };

export function useStorageStatus(): UseStorageStatus {
    const storageStatus = ref<StorageStatus>();
    const totals = ref<WorkoutTotals>(EMPTY_TOTALS);
    const loading = ref(false);

    async function refresh(): Promise<void> {
        loading.value = true;
        try {
            const statusPromise = readStorageStatus();
            const workoutsPromise = listAllWorkouts();
            const [status, workouts] = await Promise.all([statusPromise, workoutsPromise]);
            storageStatus.value = status;
            totals.value = sumTotals(workouts);
        } finally {
            loading.value = false;
        }
    }

    async function requestPersistence(): Promise<PersistenceRequestOutcome> {
        const outcome = await requestPersistentStorage();
        await refresh();
        return outcome;
    }

    return { storageStatus, totals, loading, refresh, requestPersistence };
}

function sumTotals(workouts: readonly Workout[]): WorkoutTotals {
    return workouts.reduce(addWorkoutToTotals, EMPTY_TOTALS);
}

function addWorkoutToTotals(totals: WorkoutTotals, workout: Workout): WorkoutTotals {
    const counts = countWorkout(workout);
    return {
        workouts: totals.workouts + 1,
        exercises: totals.exercises + counts.exercises,
        sets: totals.sets + counts.sets
    };
}
