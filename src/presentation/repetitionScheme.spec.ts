import { describe, expect, it } from 'vitest';

import { formatRepetitionScheme } from './repetitionScheme';
import { createExerciseSet } from '@/domain/workoutFactory';

function setsWithRepetitions(repetitions: readonly number[]) {
    return repetitions.map((value, index) => createExerciseSet(index, value, 20));
}

describe('formatRepetitionScheme', () => {
    it('usa la forma NxR quando le ripetizioni sono uniformi', () => {
        expect(formatRepetitionScheme(setsWithRepetitions([6, 6, 6, 6]))).toBe('4x6');
        expect(formatRepetitionScheme(setsWithRepetitions([8, 8, 8]))).toBe('3x8');
    });

    it('usa la tupla con i trattini quando le ripetizioni non sono uniformi', () => {
        expect(formatRepetitionScheme(setsWithRepetitions([12, 12, 10, 10]))).toBe('12-12-10-10');
        expect(formatRepetitionScheme(setsWithRepetitions([10, 10, 12, 12]))).toBe('10-10-12-12');
    });

    it('restituisce un trattino quando non ci sono serie', () => {
        expect(formatRepetitionScheme([])).toBe('-');
    });
});
