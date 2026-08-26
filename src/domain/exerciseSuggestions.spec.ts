import { describe, expect, it } from 'vitest';

import { filterSuggestionsByQuery, MAX_VISIBLE_SUGGESTIONS, suggestExerciseNames } from './exerciseSuggestions';
import { createDraftWorkout, createExercise, createMuscleGroupWorkout } from './workoutFactory';
import type { Workout } from './workout';

function buildWorkout(workoutDate: string, createdAt: string, entries: readonly [string, readonly string[]][]): Workout {
    const draft = createDraftWorkout(workoutDate);
    const muscleGroups = entries.map(([groupName, exerciseNames], position) => {
        const group = createMuscleGroupWorkout(groupName, position);
        const exercises = exerciseNames.map((name, exercisePosition) => createExercise(name, exercisePosition));
        return { ...group, exercises };
    });
    return { ...draft, createdAt, updatedAt: createdAt, muscleGroups };
}

describe('suggestExerciseNames', () => {
    it('filtra i suggerimenti sul gruppo corrente e li ordina per uso più recente', () => {
        const older = buildWorkout('2026-01-10', '2026-01-10T08:00:00.000Z', [
            ['Petto', ['Panca piana con manubri']]
        ]);
        const newer = buildWorkout('2026-01-15', '2026-01-15T08:00:00.000Z', [
            ['Petto', ['Croci con manubri']]
        ]);

        const suggestions = suggestExerciseNames([older, newer], 'Petto');

        expect(suggestions).toEqual(['Croci con manubri', 'Panca piana con manubri']);
    });

    it('deduplica per nome normalizzato dentro lo stesso gruppo', () => {
        const first = buildWorkout('2026-01-10', '2026-01-10T08:00:00.000Z', [
            ['Petto', ['Panca piana']]
        ]);
        const second = buildWorkout('2026-01-15', '2026-01-15T08:00:00.000Z', [
            ['Petto', ['  panca piana  ']]
        ]);

        const suggestions = suggestExerciseNames([first, second], 'Petto');

        expect(suggestions).toEqual(['  panca piana  ']);
    });

    it('non mescola i nomi fra gruppi diversi', () => {
        const workout = buildWorkout('2026-01-10', '2026-01-10T08:00:00.000Z', [
            ['Petto', ['Panca piana']],
            ['Schiena', ['Lat machine']]
        ]);

        const suggestions = suggestExerciseNames([workout], 'Petto');

        expect(suggestions).toEqual(['Panca piana']);
    });

    it('non propone nulla quando il gruppo corrente non ha storia, anche se altri gruppi ne hanno', () => {
        const workout = buildWorkout('2026-01-10', '2026-01-10T08:00:00.000Z', [
            ['Schiena', ['Lat machine']]
        ]);

        const suggestions = suggestExerciseNames([workout], 'Petto');

        expect(suggestions).toEqual([]);
    });

    it('restituisce un elenco vuoto senza storico', () => {
        expect(suggestExerciseNames([], 'Petto')).toEqual([]);
    });

    it('lo stesso nome in un gruppo diverso non conta come già visto per il gruppo corrente', () => {
        const workout = buildWorkout('2026-01-10', '2026-01-10T08:00:00.000Z', [
            ['Spalle', ['Alzate laterali']],
            ['Petto', ['Alzate laterali']]
        ]);

        const suggestions = suggestExerciseNames([workout], 'Petto');

        expect(suggestions).toEqual(['Alzate laterali']);
    });
});

describe('filterSuggestionsByQuery', () => {
    const suggestions = ['Panca piana con manubri', 'Croci ai cavi', 'Push press più esplosivo'];

    it('con query vuota restituisce tutti i suggerimenti, più recenti in testa', () => {
        const result = filterSuggestionsByQuery(suggestions, '');

        expect(result).toEqual({ names: suggestions, hiddenCount: 0 });
    });

    it('trova la corrispondenza in qualunque punto del nome, non solo in testa', () => {
        const result = filterSuggestionsByQuery(suggestions, 'manu');

        expect(result.names).toEqual(['Panca piana con manubri']);
    });

    it('ignora maiuscole e minuscole', () => {
        const result = filterSuggestionsByQuery(suggestions, 'MANU');

        expect(result.names).toEqual(['Panca piana con manubri']);
    });

    it('ignora gli accenti sia nel nome sia nella query', () => {
        const result = filterSuggestionsByQuery(suggestions, 'piu');

        expect(result.names).toEqual(['Push press più esplosivo']);
    });

    it('restituisce un elenco vuoto senza corrispondenze', () => {
        const result = filterSuggestionsByQuery(suggestions, 'xyz');

        expect(result).toEqual({ names: [], hiddenCount: 0 });
    });

    it('applica il tetto e conta le corrispondenze nascoste', () => {
        const manySuggestions = Array.from(
                { length: MAX_VISIBLE_SUGGESTIONS + 3 },
                (_, index) => `Esercizio ${index}`);

        const result = filterSuggestionsByQuery(manySuggestions, '');

        expect(result.names).toHaveLength(MAX_VISIBLE_SUGGESTIONS);
        expect(result.hiddenCount).toBe(3);
    });
});
