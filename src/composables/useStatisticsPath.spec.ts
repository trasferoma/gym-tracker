import { afterEach, describe, expect, it } from 'vitest';

import { useStatisticsPath } from './useStatisticsPath';
import { gymTrackerDatabase } from '@/persistence/gymTrackerDatabase';
import { saveWorkout } from '@/persistence/workoutRepository';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from '@/domain/workoutFactory';
import type { Workout } from '@/domain/workout';

afterEach(async () => {
    await gymTrackerDatabase.workouts.clear();
});

async function seedCompletedWorkout(): Promise<void> {
    const exercise = { ...createExercise('Panca piana', 0), sets: [createExerciseSet(0, 10, 20), createExerciseSet(1, 10, 22)] };
    const group = { ...createMuscleGroupWorkout('Petto', 0), exercises: [exercise] };
    const workout: Workout = { ...createDraftWorkout('2026-01-15'), status: 'completed', muscleGroups: [group] };
    await saveWorkout(workout);
}

describe('percorso a quattro passi', () => {
    it('avanza da posizione a giornate selezionando via via posizione, gruppo, esercizio e schema', async () => {
        await seedCompletedWorkout();
        const path = useStatisticsPath();
        await path.reload();

        expect(path.step.value).toBe('position');

        path.selectPosition(1);
        expect(path.step.value).toBe('group');

        path.selectGroup('Petto');
        expect(path.step.value).toBe('exercise');

        path.selectExercise('Panca piana');
        expect(path.step.value).toBe('scheme');

        const [scheme] = path.schemeOptions.value;
        path.selectScheme(scheme!.repetitionScheme);
        expect(path.step.value).toBe('sessions');
        expect(path.sessions.value).toHaveLength(1);
    });
});

describe('risalita dal breadcrumb', () => {
    it('tornando al passo del gruppo azzera esercizio e schema ma non la posizione', async () => {
        await seedCompletedWorkout();
        const path = useStatisticsPath();
        await path.reload();
        path.selectPosition(1);
        path.selectGroup('Petto');
        path.selectExercise('Panca piana');

        path.goToStep('group');

        expect(path.groupPosition.value).toBe(1);
        expect(path.groupName.value).toBeUndefined();
        expect(path.step.value).toBe('group');
    });
});

describe('ingresso dalla scorciatoia', () => {
    it('imposta direttamente una chiave completa e mostra le sessioni', async () => {
        await seedCompletedWorkout();
        const path = useStatisticsPath();
        await path.reload();

        path.enterFromShortcut({ groupPosition: 1, groupName: 'Petto', exerciseName: 'Panca piana', repetitionScheme: [10, 10] });

        expect(path.step.value).toBe('sessions');
        expect(path.sessions.value).toHaveLength(1);
    });

    it('con uno schema privo di storia restituisce sessioni vuote', async () => {
        await seedCompletedWorkout();
        const path = useStatisticsPath();
        await path.reload();

        path.enterFromShortcut({ groupPosition: 1, groupName: 'Petto', exerciseName: 'Panca piana', repetitionScheme: [5, 5, 5] });

        expect(path.step.value).toBe('sessions');
        expect(path.sessions.value).toHaveLength(0);
    });
});
