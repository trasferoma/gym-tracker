import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidLocalDate, parseLocalDate, toLocalDate } from './localDate';

describe('toLocalDate', () => {
    beforeEach(() => {
        vi.stubEnv('TZ', 'Pacific/Honolulu');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('non sposta il giorno a un ora limite in un fuso diverso da UTC', () => {
        const lateEveningLocal = new Date(2026, 0, 15, 23, 30);

        expect(lateEveningLocal.getUTCDate()).not.toBe(lateEveningLocal.getDate());
        expect(toLocalDate(lateEveningLocal)).toBe('2026-01-15');
    });

    it('riempie mese e giorno a due cifre', () => {
        const earlyDate = new Date(2026, 2, 5, 8, 0);

        expect(toLocalDate(earlyDate)).toBe('2026-03-05');
    });
});

describe('parseLocalDate', () => {
    beforeEach(() => {
        vi.stubEnv('TZ', 'Pacific/Honolulu');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('restituisce lo stesso giorno di calendario passato per toLocalDate, in un fuso diverso da UTC', () => {
        expect(toLocalDate(parseLocalDate('2026-01-15'))).toBe('2026-01-15');
    });

    it('non sposta il giorno a fine o inizio mese', () => {
        expect(toLocalDate(parseLocalDate('2026-02-28'))).toBe('2026-02-28');
        expect(toLocalDate(parseLocalDate('2026-03-01'))).toBe('2026-03-01');
    });
});

describe('isValidLocalDate', () => {
    it('accetta una data locale valida', () => {
        expect(isValidLocalDate('2026-02-28')).toBe(true);
    });

    it('rifiuta un formato diverso da YYYY-MM-DD', () => {
        expect(isValidLocalDate('28-02-2026')).toBe(false);
        expect(isValidLocalDate('2026/02/28')).toBe(false);
        expect(isValidLocalDate('2026-02-28T10:00:00Z')).toBe(false);
    });

    it('rifiuta una data di calendario inesistente', () => {
        expect(isValidLocalDate('2026-02-30')).toBe(false);
        expect(isValidLocalDate('2026-13-01')).toBe(false);
    });
});
