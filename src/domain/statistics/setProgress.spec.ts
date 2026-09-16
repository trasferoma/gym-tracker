import { describe, expect, it } from 'vitest';

import { listSetProgress } from './setProgress';
import type { StatSession } from './statSessions';

function session(workoutDate: string, weights: readonly number[]): StatSession {
    return { workoutDate, weights };
}

describe('listSetProgress', () => {
    it('non produce nulla quando non ci sono sessioni', () => {
        const progressList = listSetProgress([]);

        expect(progressList).toEqual([]);
    });

    it('con una sola sessione mostra il peso e nessun confronto', () => {
        const progressList = listSetProgress([session('2026-01-15', [40, 42])]);

        expect(progressList).toHaveLength(2);
        expect(progressList[0]!.latestWeight).toBe(40);
        expect(progressList[0]!.comparison.kind).toBe('none');
        expect(progressList[1]!.comparison.kind).toBe('none');
    });

    it('segnala un aumento rispetto alla sessione precedente', () => {
        const progressList = listSetProgress([
            session('2026-01-15', [100]),
            session('2026-01-22', [105])
        ]);

        const comparison = progressList[0]!.comparison;
        expect(progressList[0]!.latestWeight).toBe(105);
        expect(comparison).toEqual({
            kind: 'previous',
            previousWeight: 100,
            previousDate: '2026-01-15',
            difference: 5,
            direction: 'up'
        });
    });

    it('segnala un calo rispetto alla sessione precedente', () => {
        const progressList = listSetProgress([
            session('2026-01-15', [105]),
            session('2026-01-22', [100])
        ]);

        const comparison = progressList[0]!.comparison;
        expect(comparison).toMatchObject({ difference: -5, direction: 'down' });
    });

    it('segnala il peso invariato rispetto alla sessione precedente', () => {
        const progressList = listSetProgress([
            session('2026-01-15', [100]),
            session('2026-01-22', [100])
        ]);

        const comparison = progressList[0]!.comparison;
        expect(comparison).toMatchObject({ difference: 0, direction: 'flat' });
    });

    it('confronta ogni serie con l ultima sessione che la contiene, non con l ultima in assoluto', () => {
        const progressList = listSetProgress([
            session('2026-01-15', [100, 80]),
            session('2026-01-22', [102, 82]),
            session('2026-01-29', [104])
        ]);

        expect(progressList).toHaveLength(2);
        expect(progressList[1]!.latestWeight).toBe(82);
        expect(progressList[1]!.comparison).toMatchObject({
            previousWeight: 80,
            previousDate: '2026-01-15',
            difference: 2
        });
    });

    it('non confronta una serie comparsa solo nell ultima sessione', () => {
        const progressList = listSetProgress([
            session('2026-01-15', [100]),
            session('2026-01-22', [102, 60])
        ]);

        expect(progressList).toHaveLength(2);
        expect(progressList[1]!.latestWeight).toBe(60);
        expect(progressList[1]!.comparison.kind).toBe('none');
    });
});
