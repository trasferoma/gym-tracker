import { describe, expect, it } from 'vitest';

import { parseRepetitionsInput, parseWeightInput } from './setInput';

describe('parseRepetitionsInput', () => {
    it('accetta un intero positivo', () => {
        expect(parseRepetitionsInput('12')).toEqual({ valid: true, value: 12 });
    });

    it('rifiuta zero e i valori negativi', () => {
        expect(parseRepetitionsInput('0')).toEqual({ valid: false });
        expect(parseRepetitionsInput('-3')).toEqual({ valid: false });
    });

    it('rifiuta i valori non interi', () => {
        expect(parseRepetitionsInput('8.5')).toEqual({ valid: false });
    });

    it('rifiuta i valori non numerici e la stringa vuota', () => {
        expect(parseRepetitionsInput('abc')).toEqual({ valid: false });
        expect(parseRepetitionsInput('')).toEqual({ valid: false });
        expect(parseRepetitionsInput('   ')).toEqual({ valid: false });
    });
});

describe('parseWeightInput', () => {
    it('accetta un peso con la virgola come separatore decimale', () => {
        expect(parseWeightInput('20,5')).toEqual({ valid: true, value: 20.5 });
    });

    it('accetta un peso con il punto come separatore decimale', () => {
        expect(parseWeightInput('20.5')).toEqual({ valid: true, value: 20.5 });
    });

    it('accetta 0 come peso valido per il corpo libero', () => {
        expect(parseWeightInput('0')).toEqual({ valid: true, value: 0 });
    });

    it('rifiuta i pesi negativi', () => {
        expect(parseWeightInput('-1')).toEqual({ valid: false });
    });

    it('rifiuta i valori non numerici e la stringa vuota', () => {
        expect(parseWeightInput('abc')).toEqual({ valid: false });
        expect(parseWeightInput('')).toEqual({ valid: false });
    });
});
