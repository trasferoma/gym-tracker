import { describe, expect, it } from 'vitest';

import {
    describeAllDataLoss,
    describeWorkoutDeletion,
    formatWorkoutDayCompact,
    formatWorkoutDayLong,
    formatWorkoutDayShort
} from './italianFormat';
import { addExercise, addExerciseSet, addMuscleGroup } from '@/domain/workoutStructure';
import { createDraftWorkout } from '@/domain/workoutFactory';
import type { Workout } from '@/domain/workout';

function unwrap(outcome: ReturnType<typeof addMuscleGroup>): Workout {
    if (outcome.outcome === 'rejected') {
        throw new Error(`Operazione rifiutata inaspettatamente: ${outcome.reason}`);
    }
    return outcome.workout;
}

describe('formatWorkoutDayShort e formatWorkoutDayLong', () => {
    it('interpretano la data locale senza slittamenti di giorno', () => {
        expect(formatWorkoutDayShort('2026-01-15')).toContain('15');
        expect(formatWorkoutDayLong('2026-01-15')).toContain('15');
    });
});

describe('formatWorkoutDayCompact', () => {
    it('interpreta la data locale senza slittamenti di giorno', () => {
        expect(formatWorkoutDayCompact('2026-01-15')).toContain('15');
    });
});

describe('describeWorkoutDeletion', () => {
    it('quantifica esercizi e serie perse e segnala l\'irreversibilità', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const group = workout.muscleGroups[0]!;
        workout = addExercise(workout, group.id, 'Panca piana');
        const exercise = workout.muscleGroups[0]!.exercises[0]!;
        workout = addExerciseSet(workout, group.id, exercise.id);

        const description = describeWorkoutDeletion(workout);

        expect(description).toContain('1 esercizio');
        expect(description).toContain('2 serie');
        expect(description).toContain('Operazione non reversibile.');
    });
});

describe('describeAllDataLoss', () => {
    it('quantifica allenamenti, esercizi e serie e suggerisce l\'esportazione', () => {
        const description = describeAllDataLoss(3, 5, 12);

        expect(description).toContain('3 allenamenti');
        expect(description).toContain('5 esercizi');
        expect(description).toContain('12 serie');
        expect(description).toContain('Esporta un backup prima di continuare');
    });

    it('usa il singolare quando i conteggi sono uno', () => {
        const description = describeAllDataLoss(1, 1, 1);

        expect(description).toContain('1 allenamento');
        expect(description).toContain('1 esercizio');
        expect(description).toContain('1 serie');
    });
});
