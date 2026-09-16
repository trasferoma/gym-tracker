// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import StatSetProgressList from './StatSetProgressList.vue';
import type { StatSession } from '@/domain/statistics/statSessions';

function session(workoutDate: string, weights: readonly number[]): StatSession {
    return { workoutDate, weights };
}

function mountList(sessions: readonly StatSession[]): ReturnType<typeof mount> {
    return mount(StatSetProgressList, { props: { sessions } });
}

describe('StatSetProgressList', () => {
    it('mostra una card per ogni serie, con etichetta e peso più recente', () => {
        const wrapper = mountList([
            session('2026-01-15', [100, 80]),
            session('2026-01-22', [105, 80])
        ]);

        const cards = wrapper.findAll('.set-card');
        expect(cards).toHaveLength(2);
        expect(cards[0]!.find('.set-tag').text()).toBe('S1');
        expect(cards[0]!.find('.set-weight').text()).toBe('105 kg');
        expect(cards[1]!.find('.set-tag').text()).toBe('S2');
    });

    it('mostra la variazione con segno e la data del confronto', () => {
        const wrapper = mountList([
            session('2026-01-15', [100]),
            session('2026-01-22', [105])
        ]);

        const delta = wrapper.find('.set-delta');
        expect(delta.classes()).toContain('up');
        expect(delta.text()).toContain('+5 kg');
        expect(wrapper.find('.set-versus').text()).toContain('vs');
    });

    it('dichiara la variazione nulla come invariata', () => {
        const wrapper = mountList([
            session('2026-01-15', [100]),
            session('2026-01-22', [100])
        ]);

        const delta = wrapper.find('.set-delta');
        expect(delta.classes()).toContain('flat');
        expect(delta.text()).toContain('0 kg');
    });

    it('con una sola sessione disegna il punto e non mostra variazioni', () => {
        const wrapper = mountList([session('2026-01-15', [100])]);

        expect(wrapper.findAll('circle')).toHaveLength(1);
        expect(wrapper.find('.set-delta').exists()).toBe(false);
        expect(wrapper.find('.set-versus').text()).toBe('prima volta');
    });

    it('etichetta ogni grafico con la serie a cui appartiene', () => {
        const wrapper = mountList([session('2026-01-15', [100, 80])]);

        const charts = wrapper.findAll('svg');
        expect(charts[0]!.attributes('aria-label')).toBe('Progressione del peso della serie 1');
        expect(charts[1]!.attributes('aria-label')).toBe('Progressione del peso della serie 2');
    });
});
