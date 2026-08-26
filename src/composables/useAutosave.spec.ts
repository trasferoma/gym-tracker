import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAutosave } from './useAutosave';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('schedule', () => {
    it('salva dopo il debounce, non prima', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const autosave = useAutosave(save, { debounceMs: 500 });

        autosave.schedule('primo valore');
        await vi.advanceTimersByTimeAsync(499);
        expect(save).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(save).toHaveBeenCalledExactlyOnceWith('primo valore');
        expect(autosave.status.value).toBe('saved');
    });

    it('riavvia il debounce a ogni modifica e salva solo l ultimo valore', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const autosave = useAutosave(save, { debounceMs: 500 });

        autosave.schedule('vecchio valore');
        await vi.advanceTimersByTimeAsync(300);
        autosave.schedule('valore aggiornato');
        await vi.advanceTimersByTimeAsync(500);

        expect(save).toHaveBeenCalledExactlyOnceWith('valore aggiornato');
    });
});

describe('flush', () => {
    it('salva subito, senza attendere il debounce: il meccanismo usato da blur, navigazione e visibilitychange', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const autosave = useAutosave(save, { debounceMs: 500 });

        autosave.schedule('valore da salvare subito');
        await autosave.flush();

        expect(save).toHaveBeenCalledExactlyOnceWith('valore da salvare subito');
        expect(autosave.status.value).toBe('saved');
    });

    it('non richiama save quando non ci sono modifiche pendenti', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const autosave = useAutosave(save, { debounceMs: 500 });

        await autosave.flush();

        expect(save).not.toHaveBeenCalled();
    });
});

describe('stato di errore', () => {
    it('espone il motivo quando il salvataggio fallisce', async () => {
        const save = vi.fn().mockRejectedValue(new Error('scrittura non riuscita'));
        const autosave = useAutosave(save, { debounceMs: 500 });

        autosave.schedule('valore');
        await autosave.flush();

        expect(autosave.status.value).toBe('error');
        expect(autosave.errorMessage.value).toBe('scrittura non riuscita');
    });
});

describe('modifica arrivata durante un salvataggio in corso', () => {
    it('non avvia una seconda scrittura concorrente e salva per ultimo il valore più recente', async () => {
        let resolveFirstSave!: () => void;
        const save = vi.fn()
                .mockImplementationOnce(() => new Promise<void>((resolve) => {
                    resolveFirstSave = resolve;
                }))
                .mockResolvedValue(undefined);
        const autosave = useAutosave(save, { debounceMs: 500 });

        autosave.schedule('valore A');
        const flushPromise = autosave.flush();
        expect(autosave.status.value).toBe('saving');

        autosave.schedule('valore B');
        expect(save).toHaveBeenCalledTimes(1);

        resolveFirstSave();
        await flushPromise;

        expect(save).toHaveBeenCalledTimes(2);
        expect(save).toHaveBeenNthCalledWith(1, 'valore A');
        expect(save).toHaveBeenNthCalledWith(2, 'valore B');
        expect(autosave.status.value).toBe('saved');
    });
});
