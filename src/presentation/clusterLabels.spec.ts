import { describe, expect, it } from 'vitest';

import {
    formatClusterKind,
    formatRestAfterRoundLabel,
    formatRestAfterRoundShortLabel,
    formatRestBetweenExercisesLabel,
    formatRestBetweenExercisesShortLabel
} from './clusterLabels';

describe('formatClusterKind', () => {
    it.each([
        ['single', 'Singolo'],
        ['superset', 'Superserie'],
        ['circuit', 'Circuito']
    ] as const)('%s -> %s', (kind, label) => {
        expect(formatClusterKind(kind)).toBe(label);
    });
});

describe('formatRestAfterRoundLabel', () => {
    it('sul singolo parla di recupero fra le serie', () => {
        expect(formatRestAfterRoundLabel('single')).toBe('Recupero fra le serie');
    });

    it.each(['superset', 'circuit'] as const)('sul %s parla di fine giro', (kind) => {
        expect(formatRestAfterRoundLabel(kind)).toBe('Recupero a fine giro');
    });
});

describe('etichette brevi', () => {
    it('fra serie sul singolo, fine giro sui multipli', () => {
        expect(formatRestAfterRoundShortLabel('single')).toBe('fra serie');
        expect(formatRestAfterRoundShortLabel('superset')).toBe('fine giro');
        expect(formatRestAfterRoundShortLabel('circuit')).toBe('fine giro');
    });

    it('il recupero fra esercizi ha etichetta estesa e breve', () => {
        expect(formatRestBetweenExercisesLabel()).toBe('Recupero fra esercizi');
        expect(formatRestBetweenExercisesShortLabel()).toBe('fra esercizi');
    });
});
