import { ref, type Ref } from 'vue';

import { sharedLoadingIndicator } from './useLoadingIndicator';

export interface UseAsyncAction {
    readonly pending: Ref<boolean>;
    run(): Promise<void>;
}

export function useAsyncAction(action: () => Promise<void> | void): UseAsyncAction {
    const pending = ref(false);

    async function run(): Promise<void> {
        pending.value = true;
        try {
            await sharedLoadingIndicator.track(async () => {
                await action();
            });
        } finally {
            pending.value = false;
        }
    }

    return { pending, run };
}
