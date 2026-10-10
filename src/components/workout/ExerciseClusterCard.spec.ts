// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ExerciseClusterCard from './ExerciseClusterCard.vue';
import type { UseWorkoutDraft } from '@/composables/useWorkoutDraft';
import type { ExerciseCluster, ExerciseClusterKind, MuscleGroupWorkout } from '@/domain/workout';
import { createExercise, createExerciseCluster, createMuscleGroupWorkout } from '@/domain/workoutFactory';

function clusterOf(kind: ExerciseClusterKind, names: readonly string[]): ExerciseCluster {
    const exercises = names.map((name, index) => createExercise(name, index));
    const base = createExerciseCluster(exercises[0]!, 0);
    return { ...base, kind, exercises, restAfterRoundSeconds: 90, restBetweenExercisesSeconds: 20 };
}

function createDraftMock() {
    return {
        updateClusterRestAfterRound: vi.fn(),
        updateClusterRestBetweenExercises: vi.fn(),
        changeClusterKind: vi.fn(),
        reorderCluster: vi.fn(),
        detachExercise: vi.fn(),
        addExerciseToCluster: vi.fn(),
        flushPendingSave: vi.fn().mockResolvedValue(undefined)
    };
}

type DraftMock = ReturnType<typeof createDraftMock>;

interface MountOptions {
    readonly index?: number;
    readonly total?: number;
    readonly colorSlot?: number | undefined;
}

function mountCard(cluster: ExerciseCluster, draft: DraftMock, options: MountOptions = {}) {
    const group: MuscleGroupWorkout = { ...createMuscleGroupWorkout('Petto', 0), clusters: [cluster] };
    return mount(ExerciseClusterCard, {
        props: {
            cluster,
            group,
            index: options.index ?? 0,
            total: options.total ?? 1,
            colorSlot: options.colorSlot,
            suggestions: [],
            draft: draft as unknown as UseWorkoutDraft
        }
    });
}

function findButton(wrapper: ReturnType<typeof mountCard>, label: string) {
    return wrapper.find(`button[aria-label="${label}"]`);
}

function findRestInput(wrapper: ReturnType<typeof mountCard>, label: string) {
    const input = wrapper.find(`input[aria-label="${label}"]`);
    return input.exists() ? input : undefined;
}

describe('ExerciseClusterCard, testata', () => {
    it.each([
        ['single', 'Singolo'],
        ['superset', 'Superserie'],
        ['circuit', 'Circuito']
    ] as const)('mostra il tipo %s come «%s»', (kind, label) => {
        const names = kind === 'single' ? ['Panca'] : ['Panca', 'Croci'];
        const wrapper = mountCard(clusterOf(kind, names), createDraftMock());

        expect(wrapper.find('.cl-kind').text()).toBe(label);
    });

    it('mostra l icona solo per superserie e circuito', () => {
        const single = mountCard(clusterOf('single', ['Panca']), createDraftMock());
        const superset = mountCard(clusterOf('superset', ['Panca', 'Croci']), createDraftMock());

        expect(single.find('.cl-kind svg').exists()).toBe(false);
        expect(superset.find('.cl-kind svg').exists()).toBe(true);
    });

    it('sul singolo il recupero a fine giro si chiama «Recupero fra le serie» e non c è quello fra esercizi', () => {
        const wrapper = mountCard(clusterOf('single', ['Panca']), createDraftMock());

        expect(findRestInput(wrapper, 'Recupero fra le serie')).toBeDefined();
        expect(findRestInput(wrapper, 'Recupero fra esercizi')).toBeUndefined();
    });

    it('sulla superserie il campo si chiama «Recupero a fine giro» e non c è quello fra esercizi', () => {
        const wrapper = mountCard(clusterOf('superset', ['Panca', 'Croci']), createDraftMock());

        expect(findRestInput(wrapper, 'Recupero a fine giro')).toBeDefined();
        expect(findRestInput(wrapper, 'Recupero fra le serie')).toBeUndefined();
        expect(findRestInput(wrapper, 'Recupero fra esercizi')).toBeUndefined();
    });

    it('sul circuito mostra entrambi i campi con i secondi correnti', () => {
        const wrapper = mountCard(clusterOf('circuit', ['Panca', 'Croci']), createDraftMock());

        expect(findRestInput(wrapper, 'Recupero a fine giro')?.element).toHaveProperty('value', '90');
        expect(findRestInput(wrapper, 'Recupero fra esercizi')?.element).toHaveProperty('value', '20');
    });

    it('la testata del singolo e della superserie ha il campo dei secondi nella riga del tipo, quella del circuito in una riga a parte', () => {
        const single = mountCard(clusterOf('single', ['Panca']), createDraftMock());
        const superset = mountCard(clusterOf('superset', ['Panca', 'Croci']), createDraftMock());
        const circuit = mountCard(clusterOf('circuit', ['Panca', 'Croci']), createDraftMock());

        expect(single.find('.cl-top input').exists()).toBe(true);
        expect(single.find('.cl-rests').exists()).toBe(false);
        expect(superset.find('.cl-top input').exists()).toBe(true);
        expect(superset.find('.cl-rests').exists()).toBe(false);
        expect(circuit.find('.cl-top input').exists()).toBe(false);
        expect(circuit.findAll('.cl-rests input')).toHaveLength(2);
    });

    it('le etichette brevi visibili sono fra serie sul singolo, fine giro e fra esercizi sul circuito', () => {
        const single = mountCard(clusterOf('single', ['Panca']), createDraftMock());
        const circuit = mountCard(clusterOf('circuit', ['Panca', 'Croci']), createDraftMock());

        expect(single.find('.cl-top .rest-label').text()).toBe('fra serie');
        expect(circuit.findAll('.cl-rests .rest-label').map((label) => label.text())).toEqual(['fine giro', 'fra esercizi']);
    });

    it('i pulsanti di tipo compaiono solo sui multipli', () => {
        const single = mountCard(clusterOf('single', ['Panca']), createDraftMock());
        const circuit = mountCard(clusterOf('circuit', ['Panca', 'Croci']), createDraftMock());

        expect(findButton(single, 'Imposta superserie').exists()).toBe(false);
        expect(findButton(single, 'Imposta circuito').exists()).toBe(false);
        expect(findButton(circuit, 'Imposta superserie').exists()).toBe(true);
        expect(findButton(circuit, 'Imposta circuito').attributes('aria-pressed')).toBe('true');
    });

    it('i pulsanti di tipo chiamano changeClusterKind', async () => {
        const cluster = clusterOf('circuit', ['Panca', 'Croci']);
        const draft = createDraftMock();
        const wrapper = mountCard(cluster, draft);

        await findButton(wrapper, 'Imposta superserie').trigger('click');

        expect(draft.changeClusterKind).toHaveBeenCalledWith(expect.any(String), cluster.id, 'superset');
    });

    it('le frecce del raggruppamento sono nella testata anche sul singolo e rispettano i bordi', async () => {
        const cluster = clusterOf('single', ['Panca']);
        const draft = createDraftMock();
        const wrapper = mountCard(cluster, draft, { index: 1, total: 3 });

        await findButton(wrapper, 'Sposta raggruppamento su').trigger('click');
        await findButton(wrapper, 'Sposta raggruppamento giù').trigger('click');

        expect(draft.reorderCluster).toHaveBeenNthCalledWith(1, expect.any(String), cluster.id, 'up');
        expect(draft.reorderCluster).toHaveBeenNthCalledWith(2, expect.any(String), cluster.id, 'down');
        expect(wrapper.findAll('button[aria-label="Sposta su"]')).toHaveLength(0);
    });

    it('al primo e all ultimo raggruppamento la freccia verso il bordo è disabilitata', () => {
        const wrapper = mountCard(clusterOf('single', ['Panca']), createDraftMock(), { index: 0, total: 1 });

        expect(findButton(wrapper, 'Sposta raggruppamento su').attributes('disabled')).toBeDefined();
        expect(findButton(wrapper, 'Sposta raggruppamento giù').attributes('disabled')).toBeDefined();
    });
});

describe('ExerciseClusterCard, tempi', () => {
    it('un valore valido aggiorna il recupero a fine giro', async () => {
        const cluster = clusterOf('superset', ['Panca', 'Croci']);
        const draft = createDraftMock();
        const wrapper = mountCard(cluster, draft);

        await findRestInput(wrapper, 'Recupero a fine giro')!.setValue('120');

        expect(draft.updateClusterRestAfterRound).toHaveBeenCalledWith(expect.any(String), cluster.id, 120);
    });

    it('un valore valido aggiorna il recupero fra esercizi del circuito', async () => {
        const cluster = clusterOf('circuit', ['Panca', 'Croci']);
        const draft = createDraftMock();
        const wrapper = mountCard(cluster, draft);

        await findRestInput(wrapper, 'Recupero fra esercizi')!.setValue('45');

        expect(draft.updateClusterRestBetweenExercises).toHaveBeenCalledWith(expect.any(String), cluster.id, 45);
    });

    it.each(['', '-5', '1.5', 'abc'])('il testo «%s» non aggiorna e al blur torna il valore precedente', async (text) => {
        const draft = createDraftMock();
        const wrapper = mountCard(clusterOf('superset', ['Panca', 'Croci']), draft);
        const input = findRestInput(wrapper, 'Recupero a fine giro')!;

        await input.setValue(text);
        await input.trigger('blur');

        expect(draft.updateClusterRestAfterRound).not.toHaveBeenCalled();
        expect(input.element).toHaveProperty('value', '90');
    });

    it('il campo segue il valore del modello quando cambia dall esterno', async () => {
        const cluster = clusterOf('superset', ['Panca', 'Croci']);
        const wrapper = mountCard(cluster, createDraftMock());

        await wrapper.setProps({ cluster: { ...cluster, restAfterRoundSeconds: 150 } });

        expect(findRestInput(wrapper, 'Recupero a fine giro')!.element).toHaveProperty('value', '150');
    });

    it('al blur chiede il salvataggio immediato', async () => {
        const draft = createDraftMock();
        const wrapper = mountCard(clusterOf('superset', ['Panca', 'Croci']), draft);

        await findRestInput(wrapper, 'Recupero a fine giro')!.trigger('blur');

        expect(draft.flushPendingSave).toHaveBeenCalledTimes(1);
    });
});

describe('ExerciseClusterCard, esercizi', () => {
    it('«+ Esercizio» interno compare solo sui multipli', () => {
        const single = mountCard(clusterOf('single', ['Panca']), createDraftMock());
        const superset = mountCard(clusterOf('superset', ['Panca', 'Croci']), createDraftMock());

        expect(single.find('.cluster-add').exists()).toBe(false);
        expect(superset.find('.cluster-add').exists()).toBe(true);
    });

    it('«+ Esercizio» interno aggiunge al raggruppamento col nome scelto', async () => {
        const cluster = clusterOf('circuit', ['Panca', 'Croci']);
        const draft = createDraftMock();
        const wrapper = mountCard(cluster, draft);

        await wrapper.find('.cluster-add').trigger('click');
        const nameInput = wrapper.find('.add-panel input');
        await nameInput.setValue('Push-up');
        await nameInput.trigger('keydown.enter');

        expect(draft.addExerciseToCluster).toHaveBeenCalledWith(expect.any(String), cluster.id, 'Push-up');
    });

    it('«Stacca» e le frecce dell esercizio compaiono solo sui multipli', () => {
        const single = mountCard(clusterOf('single', ['Panca']), createDraftMock());
        const superset = mountCard(clusterOf('superset', ['Panca', 'Croci']), createDraftMock());

        expect(findButton(single, 'Stacca dal raggruppamento').exists()).toBe(false);
        expect(single.findAll('button[aria-label="Sposta su"]')).toHaveLength(0);
        expect(findButton(superset, 'Stacca dal raggruppamento').exists()).toBe(true);
    });

    it('«Stacca» chiama detachExercise con l esercizio scelto', async () => {
        const cluster = clusterOf('superset', ['Panca', 'Croci']);
        const draft = createDraftMock();
        const wrapper = mountCard(cluster, draft);

        const detachButtons = wrapper.findAll('button[aria-label="Stacca dal raggruppamento"]');
        await detachButtons[1]!.trigger('click');

        expect(draft.detachExercise).toHaveBeenCalledWith(expect.any(String), cluster.exercises[1]!.id);
    });

    it('le frecce dell esercizio sono disabilitate ai bordi del blocco', () => {
        const wrapper = mountCard(clusterOf('superset', ['Panca', 'Croci']), createDraftMock());

        const up = wrapper.findAll('button[aria-label="Sposta su"]');
        const down = wrapper.findAll('button[aria-label="Sposta giù"]');

        expect(up[0]!.attributes('disabled')).toBeDefined();
        expect(up[1]!.attributes('disabled')).toBeUndefined();
        expect(down[0]!.attributes('disabled')).toBeUndefined();
        expect(down[1]!.attributes('disabled')).toBeDefined();
    });
});

describe('ExerciseClusterCard, sfondo', () => {
    it('applica la classe del colore scelto, numerata da 1', () => {
        const wrapper = mountCard(clusterOf('superset', ['Panca', 'Croci']), createDraftMock(), { colorSlot: 2 });

        expect(wrapper.find('.cluster').classes()).toContain('cluster--3');
    });

    it('senza colore (singolo) non applica nessuna classe di sfondo', () => {
        const wrapper = mountCard(clusterOf('single', ['Panca']), createDraftMock());

        expect(wrapper.find('.cluster').classes().some((name) => name.startsWith('cluster--'))).toBe(false);
    });
});
