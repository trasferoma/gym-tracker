import { describe, expect, it } from 'vitest';
import {
    addExerciseToCluster,
    changeClusterKind,
    checkClusterInvariants,
    detachExercise,
    findClusterColorSlot,
    isMultipleCluster,
    linkClusterToNext,
    listGroupExercises,
    reorderCluster,
    updateClusterRestAfterRound,
    updateClusterRestBetweenExercises,
    wrapExercisesInSingleClusters
} from './exerciseClusters';
import type { ExerciseCluster, ExerciseClusterKind } from './workout';
import { createExercise, createExerciseCluster, createMuscleGroupWorkout } from './workoutFactory';

function clusterOf(kind: ExerciseClusterKind, exerciseCount: number): ExerciseCluster {
    const exercises = Array.from({ length: exerciseCount }, (_, index) => createExercise(`Esercizio ${index}`, index));
    return { ...createExerciseCluster(createExercise('Base', 0), 0), kind, exercises };
}

describe('createExerciseCluster', () => {
    it('crea un singolo con un esercizio e tempi a zero', () => {
        const exercise = createExercise('Panca', 0);
        const cluster = createExerciseCluster(exercise, 2);
        expect(cluster.kind).toBe('single');
        expect(cluster.position).toBe(2);
        expect(cluster.restAfterRoundSeconds).toBe(0);
        expect(cluster.restBetweenExercisesSeconds).toBe(0);
        expect(cluster.exercises).toEqual([{ ...exercise, position: 0 }]);
        expect(cluster.id).not.toBe('');
    });

    it('ripartisce da 0 la posizione dell\'esercizio dentro il raggruppamento', () => {
        const exercise = createExercise('Panca', 3);
        const cluster = createExerciseCluster(exercise, 2);
        expect(cluster.exercises[0]?.position).toBe(0);
        expect(cluster.exercises[0]?.id).toBe(exercise.id);
    });

    it('crea un gruppo muscolare senza raggruppamenti', () => {
        expect(createMuscleGroupWorkout('Petto', 0).clusters).toEqual([]);
    });
});

describe('isMultipleCluster', () => {
    it('distingue il singolo dai multipli', () => {
        expect(isMultipleCluster(clusterOf('single', 1))).toBe(false);
        expect(isMultipleCluster(clusterOf('superset', 2))).toBe(true);
        expect(isMultipleCluster(clusterOf('circuit', 3))).toBe(true);
    });
});

describe('listGroupExercises', () => {
    it('appiattisce gli esercizi in ordine di raggruppamento', () => {
        const first = clusterOf('superset', 2);
        const second = clusterOf('single', 1);
        const group = { ...createMuscleGroupWorkout('Petto', 0), clusters: [first, second] };
        expect(listGroupExercises(group)).toEqual([...first.exercises, ...second.exercises]);
    });

    it('restituisce una lista vuota per un gruppo senza raggruppamenti', () => {
        expect(listGroupExercises(createMuscleGroupWorkout('Petto', 0))).toEqual([]);
    });
});

describe('wrapExercisesInSingleClusters', () => {
    it('crea un singolo per esercizio con posizioni contigue e posizione 0 dentro ogni singolo', () => {
        const exercises = [createExercise('A', 0), createExercise('B', 1)];
        const clusters = wrapExercisesInSingleClusters(exercises);
        expect(clusters.map(cluster => cluster.kind)).toEqual(['single', 'single']);
        expect(clusters.map(cluster => cluster.position)).toEqual([0, 1]);
        expect(clusters.map(cluster => cluster.exercises.map(exercise => exercise.id)))
            .toEqual([[exercises[0]?.id], [exercises[1]?.id]]);
        expect(clusters.map(cluster => cluster.exercises[0]?.position)).toEqual([0, 0]);
    });
});

describe('checkClusterInvariants', () => {
    it('accetta singoli di 1 e multipli di almeno 2 esercizi', () => {
        const clusters = [clusterOf('single', 1), clusterOf('superset', 2), clusterOf('circuit', 3)];
        expect(checkClusterInvariants(clusters)).toBeUndefined();
    });

    it('accetta nessun raggruppamento', () => {
        expect(checkClusterInvariants([])).toBeUndefined();
    });

    it('segnala un singolo con due esercizi', () => {
        expect(checkClusterInvariants([clusterOf('single', 2)])).toMatch(/singolo/);
    });

    it('segnala un multiplo con un solo esercizio', () => {
        expect(checkClusterInvariants([clusterOf('superset', 1)])).toMatch(/almeno due/);
        expect(checkClusterInvariants([clusterOf('circuit', 1)])).toMatch(/almeno due/);
    });

    it('segnala un raggruppamento vuoto di ogni tipo', () => {
        expect(checkClusterInvariants([clusterOf('single', 0)])).toMatch(/non contiene esercizi/);
        expect(checkClusterInvariants([clusterOf('circuit', 0)])).toMatch(/non contiene esercizi/);
    });
});

function namedCluster(
        kind: ExerciseClusterKind, names: readonly string[], restAfterRoundSeconds = 0,
        restBetweenExercisesSeconds = 0): ExerciseCluster {
    const exercises = names.map((name, index) => createExercise(name, index));
    const base = createExerciseCluster(createExercise('Base', 0), 0);
    return { ...base, kind, restAfterRoundSeconds, restBetweenExercisesSeconds, exercises };
}

function positioned(clusters: readonly ExerciseCluster[]): readonly ExerciseCluster[] {
    return clusters.map((cluster, index) => ({ ...cluster, position: index }));
}

function describeClusters(clusters: readonly ExerciseCluster[]): unknown {
    return clusters.map(cluster => [cluster.kind, cluster.exercises.map(exercise => exercise.name)]);
}

function exercisePositions(clusters: readonly ExerciseCluster[]): readonly (readonly number[])[] {
    return clusters.map(cluster => cluster.exercises.map(exercise => exercise.position));
}

describe('linkClusterToNext', () => {
    it('unisce due singoli in una superserie con i tempi del superiore', () => {
        const upper = namedCluster('single', ['Panca'], 90, 20);
        const lower = namedCluster('single', ['Croci'], 60, 10);
        const result = linkClusterToNext(positioned([upper, lower]), upper.id);

        expect(describeClusters(result)).toEqual([['superset', ['Panca', 'Croci']]]);
        expect(result[0]?.id).toBe(upper.id);
        expect(result[0]?.restAfterRoundSeconds).toBe(90);
        expect(result[0]?.restBetweenExercisesSeconds).toBe(20);
        expect(exercisePositions(result)).toEqual([[0, 1]]);
    });

    it('fa assorbire il singolo sottostante al multiplo sopra, conservando tipo e tempi', () => {
        const upper = namedCluster('circuit', ['A', 'B'], 120, 30);
        const lower = namedCluster('single', ['C'], 45);
        const result = linkClusterToNext(positioned([upper, lower]), upper.id);

        expect(describeClusters(result)).toEqual([['circuit', ['A', 'B', 'C']]]);
        expect(result[0]?.restAfterRoundSeconds).toBe(120);
        expect(result[0]?.restBetweenExercisesSeconds).toBe(30);
        expect(exercisePositions(result)).toEqual([[0, 1, 2]]);
    });

    it('fa assorbire il singolo sopra al multiplo sottostante, con tipo e tempi del multiplo', () => {
        const upper = namedCluster('single', ['A'], 45);
        const lower = namedCluster('circuit', ['B', 'C'], 120, 30);
        const result = linkClusterToNext(positioned([upper, lower]), upper.id);

        expect(describeClusters(result)).toEqual([['circuit', ['A', 'B', 'C']]]);
        expect(result[0]?.restAfterRoundSeconds).toBe(120);
        expect(result[0]?.restBetweenExercisesSeconds).toBe(30);
        expect(exercisePositions(result)).toEqual([[0, 1, 2]]);
    });

    it('unisce due multipli di tipo diverso con tipo e tempi del superiore', () => {
        const upper = namedCluster('superset', ['A', 'B'], 90, 5);
        const lower = namedCluster('circuit', ['C', 'D'], 120, 30);
        const result = linkClusterToNext(positioned([upper, lower]), upper.id);

        expect(describeClusters(result)).toEqual([['superset', ['A', 'B', 'C', 'D']]]);
        expect(result[0]?.restAfterRoundSeconds).toBe(90);
        expect(result[0]?.restBetweenExercisesSeconds).toBe(5);
        expect(exercisePositions(result)).toEqual([[0, 1, 2, 3]]);
    });

    it('lascia intatti gli altri raggruppamenti e ricompatta le posizioni', () => {
        const before = namedCluster('single', ['Prima']);
        const upper = namedCluster('single', ['A']);
        const lower = namedCluster('single', ['B']);
        const after = namedCluster('circuit', ['X', 'Y']);
        const result = linkClusterToNext(positioned([before, upper, lower, after]), upper.id);

        expect(describeClusters(result)).toEqual([
            ['single', ['Prima']], ['superset', ['A', 'B']], ['circuit', ['X', 'Y']]
        ]);
        expect(result.map(cluster => cluster.position)).toEqual([0, 1, 2]);
        expect(result[2]).toEqual({ ...after, position: 2 });
    });

    it('rifiuta con errore l\'ultimo raggruppamento e un id inesistente', () => {
        const clusters = positioned([namedCluster('single', ['A']), namedCluster('single', ['B'])]);

        expect(() => linkClusterToNext(clusters, clusters[1]!.id)).toThrow('Nessun raggruppamento successivo');
        expect(() => linkClusterToNext(clusters, 'inesistente')).toThrow('Raggruppamento non trovato');
    });

    it('non modifica la lista di partenza', () => {
        const upper = namedCluster('single', ['A']);
        const clusters = positioned([upper, namedCluster('single', ['B'])]);
        const snapshot = structuredClone(clusters);

        linkClusterToNext(clusters, upper.id);

        expect(clusters).toEqual(snapshot);
    });
});

describe('detachExercise', () => {
    it('fa uscire l\'ultimo esercizio come singolo subito dopo il blocco, ereditando il recupero a fine giro', () => {
        const block = namedCluster('circuit', ['A', 'B', 'C'], 120, 30);
        const next = namedCluster('single', ['Z']);
        const result = detachExercise(positioned([block, next]), block.exercises[2]!.id);

        expect(describeClusters(result)).toEqual([
            ['circuit', ['A', 'B']], ['single', ['C']], ['single', ['Z']]
        ]);
        expect(result[1]?.restAfterRoundSeconds).toBe(120);
        expect(result[1]?.restBetweenExercisesSeconds).toBe(0);
        expect(result[1]?.id).not.toBe(block.id);
        expect(result.map(cluster => cluster.position)).toEqual([0, 1, 2]);
        expect(exercisePositions(result)).toEqual([[0, 1], [0], [0]]);
    });

    it('fa uscire il primo esercizio dopo il blocco, non prima', () => {
        const block = namedCluster('superset', ['A', 'B', 'C']);
        const result = detachExercise(positioned([block]), block.exercises[0]!.id);

        expect(describeClusters(result)).toEqual([['superset', ['B', 'C']], ['single', ['A']]]);
        expect(exercisePositions(result)).toEqual([[0, 1], [0]]);
    });

    it('conserva l\'id dell\'esercizio staccato e le sue serie', () => {
        const block = namedCluster('superset', ['A', 'B']);
        const detachedOriginal = block.exercises[1]!;
        const result = detachExercise(positioned([block]), detachedOriginal.id);

        expect(result[1]?.exercises[0]).toEqual({ ...detachedOriginal, position: 0 });
    });

    it('riporta a singolo il blocco di due che perde un esercizio, conservando i suoi tempi', () => {
        const block = namedCluster('circuit', ['A', 'B'], 120, 30);
        const result = detachExercise(positioned([block]), block.exercises[1]!.id);

        expect(describeClusters(result)).toEqual([['single', ['A']], ['single', ['B']]]);
        expect(result[0]?.id).toBe(block.id);
        expect(result[0]?.restAfterRoundSeconds).toBe(120);
        expect(result[0]?.restBetweenExercisesSeconds).toBe(30);
    });

    it('rifiuta con errore un esercizio di un singolo e un esercizio inesistente', () => {
        const single = namedCluster('single', ['A']);

        expect(() => detachExercise(positioned([single]), single.exercises[0]!.id)).toThrow('si può staccare');
        expect(() => detachExercise(positioned([single]), 'inesistente')).toThrow('Esercizio non trovato');
    });
});

describe('changeClusterKind', () => {
    it('passa fra superserie e circuito conservando i tempi, anche quello fra esercizi nascosto', () => {
        const circuit = namedCluster('circuit', ['A', 'B'], 120, 30);

        const toSuperset = changeClusterKind([circuit], circuit.id, 'superset');
        const backToCircuit = changeClusterKind(toSuperset, circuit.id, 'circuit');

        expect(toSuperset[0]?.kind).toBe('superset');
        expect(toSuperset[0]?.restBetweenExercisesSeconds).toBe(30);
        expect(backToCircuit[0]).toEqual(circuit);
    });

    it('rifiuta con errore il cambio di tipo di un singolo, il tipo singolo su un multiplo e un id inesistente', () => {
        const single = namedCluster('single', ['A']);
        const superset = namedCluster('superset', ['A', 'B']);

        expect(() => changeClusterKind([single], single.id, 'circuit')).toThrow('non si cambia');
        expect(() => changeClusterKind([superset], superset.id, 'single')).toThrow('non può diventare singolo');
        expect(() => changeClusterKind([superset], 'inesistente', 'circuit')).toThrow('Raggruppamento non trovato');
    });
});

describe('tempi di recupero del raggruppamento', () => {
    it('aggiorna il recupero a fine giro di un raggruppamento senza toccare gli altri', () => {
        const first = namedCluster('single', ['A'], 60);
        const second = namedCluster('single', ['B'], 70);

        const result = updateClusterRestAfterRound([first, second], second.id, 150);

        expect(result[0]).toEqual(first);
        expect(result[1]?.restAfterRoundSeconds).toBe(150);
    });

    it('aggiorna il recupero fra esercizi e accetta zero', () => {
        const circuit = namedCluster('circuit', ['A', 'B'], 120, 30);

        const result = updateClusterRestBetweenExercises([circuit], circuit.id, 0);

        expect(result[0]?.restBetweenExercisesSeconds).toBe(0);
        expect(result[0]?.restAfterRoundSeconds).toBe(120);
    });

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rifiuta con errore %s secondi', (seconds) => {
        const circuit = namedCluster('circuit', ['A', 'B']);

        expect(() => updateClusterRestAfterRound([circuit], circuit.id, seconds)).toThrow('intero');
        expect(() => updateClusterRestBetweenExercises([circuit], circuit.id, seconds)).toThrow('intero');
    });

    it('rifiuta con errore un raggruppamento inesistente', () => {
        expect(() => updateClusterRestAfterRound([], 'inesistente', 30)).toThrow('Raggruppamento non trovato');
    });
});

describe('reorderCluster', () => {
    it('sposta il raggruppamento intero su e giù ricompattando le posizioni, senza toccare i suoi esercizi', () => {
        const first = namedCluster('single', ['A']);
        const second = namedCluster('superset', ['B', 'C']);
        const third = namedCluster('single', ['D']);

        const movedUp = reorderCluster(positioned([first, second, third]), second.id, 'up');
        const movedDown = reorderCluster(positioned([first, second, third]), second.id, 'down');

        expect(describeClusters(movedUp)).toEqual([['superset', ['B', 'C']], ['single', ['A']], ['single', ['D']]]);
        expect(describeClusters(movedDown)).toEqual([['single', ['A']], ['single', ['D']], ['superset', ['B', 'C']]]);
        expect(movedUp.map(cluster => cluster.position)).toEqual([0, 1, 2]);
        expect(movedUp[0]?.exercises).toEqual(second.exercises);
    });

    it('lascia la lista invariata ai bordi e rifiuta con errore un id inesistente', () => {
        const clusters = positioned([namedCluster('single', ['A']), namedCluster('single', ['B'])]);

        expect(reorderCluster(clusters, clusters[0]!.id, 'up')).toEqual(clusters);
        expect(reorderCluster(clusters, clusters[1]!.id, 'down')).toEqual(clusters);
        expect(() => reorderCluster(clusters, 'inesistente', 'up')).toThrow();
    });
});

describe('addExerciseToCluster', () => {
    it('aggiunge in coda un esercizio con una serie senza cambiare tipo e tempi', () => {
        const circuit = namedCluster('circuit', ['A', 'B'], 120, 30);

        const result = addExerciseToCluster([circuit], circuit.id, 'C');

        expect(describeClusters(result)).toEqual([['circuit', ['A', 'B', 'C']]]);
        expect(exercisePositions(result)).toEqual([[0, 1, 2]]);
        expect(result[0]?.exercises[2]?.sets).toHaveLength(1);
        expect(result[0]?.restAfterRoundSeconds).toBe(120);
        expect(result[0]?.restBetweenExercisesSeconds).toBe(30);
    });

    it('rifiuta con errore un singolo e un id inesistente', () => {
        const single = namedCluster('single', ['A']);

        expect(() => addExerciseToCluster([single], single.id, 'B')).toThrow('solo a una superserie');
        expect(() => addExerciseToCluster([single], 'inesistente', 'B')).toThrow('Raggruppamento non trovato');
    });
});

describe('esito ben formato delle operazioni strutturali', () => {
    function expectWellFormed(clusters: readonly ExerciseCluster[]): void {
        expect(checkClusterInvariants(clusters)).toBeUndefined();
        expect(clusters.map(cluster => cluster.position)).toEqual(clusters.map((_, index) => index));
        expect(exercisePositions(clusters)).toEqual(
            clusters.map(cluster => cluster.exercises.map((_, index) => index)));
    }

    function linked(upper: ExerciseCluster, lower: ExerciseCluster): readonly ExerciseCluster[] {
        return linkClusterToNext(positioned([upper, lower]), upper.id);
    }

    function detached(block: ExerciseCluster, index: number): readonly ExerciseCluster[] {
        return detachExercise(positioned([block]), block.exercises[index]!.id);
    }

    it.each([
        ['singolo + singolo', () => linked(namedCluster('single', ['A']), namedCluster('single', ['B']))],
        ['multiplo + singolo', () => linked(namedCluster('circuit', ['A', 'B']), namedCluster('single', ['C']))],
        ['singolo + multiplo', () => linked(namedCluster('single', ['A']), namedCluster('superset', ['B', 'C']))],
        ['multiplo + multiplo', () => linked(namedCluster('superset', ['A', 'B']), namedCluster('circuit', ['C', 'D']))]
    ])('collega %s', (_label, run) => {
        expectWellFormed(run());
    });

    it.each([
        ['primo di tre', namedCluster('circuit', ['A', 'B', 'C']), 0],
        ['di mezzo di tre', namedCluster('circuit', ['A', 'B', 'C']), 1],
        ['ultimo di tre', namedCluster('superset', ['A', 'B', 'C']), 2],
        ['primo di due', namedCluster('superset', ['A', 'B']), 0],
        ['ultimo di due', namedCluster('circuit', ['A', 'B']), 1]
    ])('stacca il %s', (_label, block, index) => {
        expectWellFormed(detached(block, index));
    });

    it.each(['superset', 'circuit'] as const)('aggiunge un esercizio a un %s', (kind) => {
        const block = namedCluster(kind, ['A', 'B']);
        expectWellFormed(addExerciseToCluster(positioned([block]), block.id, 'C'));
    });
});

describe('findClusterColorSlot', () => {
    const clusters = [
        clusterOf('superset', 2),
        clusterOf('single', 1),
        clusterOf('circuit', 3),
        clusterOf('superset', 2),
        clusterOf('circuit', 2),
        clusterOf('superset', 2)
    ].map((cluster, index) => ({ ...cluster, id: `c${index}`, position: index }));

    it('non assegna nessun colore ai singoli', () => {
        expect(findClusterColorSlot(clusters, 'c1')).toBeUndefined();
    });

    it('numera i soli multipli, ignorando i singoli intermedi', () => {
        const slots = ['c0', 'c2', 'c3', 'c4'].map((id) => findClusterColorSlot(clusters, id));
        expect(slots).toEqual([0, 1, 2, 3]);
    });

    it('ricomincia dal primo colore dopo il quarto multiplo', () => {
        expect(findClusterColorSlot(clusters, 'c5')).toBe(0);
    });

    it('un id sconosciuto non ha colore', () => {
        expect(findClusterColorSlot(clusters, 'x')).toBeUndefined();
    });
});
