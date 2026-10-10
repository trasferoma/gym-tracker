// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ImportSummaryCard from './ImportSummaryCard.vue';

describe('ImportSummaryCard', () => {
    it('mostra la versione del formato del file validato', () => {
        const summary = { totalInFile: 3, newCount: 1, alreadyPresentCount: 2, newerThanLocalCount: 0 };

        const wrapper = mount(ImportSummaryCard, { props: { summary, formatVersion: 7 } });

        expect(wrapper.find('.chip').text()).toBe('versione 7');
    });
});
