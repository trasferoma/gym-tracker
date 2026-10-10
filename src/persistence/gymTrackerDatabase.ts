import Dexie, { type Table, type Transaction } from 'dexie';

import { wrapExercisesInSingleClusters } from '@/domain/exerciseClusters';
import type { Exercise, MuscleGroupWorkout, Workout } from '@/domain/workout';

export interface AppMetaEntry {
    readonly key: string;
    readonly value: string;
}

interface LegacyMuscleGroupRecord {
    readonly exercises?: readonly Exercise[];
}

interface StoredWorkoutRecord {
    muscleGroups: (MuscleGroupWorkout | (LegacyMuscleGroupRecord & Omit<MuscleGroupWorkout, 'clusters'>))[];
}

const WORKOUT_INDEXES = 'id, workoutDate, status, createdAt';

export class GymTrackerDatabase extends Dexie {
    workouts!: Table<Workout, string>;
    appMeta!: Table<AppMetaEntry, string>;

    constructor(databaseName = 'gym-tracker') {
        super(databaseName);
        this.version(1).stores({
            workouts: WORKOUT_INDEXES,
            appMeta: 'key'
        });
        this.version(2).stores({
            workouts: WORKOUT_INDEXES,
            appMeta: 'key'
        }).upgrade(wrapExercisesOfStoredWorkouts);
    }
}

async function wrapExercisesOfStoredWorkouts(transaction: Transaction): Promise<void> {
    await transaction.table('workouts').toCollection().modify((record: StoredWorkoutRecord) => {
        record.muscleGroups = record.muscleGroups.map(toGroupWithClusters);
    });
}

function toGroupWithClusters(
        group: MuscleGroupWorkout | (LegacyMuscleGroupRecord & Omit<MuscleGroupWorkout, 'clusters'>)
): MuscleGroupWorkout {
    if ('clusters' in group) {
        return group;
    }
    const { exercises = [], ...rest } = group;
    return { ...rest, clusters: wrapExercisesInSingleClusters(exercises) };
}

export const gymTrackerDatabase = new GymTrackerDatabase();
