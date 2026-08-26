import { describe, expect, it } from 'vitest';

import { checkCompletionEligibility, completeWorkout, reopenWorkout } from './workoutCompletion';
import { createDraftWorkout, createExercise, createExerciseSet, createMuscleGroupWorkout } from './workoutFactory';
import type { MuscleGroupWorkout, Workout } from './workout';

function withOneValidExercise(name: string, position: number): MuscleGroupWorkout {
    const group = createMuscleGroupWorkout(name, position);
    const exercise = createExercise('Panca piana', 0);
    return { ...group, exercises: [{ ...exercise, sets: [createExerciseSet(0, 10, 20)] }] };
}

function withGroups(count: number): Workout {
    const draft = createDraftWorkout('2026-01-15');
    const groupNames = ['Petto', 'Schiena', 'Gambe', 'Spalle'];
    const muscleGroups = groupNames.slice(0, count).map((name, position) => withOneValidExercise(name, position));
    return { ...draft, muscleGroups };
}

describe('checkCompletionEligibility', () => {
    it('accetta un allenamento con gruppi, esercizi e serie validi', () => {
        const workout = withGroups(2);

        expect(checkCompletionEligibility(workout)).toEqual({ eligible: true });
    });

    it('accetta un allenamento con un solo gruppo, un esercizio e una serie valida', () => {
        const workout = withGroups(1);

        expect(checkCompletionEligibility(workout)).toEqual({ eligible: true });
    });

    it('rifiuta un allenamento senza gruppi, indicando il motivo', () => {
        const workout = withGroups(0);

        const eligibility = checkCompletionEligibility(workout);

        expect(eligibility.eligible).toBe(false);
        expect(eligibility).toHaveProperty('reason');
    });

    it('accetta 1, 2 e 3 gruppi e rifiuta 0 e 4', () => {
        expect(checkCompletionEligibility(withGroups(0)).eligible).toBe(false);
        expect(checkCompletionEligibility(withGroups(1)).eligible).toBe(true);
        expect(checkCompletionEligibility(withGroups(2)).eligible).toBe(true);
        expect(checkCompletionEligibility(withGroups(3)).eligible).toBe(true);
        expect(checkCompletionEligibility(withGroups(4)).eligible).toBe(false);
    });

    it('non vincola il numero di gruppi in una bozza salvabile', () => {
        const draft = withGroups(4);

        expect(draft.status).toBe('draft');
        expect(draft.muscleGroups).toHaveLength(4);
    });

    it('rifiuta un gruppo senza esercizi', () => {
        const draft = createDraftWorkout('2026-01-15');
        const emptyGroup = createMuscleGroupWorkout('Petto', 0);
        const validGroup = withOneValidExercise('Schiena', 1);
        const workout = { ...draft, muscleGroups: [emptyGroup, validGroup] };

        const eligibility = checkCompletionEligibility(workout);

        expect(eligibility.eligible).toBe(false);
    });

    it('rifiuta un esercizio senza serie valide', () => {
        const draft = createDraftWorkout('2026-01-15');
        const group = createMuscleGroupWorkout('Petto', 0);
        const exerciseWithoutSets = { ...createExercise('Panca piana', 0), sets: [] };
        const workout = {
            ...draft,
            muscleGroups: [
                { ...group, exercises: [exerciseWithoutSets] },
                withOneValidExercise('Schiena', 1)
            ]
        };

        const eligibility = checkCompletionEligibility(workout);

        expect(eligibility.eligible).toBe(false);
    });
});

describe('completeWorkout / reopenWorkout', () => {
    it('completa un allenamento eleggibile', () => {
        const workout = withGroups(2);

        const outcome = completeWorkout(workout);

        expect(outcome.outcome).toBe('applied');
        expect(outcome.outcome === 'applied' && outcome.workout.status).toBe('completed');
    });

    it('rifiuta il completamento con il motivo quando non eleggibile', () => {
        const workout = withGroups(0);

        const outcome = completeWorkout(workout);

        expect(outcome.outcome).toBe('rejected');
        expect(outcome.outcome === 'rejected' && outcome.reason.length > 0).toBe(true);
    });

    it('il completamento non richiede che le serie siano spuntate', () => {
        const workout = withGroups(2);

        const outcome = completeWorkout(workout);

        expect(outcome.outcome).toBe('applied');
    });

    it('riporta a bozza un allenamento completato', () => {
        const completed = { ...withGroups(2), status: 'completed' as const };

        const reopened = reopenWorkout(completed);

        expect(reopened.status).toBe('draft');
    });
});
