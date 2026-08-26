// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ExercisePicker from './ExercisePicker.vue';

const RECENT_SUGGESTIONS = ['Panca piana con manubri', 'Croci ai cavi', 'Push press più esplosivo'];

function mountPicker(suggestions: readonly string[] = RECENT_SUGGESTIONS) {
    return mount(ExercisePicker, {
        props: { groupName: 'Petto', suggestions }
    });
}

describe('ExercisePicker', () => {
    it('digitando un frammento mostra solo le pastiglie corrispondenti', async () => {
        const wrapper = mountPicker();

        await wrapper.find('input').setValue('manu');

        const labels = wrapper.findAll('.sugg button').map((button) => button.text());
        expect(labels).toEqual(['Panca piana con manubri']);
    });

    it('la corrispondenza funziona anche in mezzo al nome, non solo in testa', async () => {
        const wrapper = mountPicker();

        await wrapper.find('input').setValue('cavi');

        const labels = wrapper.findAll('.sugg button').map((button) => button.text());
        expect(labels).toEqual(['Croci ai cavi']);
    });

    it('maiuscole e accenti non contano nel confronto', async () => {
        const wrapper = mountPicker();

        await wrapper.find('input').setValue('PIU');

        const labels = wrapper.findAll('.sugg button').map((button) => button.text());
        expect(labels).toEqual(['Push press più esplosivo']);
    });

    it('svuotando il campo ricompaiono i più recenti', async () => {
        const wrapper = mountPicker();

        await wrapper.find('input').setValue('manu');
        await wrapper.find('input').setValue('');

        const labels = wrapper.findAll('.sugg button').map((button) => button.text());
        expect(labels).toEqual(RECENT_SUGGESTIONS);
    });

    it('senza corrispondenze non mostra l intestazione sopra una lista vuota', async () => {
        const wrapper = mountPicker();

        await wrapper.find('input').setValue('xyz');

        expect(wrapper.find('h2').exists()).toBe(false);
        expect(wrapper.find('.sugg-empty').text()).toContain('Nessun esercizio simile in archivio');
    });

    it('non mostra alcuna sezione quando lo storico è vuoto', () => {
        const wrapper = mountPicker([]);

        expect(wrapper.find('.sugg-region').exists()).toBe(false);
    });

    it('annuncia il cambio di risultati con una regione live', () => {
        const wrapper = mountPicker();

        expect(wrapper.find('.sugg-region').attributes('aria-live')).toBe('polite');
    });

    it('toccare una pastiglia emette l aggiunta e svuota il campo', async () => {
        const wrapper = mountPicker();

        await wrapper.find('input').setValue('manu');
        const firstSuggestionButton = wrapper.findAll('.sugg button')[0];
        await firstSuggestionButton?.trigger('click');

        expect(wrapper.emitted('confirm')).toEqual([['Panca piana con manubri']]);
        expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
    });

    it('rispetta il tetto delle pastiglie e segnala le altre', () => {
        const manySuggestions = Array.from({ length: 11 }, (_, index) => `Esercizio ${index}`);
        const wrapper = mountPicker(manySuggestions);

        expect(wrapper.findAll('.sugg button')).toHaveLength(8);
        expect(wrapper.find('.sugg-more').text()).toBe('+3 altri');
    });

    describe('modalità rinomina', () => {
        function mountRenamePicker() {
            return mount(ExercisePicker, {
                props: {
                    mode: 'rename',
                    groupName: 'Petto',
                    suggestions: RECENT_SUGGESTIONS,
                    initialName: 'Panca piana'
                }
            });
        }

        it('parte precompilato con il nome attuale e mostra i testi propri della modalità', () => {
            const wrapper = mountRenamePicker();

            expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Panca piana');
            expect(wrapper.find('.field span').text()).toBe('Nuovo nome dell\'esercizio');
            expect(wrapper.find('.btn--primary').text()).toBe('Rinomina');
        });

        it('confermando emette il nuovo nome', async () => {
            const wrapper = mountRenamePicker();

            await wrapper.find('input').setValue('Panca piana con manubri');
            await wrapper.find('.btn--primary').trigger('click');

            expect(wrapper.emitted('confirm')).toEqual([['Panca piana con manubri']]);
        });

        it('l aggiunta continua a usare i testi originali', () => {
            const wrapper = mountPicker();

            expect(wrapper.find('.field span').text()).toBe('Nome del nuovo esercizio');
            expect(wrapper.find('.btn--primary').text()).toBe('Aggiungi');
        });
    });
});
