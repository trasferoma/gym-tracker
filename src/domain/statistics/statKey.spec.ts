import { describe, expect, it } from 'vitest';

import { deriveStatKey, sameRepetitionScheme, schemeLabel } from './statKey';
import { createExercise, createExerciseSet, createMuscleGroupWorkout } from '@/domain/workoutFactory';

function exerciseWithRepetitions(repetitions: readonly number[]) {
    const sets = repetitions.map((value, index) => createExerciseSet(index, value, 20));
    return { ...createExercise('Panca piana', 0), sets };
}

describe('deriveStatKey', () => {
    it('estrae posizione, nome del gruppo, nome dell esercizio e schema delle ripetizioni', () => {
        const petto = createMuscleGroupWorkout('Petto', 0);
        const exercise = exerciseWithRepetitions([12, 10]);

        const key = deriveStatKey(1, petto, exercise);

        expect(key).toEqual({
            groupPosition: 1,
            groupName: 'Petto',
            exerciseName: 'Panca piana',
            repetitionScheme: [12, 10]
        });
    });
});

describe('sameRepetitionScheme', () => {
    it('12-12-10-10 e 10-10-12-12 sono schemi diversi', () => {
        expect(sameRepetitionScheme([12, 12, 10, 10], [10, 10, 12, 12])).toBe(false);
    });

    it('4x6 e 3x8 sono schemi diversi', () => {
        expect(sameRepetitionScheme([6, 6, 6, 6], [8, 8, 8])).toBe(false);
    });

    it('riconosce come uguali due tuple identiche nello stesso ordine', () => {
        expect(sameRepetitionScheme([12, 12, 10, 10], [12, 12, 10, 10])).toBe(true);
    });
});

describe('schemeLabel', () => {
    it('usa la forma NxR quando le ripetizioni sono uniformi', () => {
        expect(schemeLabel([6, 6, 6, 6])).toBe('4x6');
        expect(schemeLabel([8, 8, 8])).toBe('3x8');
    });

    it('usa la tupla con i trattini quando le ripetizioni non sono uniformi', () => {
        expect(schemeLabel([12, 12, 10, 10])).toBe('12-12-10-10');
        expect(schemeLabel([10, 10, 12, 12])).toBe('10-10-12-12');
    });
});
