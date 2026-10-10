import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';

import { GymTrackerDatabase } from './gymTrackerDatabase';

const DATABASE_NAME = 'gym-tracker-migration-test';

const BENCH_PRESS = {
    id: 'ex-bench',
    name: 'Panca piana',
    position: 0,
    notes: 'presa stretta',
    sets: [
        { id: 'set-1', position: 0, repetitions: 8, weight: 60, completed: true, notes: 'facile' },
        { id: 'set-2', position: 1, repetitions: 6, weight: 65, completed: false, notes: '', issue: 'warning' }
    ]
};

const FLYES = {
    id: 'ex-flyes',
    name: 'Croci',
    position: 1,
    notes: '',
    sets: [{ id: 'set-3', position: 0, repetitions: 12, weight: 14, completed: true, notes: '' }]
};

const SQUAT = {
    id: 'ex-squat',
    name: 'Squat',
    position: 0,
    notes: '',
    sets: [{ id: 'set-4', position: 0, repetitions: 5, weight: 100, completed: true, notes: 'ok', issue: 'critical' }]
};

const LEGACY_WORKOUT = {
    id: 'workout-1',
    workoutDate: '2026-01-15',
    status: 'completed',
    notes: 'giornata pesante',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T11:00:00.000Z',
    muscleGroups: [
        { id: 'group-1', name: 'Petto', position: 0, exercises: [BENCH_PRESS, FLYES] },
        { id: 'group-2', name: 'Gambe', position: 1, exercises: [SQUAT] },
        { id: 'group-3', name: 'Spalle', position: 2, exercises: [] }
    ]
};

async function createLegacyDatabase(): Promise<void> {
    const legacyDatabase = new Dexie(DATABASE_NAME);
    legacyDatabase.version(1).stores({
        workouts: 'id, workoutDate, status, createdAt',
        appMeta: 'key'
    });
    await legacyDatabase.table('workouts').put(LEGACY_WORKOUT);
    legacyDatabase.close();
}

afterEach(async () => {
    await Dexie.delete(DATABASE_NAME);
});

describe('migrazione dello schema alla versione 2', () => {
    it('avvolge ogni esercizio in un raggruppamento singolo senza perdere dati', async () => {
        await createLegacyDatabase();
        const database = new GymTrackerDatabase(DATABASE_NAME);

        const migrated = await database.workouts.get('workout-1');
        database.close();

        expect(migrated).toBeDefined();
        expect(migrated?.notes).toBe('giornata pesante');
        expect(migrated?.status).toBe('completed');
        expect(migrated?.createdAt).toBe(LEGACY_WORKOUT.createdAt);
        expect(migrated?.updatedAt).toBe(LEGACY_WORKOUT.updatedAt);
        const chest = migrated?.muscleGroups[0];
        expect(chest).not.toHaveProperty('exercises');
        expect(chest?.clusters).toHaveLength(2);
        expect(chest?.clusters.map((cluster) => cluster.position)).toEqual([0, 1]);
        expect(chest?.clusters.map((cluster) => cluster.kind)).toEqual(['single', 'single']);
        expect(chest?.clusters.map((cluster) => cluster.restAfterRoundSeconds)).toEqual([0, 0]);
        expect(chest?.clusters.map((cluster) => cluster.restBetweenExercisesSeconds)).toEqual([0, 0]);
        expect(chest?.clusters.flatMap((cluster) => cluster.exercises)).toEqual([
            { ...BENCH_PRESS, position: 0 },
            { ...FLYES, position: 0 }
        ]);
        const legs = migrated?.muscleGroups[1];
        expect(legs?.clusters).toHaveLength(1);
        expect(legs?.clusters[0]?.exercises).toEqual([SQUAT]);
    });

    it('lascia un gruppo senza esercizi con raggruppamenti vuoti', async () => {
        await createLegacyDatabase();
        const database = new GymTrackerDatabase(DATABASE_NAME);

        const migrated = await database.workouts.get('workout-1');
        database.close();

        const shoulders = migrated?.muscleGroups[2];
        expect(shoulders?.clusters).toEqual([]);
        expect(shoulders).not.toHaveProperty('exercises');
    });

    it('non modifica un record già nella forma con raggruppamenti', async () => {
        const legacyDatabase = new Dexie(DATABASE_NAME);
        legacyDatabase.version(1).stores({ workouts: 'id, workoutDate, status, createdAt', appMeta: 'key' });
        const current = {
            ...LEGACY_WORKOUT,
            muscleGroups: [{ id: 'group-1', name: 'Petto', position: 0, clusters: [] }]
        };
        await legacyDatabase.table('workouts').put(current);
        legacyDatabase.close();
        const database = new GymTrackerDatabase(DATABASE_NAME);

        const migrated = await database.workouts.get('workout-1');
        database.close();

        expect(migrated).toEqual(current);
    });
});
