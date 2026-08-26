import { ref, type Ref } from 'vue';

export type AutosaveStatus = 'saving' | 'saved' | 'error';

export interface UseAutosaveOptions {
    readonly debounceMs?: number;
}

export interface UseAutosave<T> {
    readonly status: Ref<AutosaveStatus>;
    readonly errorMessage: Ref<string | undefined>;
    schedule(value: T): void;
    flush(): Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 500;

export function useAutosave<T>(save: (value: T) => Promise<void>, options: UseAutosaveOptions = {}): UseAutosave<T> {
    const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    const status = ref<AutosaveStatus>('saved');
    const errorMessage = ref<string>();

    let pendingValue: T | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let activeSave: Promise<void> | undefined;

    function schedule(value: T): void {
        pendingValue = value;
        clearDebounceTimer();
        debounceTimer = setTimeout(() => {
            void runSaveCycle();
        }, debounceMs);
    }

    async function flush(): Promise<void> {
        clearDebounceTimer();
        await runSaveCycle();
    }

    function clearDebounceTimer(): void {
        if (debounceTimer === undefined) {
            return;
        }
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }

    async function runSaveCycle(): Promise<void> {
        if (activeSave) {
            await activeSave;
            return;
        }
        if (pendingValue === undefined) {
            return;
        }
        activeSave = drainPendingValue();
        try {
            await activeSave;
        } finally {
            activeSave = undefined;
        }
    }

    async function drainPendingValue(): Promise<void> {
        while (pendingValue !== undefined) {
            const valueToSave = pendingValue;
            pendingValue = undefined;
            await saveOnce(valueToSave);
        }
    }

    async function saveOnce(value: T): Promise<void> {
        status.value = 'saving';
        try {
            await save(value);
            status.value = 'saved';
            errorMessage.value = undefined;
        } catch (error) {
            status.value = 'error';
            errorMessage.value = describeSaveError(error);
        }
    }

    return { status, errorMessage, schedule, flush };
}

function describeSaveError(error: unknown): string {
    return error instanceof Error ? error.message : 'Salvataggio non riuscito.';
}
