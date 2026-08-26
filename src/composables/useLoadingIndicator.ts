import { ref, type Ref } from 'vue';

export const LOADING_APPEARANCE_THRESHOLD_MS = 180;
export const LOADING_MINIMUM_VISIBLE_MS = 300;
export const LOADING_NAVIGATION_MINIMUM_VISIBLE_MS = 220;

export interface LoadingIndicator {
    readonly visible: Ref<boolean>;
    begin(): () => void;
    beginImmediate(): () => void;
    track<T>(operation: () => Promise<T>): Promise<T>;
}

export function useLoadingIndicator(): LoadingIndicator {
    const visible = ref(false);

    let inFlightCount = 0;
    let appearanceTimer: ReturnType<typeof setTimeout> | undefined;
    let minimumHoldElapsed = true;

    function begin(): () => void {
        inFlightCount += 1;
        if (!visible.value && appearanceTimer === undefined) {
            scheduleAppearance();
        }
        return createEndToken();
    }

    function beginImmediate(): () => void {
        inFlightCount += 1;
        if (!visible.value) {
            cancelAppearanceTimer();
            show(LOADING_NAVIGATION_MINIMUM_VISIBLE_MS);
        }
        return createEndToken();
    }

    function createEndToken(): () => void {
        let ended = false;
        return () => {
            if (ended) {
                return;
            }
            ended = true;
            end();
        };
    }

    function scheduleAppearance(): void {
        appearanceTimer = setTimeout(() => {
            appearanceTimer = undefined;
            if (inFlightCount > 0) {
                show(LOADING_MINIMUM_VISIBLE_MS);
            }
        }, LOADING_APPEARANCE_THRESHOLD_MS);
    }

    function cancelAppearanceTimer(): void {
        if (appearanceTimer === undefined) {
            return;
        }
        clearTimeout(appearanceTimer);
        appearanceTimer = undefined;
    }

    function show(minimumVisibleMs: number): void {
        visible.value = true;
        minimumHoldElapsed = false;
        setTimeout(() => {
            minimumHoldElapsed = true;
            if (inFlightCount === 0) {
                hide();
            }
        }, minimumVisibleMs);
    }

    function hide(): void {
        visible.value = false;
    }

    function end(): void {
        inFlightCount = Math.max(0, inFlightCount - 1);
        if (inFlightCount > 0) {
            return;
        }
        if (visible.value && minimumHoldElapsed) {
            hide();
        }
    }

    async function track<T>(operation: () => Promise<T>): Promise<T> {
        const endTracking = begin();
        try {
            return await operation();
        } finally {
            endTracking();
        }
    }

    return { visible, begin, beginImmediate, track };
}

export const sharedLoadingIndicator = useLoadingIndicator();
