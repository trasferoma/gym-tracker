import { afterEach, describe, expect, it, vi } from 'vitest';

import { type UseWorkoutDraft, useWorkoutDraft } from './useWorkoutDraft';
import { gymTrackerDatabase } from '@/persistence/gymTrackerDatabase';
import * as workoutRepository from '@/persistence/workoutRepository';
import { findWorkoutById, saveWorkout } from '@/persistence/workoutRepository';
import { wrapExercisesInSingleClusters } from '@/domain/exerciseClusters';
import { createDraftWorkout, createExercise, createExerciseCluster } from '@/domain/workoutFactory';
import type { Workout } from '@/domain/workout';

afterEach(async () => {
    vi.restoreAllMocks();
    await gymTrackerDatabase.workouts.clear();
});

async function seedWorkout(overrides: Partial<Workout> = {}): Promise<Workout> {
    const workout: Workout = { ...createDraftWorkout('2026-02-10'), ...overrides };
    await saveWorkout(workout);
    return workout;
}

describe('load', () => {
    it('carica il workout dal repository', async () => {
        const seeded = await seedWorkout();
        const draft = useWorkoutDraft();

        await draft.load(seeded.id);

        expect(draft.workout.value?.id).toBe(seeded.id);
    });
});

describe('mutazioni strutturali', () => {
    it('delega al dominio, aggiorna updatedAt e salva tramite autosave', async () => {
        const seeded = await seedWorkout({ updatedAt: '2026-01-01T00:00:00.000Z' });
        const draft = useWorkoutDraft();
        await draft.load(seeded.id);

        draft.addMuscleGroup('Petto');
        await draft.flushPendingSave();

        expect(draft.workout.value?.muscleGroups.map((group) => group.name)).toEqual(['Petto']);
        expect(draft.workout.value?.updatedAt).not.toBe('2026-01-01T00:00:00.000Z');

        const persisted = await findWorkoutById(seeded.id);
        expect(persisted?.muscleGroups.map((group) => group.name)).toEqual(['Petto']);
    });
});

describe('createDraft', () => {
    it('crea e salva subito una bozza vuota quando non riceve una giornata da copiare', async () => {
        const draft = useWorkoutDraft();

        const created = await draft.createDraft('2026-02-10');

        expect(created.status).toBe('draft');
        expect(created.muscleGroups).toEqual([]);
        expect(draft.workout.value?.id).toBe(created.id);
        const persisted = await findWorkoutById(created.id);
        expect(persisted).toEqual(created);
    });

    it('copia la struttura della giornata sorgente con nuovi UUID', async () => {
        const source = await seedWorkout({
            muscleGroups: [{ id: 'group-petto', name: 'Petto', position: 0, clusters: [] }]
        });
        const draft = useWorkoutDraft();

        const created = await draft.createDraft('2026-02-11', source);

        expect(created.id).not.toBe(source.id);
        expect(created.muscleGroups[0]?.id).not.toBe('group-petto');
        expect(created.muscleGroups[0]?.name).toBe('Petto');
        expect(created.workoutDate).toBe('2026-02-11');
    });
});

describe('note, ripetizioni, peso e spunta di una serie', () => {
    it('aggiorna le note della giornata', async () => {
        const seeded = await seedWorkout();
        const draft = useWorkoutDraft();
        await draft.load(seeded.id);

        draft.updateNotes('Poco tempo, riscaldamento ridotto.');
        await draft.flushPendingSave();

        expect(draft.workout.value?.notes).toBe('Poco tempo, riscaldamento ridotto.');
    });

    it('aggiorna ripetizioni, peso e spunta di una singola serie', async () => {
        const seeded = await seedWorkout({
            muscleGroups: [{
                id: 'group-petto',
                name: 'Petto',
                position: 0,
                clusters: wrapExercisesInSingleClusters([{
                    id: 'exercise-panca',
                    name: 'Panca piana',
                    position: 0,
                    notes: '',
                    sets: [{ id: 'set-1', position: 0, repetitions: 10, weight: 20, completed: false, notes: '' }]
                }])
            }]
        });
        const draft = useWorkoutDraft();
        await draft.load(seeded.id);

        draft.updateSetRepetitions('group-petto', 'exercise-panca', 'set-1', 8);
        draft.updateSetWeight('group-petto', 'exercise-panca', 'set-1', 22.5);
        draft.toggleSetCompleted('group-petto', 'exercise-panca', 'set-1');
        await draft.flushPendingSave();

        const set = draft.workout.value?.muscleGroups[0]?.clusters[0]?.exercises[0]?.sets[0];
        expect(set).toMatchObject({ repetitions: 8, weight: 22.5, completed: true });
    });

    it('cicla il marcatore di problema di una serie fra assente, warning e critical', async () => {
        const seeded = await seedWorkout({
            muscleGroups: [{
                id: 'group-petto',
                name: 'Petto',
                position: 0,
                clusters: wrapExercisesInSingleClusters([{
                    id: 'exercise-panca',
                    name: 'Panca piana',
                    position: 0,
                    notes: '',
                    sets: [{ id: 'set-1', position: 0, repetitions: 10, weight: 20, completed: false, notes: '' }]
                }])
            }]
        });
        const draft = useWorkoutDraft();
        await draft.load(seeded.id);

        draft.cycleSetIssue('group-petto', 'exercise-panca', 'set-1');
        expect(draft.workout.value?.muscleGroups[0]?.clusters[0]?.exercises[0]?.sets[0]?.issue).toBe('warning');

        draft.cycleSetIssue('group-petto', 'exercise-panca', 'set-1');
        expect(draft.workout.value?.muscleGroups[0]?.clusters[0]?.exercises[0]?.sets[0]?.issue).toBe('critical');

        draft.cycleSetIssue('group-petto', 'exercise-panca', 'set-1');
        await draft.flushPendingSave();

        expect(draft.workout.value?.muscleGroups[0]?.clusters[0]?.exercises[0]?.sets[0]?.issue).toBe(undefined);
    });
});

describe('operazioni sui raggruppamenti', () => {
    const operations: readonly (readonly [string, (draft: UseWorkoutDraft) => void])[] = [
        ['linkClusterToNext', (draft) => draft.linkClusterToNext('group-petto', 'cluster-a')],
        ['detachExercise', (draft) => draft.detachExercise('group-petto', 'exercise-c')],
        ['changeClusterKind', (draft) => draft.changeClusterKind('group-petto', 'cluster-b', 'circuit')],
        ['updateClusterRestAfterRound', (draft) => draft.updateClusterRestAfterRound('group-petto', 'cluster-b', 90)],
        ['updateClusterRestBetweenExercises',
            (draft) => draft.updateClusterRestBetweenExercises('group-petto', 'cluster-b', 15)],
        ['reorderCluster', (draft) => draft.reorderCluster('group-petto', 'cluster-b', 'up')],
        ['addExerciseToCluster', (draft) => draft.addExerciseToCluster('group-petto', 'cluster-b', 'Esercizio nuovo')]
    ];

    async function seedWorkoutWithClusters(): Promise<Workout> {
        const single = { ...createExerciseCluster(createExercise('Panca', 0), 0), id: 'cluster-a' };
        const exerciseB = { ...createExercise('Croci', 0), id: 'exercise-b' };
        const exerciseC = { ...createExercise('Dip', 1), id: 'exercise-c' };
        const superset = {
            ...createExerciseCluster(exerciseB, 1),
            id: 'cluster-b',
            kind: 'superset' as const,
            exercises: [exerciseB, exerciseC]
        };
        return seedWorkout({
            updatedAt: '2026-01-01T00:00:00.000Z',
            muscleGroups: [{ id: 'group-petto', name: 'Petto', position: 0, clusters: [single, superset] }]
        });
    }

    it.each(operations)('%s aggiorna updatedAt e salva tramite autosave', async (_name, operate) => {
        const seeded = await seedWorkoutWithClusters();
        const draft = useWorkoutDraft();
        await draft.load(seeded.id);

        operate(draft);
        await draft.flushPendingSave();

        expect(draft.workout.value?.updatedAt).not.toBe('2026-01-01T00:00:00.000Z');
        const persisted = await findWorkoutById(seeded.id);
        expect(persisted).toEqual(draft.workout.value);
        expect(persisted).not.toEqual(seeded);
    });
});

async function seedWorkoutWithExistingExerciseAndSet(): Promise<Workout> {
    return seedWorkout({
        muscleGroups: [{
            id: 'group-petto',
            name: 'Petto',
            position: 0,
            clusters: wrapExercisesInSingleClusters([{
                id: 'exercise-panca',
                name: 'Panca piana',
                position: 0,
                notes: '',
                sets: [{ id: 'set-1', position: 0, repetitions: 10, weight: 20, completed: false, notes: '' }]
            }])
        }]
    });
}

describe('clonabilità strutturale', () => {
    it('produce payload clonabili quando le mutazioni trascinano un esercizio e una serie già esistenti', async () => {
        const seeded = await seedWorkoutWithExistingExerciseAndSet();
        const saveWorkoutSpy = vi.spyOn(workoutRepository, 'saveWorkout');
        const draft = useWorkoutDraft();
        await draft.load(seeded.id);

        draft.addExercise('group-petto', 'Croci ai cavi');
        await draft.flushPendingSave();
        draft.addExerciseSet('group-petto', 'exercise-panca');
        await draft.flushPendingSave();
        draft.updateSetRepetitions('group-petto', 'exercise-panca', 'set-1', 12);
        await draft.flushPendingSave();

        expect(saveWorkoutSpy).toHaveBeenCalledTimes(3);
        for (const [savedPayload] of saveWorkoutSpy.mock.calls) {
            expect(() => structuredClone(savedPayload)).not.toThrow();
        }
    });

    it('produce un payload clonabile quando si aggiunge un esercizio a un gruppo copiato da una giornata precedente', async () => {
        const source = await seedWorkoutWithExistingExerciseAndSet();
        const saveWorkoutSpy = vi.spyOn(workoutRepository, 'saveWorkout');
        const draft = useWorkoutDraft();
        const created = await draft.createDraft('2026-02-11', source);
        const copiedGroupId = created.muscleGroups[0]!.id;

        draft.addExercise(copiedGroupId, 'Croci ai cavi');
        await draft.flushPendingSave();

        expect(saveWorkoutSpy).toHaveBeenCalledTimes(2);
        for (const [savedPayload] of saveWorkoutSpy.mock.calls) {
            expect(() => structuredClone(savedPayload)).not.toThrow();
        }
    });
});

describe('operazioni rifiutate', () => {
    it('espone il motivo del rifiuto e lascia il database intatto', async () => {
        const seeded = await seedWorkout({
            status: 'completed',
            muscleGroups: [
                { id: 'group-petto', name: 'Petto', position: 0, clusters: [] }
            ]
        });
        const draft = useWorkoutDraft();
        await draft.load(seeded.id);

        draft.removeMuscleGroup('group-petto');
        await draft.flushPendingSave();

        expect(draft.rejectionReason.value).toContain('senza gruppi muscolari');
        expect(draft.workout.value?.muscleGroups).toHaveLength(1);

        const persisted = await findWorkoutById(seeded.id);
        expect(persisted).toEqual(seeded);
    });
});
