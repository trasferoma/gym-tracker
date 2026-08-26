// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LoadingBar from './LoadingBar.vue';
import { LOADING_APPEARANCE_THRESHOLD_MS, LOADING_MINIMUM_VISIBLE_MS, sharedLoadingIndicator } from '@/composables/useLoadingIndicator';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('LoadingBar', () => {
    it('non mostra nulla finché l indicatore condiviso non diventa visibile', () => {
        const wrapper = mount(LoadingBar);

        expect(wrapper.find('.loading-bar').exists()).toBe(false);
    });

    it('mostra la barra e annuncia inizio e fine seguendo l indicatore condiviso', async () => {
        const wrapper = mount(LoadingBar);

        const endTracking = sharedLoadingIndicator.begin();
        await vi.advanceTimersByTimeAsync(LOADING_APPEARANCE_THRESHOLD_MS);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.loading-bar').exists()).toBe(true);
        expect(wrapper.find('[aria-live="polite"]').text()).toBe('Caricamento in corso');

        endTracking();
        await vi.advanceTimersByTimeAsync(LOADING_MINIMUM_VISIBLE_MS);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.loading-bar').exists()).toBe(false);
        expect(wrapper.find('[aria-live="polite"]').text()).toBe('Caricamento completato');
    });
});
