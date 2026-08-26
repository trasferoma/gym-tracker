import Dexie, { type Table } from 'dexie';

import type { Workout } from '@/domain/workout';

export interface AppMetaEntry {
    readonly key: string;
    readonly value: string;
}

class GymTrackerDatabase extends Dexie {
    workouts!: Table<Workout, string>;
    appMeta!: Table<AppMetaEntry, string>;

    constructor() {
        super('gym-tracker');
        this.version(1).stores({
            workouts: 'id, workoutDate, status, createdAt',
            appMeta: 'key'
        });
    }
}

export const gymTrackerDatabase = new GymTrackerDatabase();
