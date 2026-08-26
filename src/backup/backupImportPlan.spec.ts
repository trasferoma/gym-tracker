import { describe, expect, it } from 'vitest';

import { planImport } from './backupImportPlan';
import { createDraftWorkout } from '@/domain/workoutFactory';
import type { Workout } from '@/domain/workout';

function withUpdatedAt(workout: Workout, updatedAt: string): Workout {
    return { ...workout, updatedAt };
}

describe('planImport', () => {
    it('conta totale, nuovi, già presenti e più recenti del locale, senza scrivere nel database', () => {
        const localOnly = createDraftWorkout('2026-01-01');
        const sharedOlderInFile = withUpdatedAt(createDraftWorkout('2026-01-02'), '2026-01-02T00:00:00.000Z');
        const sharedNewerInFile = withUpdatedAt(createDraftWorkout('2026-01-03'), '2026-01-05T00:00:00.000Z');
        const localWorkouts = [
            localOnly,
            withUpdatedAt({ ...sharedOlderInFile }, '2026-01-02T00:00:00.000Z'),
            withUpdatedAt({ ...sharedNewerInFile }, '2026-01-03T00:00:00.000Z')
        ];
        const newFromFile = createDraftWorkout('2026-01-10');
        const fileWorkouts = [sharedOlderInFile, sharedNewerInFile, newFromFile];

        const plan = planImport(fileWorkouts, localWorkouts);

        expect(plan.summary).toEqual({
            totalInFile: 3,
            newCount: 1,
            alreadyPresentCount: 2,
            newerThanLocalCount: 1
        });
    });

    it('unisce per id conservando il workout con updatedAt più recente, sostituendo il record intero', () => {
        const staleLocal: Workout = {
            ...createDraftWorkout('2026-01-01'),
            notes: 'nota locale superata',
            updatedAt: '2026-01-01T00:00:00.000Z'
        };
        const freshFromFile: Workout = {
            ...staleLocal,
            notes: 'nota più recente dal file',
            updatedAt: '2026-01-05T00:00:00.000Z'
        };
        const localOnly = createDraftWorkout('2026-02-01');

        const plan = planImport([freshFromFile], [staleLocal, localOnly]);

        const merged = plan.mergedWorkouts.find((workout) => workout.id === staleLocal.id);
        expect(merged).toEqual(freshFromFile);
        expect(plan.mergedWorkouts).toHaveLength(2);
    });

    it('conserva il workout locale quando è più recente di quello nel file', () => {
        const freshLocal: Workout = {
            ...createDraftWorkout('2026-01-01'),
            notes: 'nota locale più recente',
            updatedAt: '2026-01-10T00:00:00.000Z'
        };
        const staleFromFile: Workout = {
            ...freshLocal,
            notes: 'nota superata dal file',
            updatedAt: '2026-01-01T00:00:00.000Z'
        };

        const plan = planImport([staleFromFile], [freshLocal]);

        expect(plan.mergedWorkouts).toEqual([freshLocal]);
    });
});
