import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAsyncAction } from './useAsyncAction';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('run', () => {
    it('espone pending true durante l azione e false al termine', async () => {
        let resolveAction!: () => void;
        const action = vi.fn(() => new Promise<void>((resolve) => {
            resolveAction = resolve;
        }));
        const asyncAction = useAsyncAction(action);

        const runPromise = asyncAction.run();
        expect(asyncAction.pending.value).toBe(true);

        resolveAction();
        await runPromise;

        expect(asyncAction.pending.value).toBe(false);
    });

    it('riporta pending a false anche quando l azione fallisce, e propaga l errore', async () => {
        const action = vi.fn().mockRejectedValue(new Error('operazione non riuscita'));
        const asyncAction = useAsyncAction(action);

        await expect(asyncAction.run()).rejects.toThrow('operazione non riuscita');

        expect(asyncAction.pending.value).toBe(false);
    });

    it('non richiama l azione finché non viene invocato run', () => {
        const action = vi.fn().mockResolvedValue(undefined);
        useAsyncAction(action);

        expect(action).not.toHaveBeenCalled();
    });
});
