import { describe, expect, it } from 'vitest';
import { parseRestSecondsInput } from './restInput';

describe('parseRestSecondsInput', () => {
    it('accetta interi maggiori o uguali a zero, anche con spazi intorno', () => {
        expect(parseRestSecondsInput('90')).toEqual({ valid: true, value: 90 });
        expect(parseRestSecondsInput('0')).toEqual({ valid: true, value: 0 });
        expect(parseRestSecondsInput('  45 ')).toEqual({ valid: true, value: 45 });
    });

    it.each(['', '   ', '-5', '1.5', '1,5', 'abc', '12s', '1e2', '0x10', '+3'])('rifiuta "%s"', (rawValue) => {
        expect(parseRestSecondsInput(rawValue)).toEqual({ valid: false });
    });

    it('rifiuta un numero troppo grande per essere un intero esatto', () => {
        expect(parseRestSecondsInput('99999999999999999999')).toEqual({ valid: false });
    });
});
