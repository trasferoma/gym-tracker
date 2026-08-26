import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    LOADING_APPEARANCE_THRESHOLD_MS,
    LOADING_MINIMUM_VISIBLE_MS,
    LOADING_NAVIGATION_MINIMUM_VISIBLE_MS,
    useLoadingIndicator
} from './useLoadingIndicator';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('soglia di comparsa', () => {
    it('non mostra mai nulla se l operazione finisce prima della soglia', async () => {
        const indicator = useLoadingIndicator();

        const endTracking = indicator.begin();
        await vi.advanceTimersByTimeAsync(LOADING_APPEARANCE_THRESHOLD_MS - 1);
        endTracking();

        expect(indicator.visible.value).toBe(false);
        await vi.advanceTimersByTimeAsync(LOADING_MINIMUM_VISIBLE_MS);
        expect(indicator.visible.value).toBe(false);
    });

    it('mostra l indicatore quando l operazione supera la soglia', async () => {
        const indicator = useLoadingIndicator();

        indicator.begin();
        await vi.advanceTimersByTimeAsync(LOADING_APPEARANCE_THRESHOLD_MS);

        expect(indicator.visible.value).toBe(true);
    });
});

describe('span consecutivi', () => {
    it('somma due span consecutivi sotto soglia e mostra l indicatore quando la somma la supera', async () => {
        const indicator = useLoadingIndicator();

        const endFirst = indicator.begin();
        await vi.advanceTimersByTimeAsync(100);
        endFirst();

        const endSecond = indicator.begin();
        expect(indicator.visible.value).toBe(false);

        await vi.advanceTimersByTimeAsync(90);
        expect(indicator.visible.value).toBe(true);

        endSecond();
    });

    it('non mostra nulla se la somma di due span consecutivi resta sotto soglia', async () => {
        const indicator = useLoadingIndicator();

        const endFirst = indicator.begin();
        await vi.advanceTimersByTimeAsync(50);
        endFirst();

        const endSecond = indicator.begin();
        await vi.advanceTimersByTimeAsync(50);
        endSecond();

        expect(indicator.visible.value).toBe(false);
        await vi.advanceTimersByTimeAsync(LOADING_MINIMUM_VISIBLE_MS);
        expect(indicator.visible.value).toBe(false);
    });

    it('non lascia timer appesi dopo un lungo periodo di inattività, e il prossimo span riparte con la soglia intera', async () => {
        const indicator = useLoadingIndicator();

        const endFirst = indicator.begin();
        await vi.advanceTimersByTimeAsync(50);
        endFirst();

        await vi.advanceTimersByTimeAsync(10_000);
        expect(indicator.visible.value).toBe(false);
        expect(vi.getTimerCount()).toBe(0);

        const endSecond = indicator.begin();
        await vi.advanceTimersByTimeAsync(LOADING_APPEARANCE_THRESHOLD_MS - 1);
        expect(indicator.visible.value).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        expect(indicator.visible.value).toBe(true);

        endSecond();
    });
});

describe('permanenza minima', () => {
    it('resta visibile per la permanenza minima anche se il lavoro finisce subito dopo la soglia', async () => {
        const indicator = useLoadingIndicator();

        const endTracking = indicator.begin();
        await vi.advanceTimersByTimeAsync(LOADING_APPEARANCE_THRESHOLD_MS);
        expect(indicator.visible.value).toBe(true);
        endTracking();

        await vi.advanceTimersByTimeAsync(LOADING_MINIMUM_VISIBLE_MS - 1);
        expect(indicator.visible.value).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(indicator.visible.value).toBe(false);
    });
});

describe('operazioni sovrapposte', () => {
    it('resta acceso finché la seconda operazione non finisce, e non si spegne quando finisce la prima', async () => {
        const indicator = useLoadingIndicator();

        const endFirst = indicator.begin();
        await vi.advanceTimersByTimeAsync(LOADING_APPEARANCE_THRESHOLD_MS);
        expect(indicator.visible.value).toBe(true);

        const endSecond = indicator.begin();
        endFirst();
        expect(indicator.visible.value).toBe(true);

        await vi.advanceTimersByTimeAsync(LOADING_MINIMUM_VISIBLE_MS);
        expect(indicator.visible.value).toBe(true);

        endSecond();
        expect(indicator.visible.value).toBe(false);
    });
});

describe('politica di navigazione', () => {
    it('mostra la barra immediatamente, senza attendere la soglia', () => {
        const indicator = useLoadingIndicator();

        indicator.beginImmediate();

        expect(indicator.visible.value).toBe(true);
    });

    it('resta visibile per la durata minima di navigazione anche se il lavoro finisce in 1 ms', async () => {
        const indicator = useLoadingIndicator();

        const endNavigation = indicator.beginImmediate();
        await vi.advanceTimersByTimeAsync(1);
        endNavigation();

        expect(indicator.visible.value).toBe(true);

        await vi.advanceTimersByTimeAsync(LOADING_NAVIGATION_MINIMUM_VISIBLE_MS - 2);
        expect(indicator.visible.value).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(indicator.visible.value).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('naviga seguita dal caricamento della vista: nessuno spegni/riaccendi, si spegne solo quando entrambi sono finiti e la durata minima è trascorsa', async () => {
        const indicator = useLoadingIndicator();

        const endNavigation = indicator.beginImmediate();
        expect(indicator.visible.value).toBe(true);

        const endViewLoad = indicator.begin();
        await vi.advanceTimersByTimeAsync(50);
        endNavigation();

        expect(indicator.visible.value).toBe(true);

        await vi.advanceTimersByTimeAsync(LOADING_NAVIGATION_MINIMUM_VISIBLE_MS);
        expect(indicator.visible.value).toBe(true);

        endViewLoad();
        expect(indicator.visible.value).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('un\'operazione sotto soglia avviata durante una navigazione non ne altera la fine', async () => {
        const indicator = useLoadingIndicator();

        const endNavigation = indicator.beginImmediate();
        const endOperation = indicator.begin();

        const elapsedBeforeOperationEnds = 50;
        const remainingUntilNavigationMinimum = LOADING_NAVIGATION_MINIMUM_VISIBLE_MS - elapsedBeforeOperationEnds;

        await vi.advanceTimersByTimeAsync(elapsedBeforeOperationEnds);
        endOperation();
        endNavigation();

        expect(indicator.visible.value).toBe(true);

        await vi.advanceTimersByTimeAsync(remainingUntilNavigationMinimum - 1);
        expect(indicator.visible.value).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(indicator.visible.value).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('operazione che fallisce', () => {
    it('spegne l indicatore e propaga l errore quando l operazione fallisce', async () => {
        const indicator = useLoadingIndicator();
        let rejectOperation!: (error: Error) => void;
        const operation = vi.fn(() => new Promise<void>((_resolve, reject) => {
            rejectOperation = reject;
        }));

        const trackingPromise = indicator.track(operation);
        await vi.advanceTimersByTimeAsync(LOADING_APPEARANCE_THRESHOLD_MS);
        expect(indicator.visible.value).toBe(true);

        rejectOperation(new Error('operazione non riuscita'));
        await expect(trackingPromise).rejects.toThrow('operazione non riuscita');

        await vi.advanceTimersByTimeAsync(LOADING_MINIMUM_VISIBLE_MS);
        expect(indicator.visible.value).toBe(false);
    });
});
