import { describe, expect, it } from 'vitest';

import { listStatSessions } from './statSessions';
import type { StatEntry } from './statEntries';
import type { StatKey } from './statKey';

const KEY: StatKey = { groupPosition: 1, groupName: 'Petto', exerciseName: 'Panca piana', repetitionScheme: [10, 10] };

function entry(overrides: Partial<StatEntry>): StatEntry {
    return { key: KEY, workoutDate: '2026-01-01', createdAt: '2026-01-01T00:00:00.000Z', weights: [20, 20], ...overrides };
}

describe('listStatSessions', () => {
    it('ordina le sessioni in ordine cronologico crescente', () => {
        const newer = entry({ workoutDate: '2026-02-01', createdAt: '2026-02-01T00:00:00.000Z', weights: [22, 22] });
        const older = entry({ workoutDate: '2026-01-01', createdAt: '2026-01-01T00:00:00.000Z', weights: [20, 20] });

        const sessions = listStatSessions([newer, older], KEY);

        expect(sessions.map((session) => session.workoutDate)).toEqual(['2026-01-01', '2026-02-01']);
    });

    it('a pari workoutDate ordina per createdAt crescente', () => {
        const secondCreated = entry({ createdAt: '2026-01-01T18:00:00.000Z', weights: [25, 25] });
        const firstCreated = entry({ createdAt: '2026-01-01T07:00:00.000Z', weights: [20, 20] });

        const sessions = listStatSessions([secondCreated, firstCreated], KEY);

        expect(sessions.map((session) => session.weights)).toEqual([[20, 20], [25, 25]]);
    });

    it('include solo le voci che corrispondono esattamente alla chiave', () => {
        const matching = entry({});
        const differentScheme = entry({ key: { ...KEY, repetitionScheme: [8, 8] } });
        const differentPosition = entry({ key: { ...KEY, groupPosition: 2 } });

        const sessions = listStatSessions([matching, differentScheme, differentPosition], KEY);

        expect(sessions).toHaveLength(1);
    });
});
