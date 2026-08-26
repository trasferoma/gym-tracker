import { describe, expect, it } from 'vitest';

import { listExerciseOptions, listGroupOptions, listPositionOptions, listSchemeOptions } from './statNavigation';
import type { StatEntry } from './statEntries';

function entry(
        groupPosition: number, groupName: string, exerciseName: string, repetitionScheme: readonly number[],
        workoutDate: string
): StatEntry {
    return {
        key: { groupPosition, groupName, exerciseName, repetitionScheme },
        workoutDate,
        createdAt: `${workoutDate}T00:00:00.000Z`,
        weights: repetitionScheme.map(() => 20)
    };
}

describe('listPositionOptions', () => {
    it('elenca solo le posizioni presenti nello storico, con i gruppi visti a ciascuna', () => {
        const entries = [
            entry(1, 'Petto', 'Panca piana', [10, 10], '2026-01-01'),
            entry(2, 'Bicipiti', 'Curl', [10, 10], '2026-01-01')
        ];

        const options = listPositionOptions(entries);

        expect(options).toEqual([
            { groupPosition: 1, groupNames: ['Petto'] },
            { groupPosition: 2, groupNames: ['Bicipiti'] }
        ]);
    });
});

describe('listGroupOptions', () => {
    it('conta le giornate distinte per ciascun gruppo alla posizione scelta', () => {
        const entries = [
            entry(1, 'Petto', 'Panca piana', [10, 10], '2026-01-01'),
            entry(1, 'Petto', 'Croci', [10, 10], '2026-01-01'),
            entry(1, 'Petto', 'Panca piana', [10, 10], '2026-01-08')
        ];

        const options = listGroupOptions(entries, 1);

        expect(options).toEqual([{ groupName: 'Petto', sessionCount: 2 }]);
    });
});

describe('listExerciseOptions', () => {
    it('filtra gli esercizi per nome, senza distinzione fra maiuscole e minuscole', () => {
        const entries = [
            entry(1, 'Petto', 'Panca piana', [10, 10], '2026-01-01'),
            entry(1, 'Petto', 'Croci ai cavi', [10, 10], '2026-01-01')
        ];

        const options = listExerciseOptions(entries, 1, 'Petto', 'panca');

        expect(options.map((option) => option.exerciseName)).toEqual(['Panca piana']);
    });
});

describe('listSchemeOptions', () => {
    it('non nasconde gli schemi con una sola sessione', () => {
        const entries = [entry(1, 'Petto', 'Panca piana', [10, 10], '2026-01-01')];

        const options = listSchemeOptions(entries, 1, 'Petto', 'Panca piana');

        expect(options).toHaveLength(1);
        expect(options[0]!.sessionCount).toBe(1);
    });

    it('distingue schemi con la stessa etichetta ma tuple diverse', () => {
        const entries = [
            entry(1, 'Petto', 'Panca piana', [12, 12, 10, 10], '2026-01-01'),
            entry(1, 'Petto', 'Panca piana', [10, 10, 12, 12], '2026-01-08')
        ];

        const options = listSchemeOptions(entries, 1, 'Petto', 'Panca piana');

        expect(options).toHaveLength(2);
    });
});
