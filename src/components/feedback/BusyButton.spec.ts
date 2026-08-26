// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BusyButton from './BusyButton.vue';

describe('BusyButton', () => {
    it('è premibile e non occupato di default', () => {
        const wrapper = mount(BusyButton, { slots: { default: 'Esporta' } });

        expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
        expect(wrapper.find('button').attributes('aria-busy')).toBe('false');
        expect(wrapper.text()).toBe('Esporta');
    });

    it('si disabilita e segnala aria-busy quando è occupato', () => {
        const wrapper = mount(BusyButton, { props: { busy: true }, slots: { default: 'Esporta' } });

        expect(wrapper.find('button').attributes('disabled')).toBeDefined();
        expect(wrapper.find('button').attributes('aria-busy')).toBe('true');
    });

    it('mostra lo spinner al posto dell icona quando è occupato', () => {
        const wrapper = mount(BusyButton, { props: { busy: true, icon: 'trash' } });

        expect(wrapper.find('.busy-spinner').exists()).toBe(true);
        expect(wrapper.find('svg').exists()).toBe(false);
    });

    it('mostra l icona quando non è occupato', () => {
        const wrapper = mount(BusyButton, { props: { busy: false, icon: 'trash' } });

        expect(wrapper.find('.busy-spinner').exists()).toBe(false);
        expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('resta disabilitato quando disabled è true anche senza essere occupato', () => {
        const wrapper = mount(BusyButton, { props: { disabled: true } });

        expect(wrapper.find('button').attributes('disabled')).toBeDefined();
        expect(wrapper.find('button').attributes('aria-busy')).toBe('false');
    });
});
