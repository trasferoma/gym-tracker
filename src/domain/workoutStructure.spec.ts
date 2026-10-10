import { describe, expect, it } from 'vitest';

import { listGroupExercises } from './exerciseClusters';
import { createDraftWorkout, createExercise, createExerciseCluster, createExerciseSet } from './workoutFactory';
import {
    addExercise,
    addExerciseSet,
    addExerciseToCluster,
    addMuscleGroup,
    changeClusterKind,
    detachExercise,
    duplicateLastExerciseSet,
    linkClusterToNext,
    reorderCluster,
    updateClusterRestAfterRound,
    updateClusterRestBetweenExercises,
    reorderExercise,
    reorderMuscleGroup,
    removeExercise,
    removeExerciseSet,
    removeMuscleGroup,
    renameExercise,
    updateExerciseSet,
    updateWorkoutDate,
    updateWorkoutNotes
} from './workoutStructure';
import type { ExerciseCluster, ExerciseClusterKind, Workout } from './workout';

function unwrap(outcome: ReturnType<typeof addMuscleGroup>): Workout {
    if (outcome.outcome === 'rejected') {
        throw new Error(`Operazione rifiutata inaspettatamente: ${outcome.reason}`);
    }
    return outcome.workout;
}

describe('addMuscleGroup / removeMuscleGroup', () => {
    it('rifiuta un gruppo già presente nella giornata', () => {
        const withPetto = unwrap(addMuscleGroup(createDraftWorkout('2026-01-15'), 'Petto'));

        const outcome = addMuscleGroup(withPetto, 'Petto');

        expect(outcome.outcome).toBe('rejected');
    });

    it('mantiene le position contigue dopo aggiunta ed eliminazione', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        workout = unwrap(addMuscleGroup(workout, 'Schiena'));
        workout = unwrap(addMuscleGroup(workout, 'Gambe'));

        const afterRemoval = unwrap(removeMuscleGroup(workout, workout.muscleGroups[0]!.id));

        expect(afterRemoval.muscleGroups.map((group) => group.position)).toEqual([0, 1]);
        expect(afterRemoval.muscleGroups.map((group) => group.name)).toEqual(['Schiena', 'Gambe']);
    });

    it('blocca la rimozione dell\'ultimo gruppo da una giornata completata', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const completed: Workout = { ...workout, status: 'completed' };

        const outcome = removeMuscleGroup(completed, completed.muscleGroups[0]!.id);

        expect(outcome.outcome).toBe('rejected');
        expect(outcome.outcome === 'rejected' && outcome.reason.length > 0).toBe(true);
    });

    it('ammette la rimozione che lascia una giornata completata con un solo gruppo', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        workout = unwrap(addMuscleGroup(workout, 'Schiena'));
        const completed: Workout = { ...workout, status: 'completed' };

        const outcome = removeMuscleGroup(completed, completed.muscleGroups[0]!.id);

        expect(outcome.outcome).toBe('applied');
        expect(outcome.outcome === 'applied' && outcome.workout.muscleGroups).toHaveLength(1);
    });

    it('ammette la rimozione che lascia un solo gruppo quando la giornata è ancora una bozza', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        workout = unwrap(addMuscleGroup(workout, 'Schiena'));

        const outcome = removeMuscleGroup(workout, workout.muscleGroups[0]!.id);

        expect(outcome.outcome).toBe('applied');
    });
});

describe('reorderMuscleGroup', () => {
    it('scambia due gruppi adiacenti e rinumera le position', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        workout = unwrap(addMuscleGroup(workout, 'Schiena'));
        const pettoId = workout.muscleGroups[0]!.id;

        const reordered = reorderMuscleGroup(workout, pettoId, 'down');

        expect(reordered.muscleGroups.map((group) => group.name)).toEqual(['Schiena', 'Petto']);
        expect(reordered.muscleGroups.map((group) => group.position)).toEqual([0, 1]);
    });

    it('non fa nulla quando il movimento supera il limite', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const pettoId = workout.muscleGroups[0]!.id;

        const reordered = reorderMuscleGroup(workout, pettoId, 'up');

        expect(reordered.muscleGroups.map((group) => group.name)).toEqual(['Petto']);
    });
});

describe('esercizi e serie', () => {
    it('appartengono al livello corretto della gerarchia, con position contigue', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const groupId = workout.muscleGroups[0]!.id;

        workout = addExercise(workout, groupId, 'Panca piana');
        workout = addExercise(workout, groupId, 'Croci');
        const [firstExercise, secondExercise] = listGroupExercises(workout.muscleGroups[0]!);

        expect(firstExercise!.sets).toHaveLength(1);
        expect(workout.muscleGroups[0]!.clusters.map((cluster) => cluster.position)).toEqual([0, 1]);
        expect(secondExercise!.position).toBe(0);

        workout = addExerciseSet(workout, groupId, firstExercise!.id);
        const updatedFirstExercise = listGroupExercises(workout.muscleGroups[0]!)[0]!;

        expect(updatedFirstExercise.sets.map((set) => set.position)).toEqual([0, 1]);
    });

    it('ammette ripetizioni e pesi diversi nella stessa lista di serie, incluso il peso zero', () => {
        const firstSet = createExerciseSet(0, 20, 0);
        const secondSet = createExerciseSet(1, 15, 22.5);

        expect(firstSet.repetitions).not.toBe(secondSet.repetitions);
        expect(firstSet.weight).toBe(0);
        expect(secondSet.weight).toBe(22.5);
    });

    it('duplica l ultima serie copiando ripetizioni e peso, con nuovo id e non spuntata', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Gambe'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Squat');
        const exerciseId = listGroupExercises(workout.muscleGroups[0]!)[0]!.id;
        const originalSet = listGroupExercises(workout.muscleGroups[0]!)[0]!.sets[0]!;

        workout = duplicateLastExerciseSet(workout, groupId, exerciseId);
        const sets = listGroupExercises(workout.muscleGroups[0]!)[0]!.sets;

        expect(sets).toHaveLength(2);
        expect(sets[1]!.id).not.toBe(originalSet.id);
        expect(sets[1]!.repetitions).toBe(originalSet.repetitions);
        expect(sets[1]!.weight).toBe(originalSet.weight);
        expect(sets[1]!.completed).toBe(false);
    });

    it('rinumera le position dopo rimozione di un esercizio e di una serie', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Bicipiti'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Curl con bilanciere');
        workout = addExercise(workout, groupId, 'Curl a martello');
        const [firstExercise] = listGroupExercises(workout.muscleGroups[0]!);

        workout = removeExercise(workout, groupId, firstExercise!.id);

        expect(listGroupExercises(workout.muscleGroups[0]!).map((exercise) => exercise.position)).toEqual([0]);
        expect(listGroupExercises(workout.muscleGroups[0]!)[0]!.name).toBe('Curl a martello');

        const remainingExerciseId = listGroupExercises(workout.muscleGroups[0]!)[0]!.id;
        workout = addExerciseSet(workout, groupId, remainingExerciseId);
        const firstSetId = listGroupExercises(workout.muscleGroups[0]!)[0]!.sets[0]!.id;

        workout = removeExerciseSet(workout, groupId, remainingExerciseId, firstSetId);

        expect(listGroupExercises(workout.muscleGroups[0]!)[0]!.sets.map((set) => set.position)).toEqual([0]);
    });

    it('aggiunge un esercizio come nuovo raggruppamento singolo in coda, con tempi a zero', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Panca piana');

        workout = addExercise(workout, groupId, 'Croci');

        const clusters = workout.muscleGroups[0]!.clusters;
        expect(clusters.map((cluster) => cluster.kind)).toEqual(['single', 'single']);
        expect(clusters.map((cluster) => cluster.position)).toEqual([0, 1]);
        expect(clusters[1]!.restAfterRoundSeconds).toBe(0);
        expect(clusters[1]!.restBetweenExercisesSeconds).toBe(0);
        expect(clusters[1]!.exercises.map((exercise) => [exercise.name, exercise.position])).toEqual([['Croci', 0]]);
    });
});

function buildWorkoutWithCluster(kind: ExerciseClusterKind, names: readonly string[]): {
    readonly workout: Workout;
    readonly groupId: string;
    readonly cluster: ExerciseCluster;
} {
    const withGroup = unwrap(addMuscleGroup(createDraftWorkout('2026-01-15'), 'Petto'));
    const group = withGroup.muscleGroups[0]!;
    const exercises = names.map((name, index) => createExercise(name, index));
    const base = createExerciseCluster(createExercise('Base', 0), 0);
    const cluster: ExerciseCluster = { ...base, kind, restAfterRoundSeconds: 90, restBetweenExercisesSeconds: 15, exercises };
    const workout = { ...withGroup, muscleGroups: [{ ...group, clusters: [cluster] }] };
    return { workout, groupId: group.id, cluster };
}

describe('operazioni sugli esercizi attraverso i raggruppamenti', () => {
    it('trova rinomina e serie di un esercizio dentro un multiplo', () => {
        const { workout, groupId, cluster } = buildWorkoutWithCluster('superset', ['Panca', 'Croci']);
        const secondId = cluster.exercises[1]!.id;

        const renamed = renameExercise(workout, groupId, secondId, 'Croci ai cavi');
        const withSet = addExerciseSet(renamed, groupId, secondId);

        const updatedCluster = withSet.muscleGroups[0]!.clusters[0]!;
        expect(updatedCluster.kind).toBe('superset');
        expect(updatedCluster.exercises.map((exercise) => exercise.name)).toEqual(['Panca', 'Croci ai cavi']);
        expect(updatedCluster.exercises[1]!.sets.map((set) => set.position)).toEqual([0, 1]);
    });

    it('rifiuta con errore un esercizio inesistente', () => {
        const { workout, groupId } = buildWorkoutWithCluster('superset', ['Panca', 'Croci']);

        expect(() => renameExercise(workout, groupId, 'inesistente', 'X')).toThrow('Esercizio non trovato');
    });

    describe('removeExercise', () => {
        it('elimina il raggruppamento quando rimuove l\'unico esercizio di un singolo e ricompatta le posizioni', () => {
            let workout = createDraftWorkout('2026-01-15');
            workout = unwrap(addMuscleGroup(workout, 'Petto'));
            const groupId = workout.muscleGroups[0]!.id;
            workout = addExercise(workout, groupId, 'Panca piana');
            workout = addExercise(workout, groupId, 'Croci');
            workout = addExercise(workout, groupId, 'Piegamenti');
            const middleExerciseId = listGroupExercises(workout.muscleGroups[0]!)[1]!.id;

            workout = removeExercise(workout, groupId, middleExerciseId);

            const clusters = workout.muscleGroups[0]!.clusters;
            expect(clusters.map((cluster) => cluster.position)).toEqual([0, 1]);
            expect(listGroupExercises(workout.muscleGroups[0]!).map((exercise) => exercise.name))
                .toEqual(['Panca piana', 'Piegamenti']);
        });

        it('riporta a singolo il multiplo di due che perde un esercizio, conservando i tempi', () => {
            const { workout, groupId, cluster } = buildWorkoutWithCluster('circuit', ['Panca', 'Croci']);

            const after = removeExercise(workout, groupId, cluster.exercises[0]!.id);

            const remaining = after.muscleGroups[0]!.clusters[0]!;
            expect(after.muscleGroups[0]!.clusters).toHaveLength(1);
            expect(remaining.id).toBe(cluster.id);
            expect(remaining.kind).toBe('single');
            expect(remaining.restAfterRoundSeconds).toBe(90);
            expect(remaining.restBetweenExercisesSeconds).toBe(15);
            expect(remaining.exercises.map((exercise) => [exercise.name, exercise.position])).toEqual([['Croci', 0]]);
        });

        it('lascia circuito un circuito di tre che perde un esercizio', () => {
            const { workout, groupId, cluster } = buildWorkoutWithCluster('circuit', ['A', 'B', 'C']);

            const after = removeExercise(workout, groupId, cluster.exercises[1]!.id);

            const remaining = after.muscleGroups[0]!.clusters[0]!;
            expect(remaining.kind).toBe('circuit');
            expect(remaining.exercises.map((exercise) => [exercise.name, exercise.position])).toEqual([['A', 0], ['C', 1]]);
        });

        it('rifiuta con errore un esercizio inesistente', () => {
            const { workout, groupId } = buildWorkoutWithCluster('superset', ['Panca', 'Croci']);

            expect(() => removeExercise(workout, groupId, 'inesistente')).toThrow('Esercizio non trovato');
        });
    });

    describe('reorderExercise', () => {
        it('scambia due esercizi dentro il raggruppamento rinumerando le posizioni, senza toccare il resto', () => {
            const { workout, groupId, cluster } = buildWorkoutWithCluster('superset', ['Panca', 'Croci']);

            const after = reorderExercise(workout, groupId, cluster.exercises[0]!.id, 'down');

            const reordered = after.muscleGroups[0]!.clusters[0]!;
            expect(reordered.exercises.map((exercise) => [exercise.name, exercise.position])).toEqual([['Croci', 0], ['Panca', 1]]);
            expect(reordered.kind).toBe('superset');
            expect(reordered.restAfterRoundSeconds).toBe(90);
        });

        it('lascia la struttura invariata ai bordi del raggruppamento', () => {
            const { workout, groupId, cluster } = buildWorkoutWithCluster('circuit', ['A', 'B']);

            const movedUp = reorderExercise(workout, groupId, cluster.exercises[0]!.id, 'up');
            const movedDown = reorderExercise(workout, groupId, cluster.exercises[1]!.id, 'down');

            expect(movedUp.muscleGroups[0]!.clusters).toEqual(workout.muscleGroups[0]!.clusters);
            expect(movedDown.muscleGroups[0]!.clusters).toEqual(workout.muscleGroups[0]!.clusters);
        });

        it('non sposta un esercizio singolo oltre il suo raggruppamento', () => {
            let workout = createDraftWorkout('2026-01-15');
            workout = unwrap(addMuscleGroup(workout, 'Tricipiti'));
            const groupId = workout.muscleGroups[0]!.id;
            workout = addExercise(workout, groupId, 'Pushdown ai cavi');
            workout = addExercise(workout, groupId, 'French press');
            const firstExerciseId = listGroupExercises(workout.muscleGroups[0]!)[0]!.id;

            const after = reorderExercise(workout, groupId, firstExerciseId, 'down');

            expect(listGroupExercises(after.muscleGroups[0]!).map((exercise) => exercise.name))
                .toEqual(['Pushdown ai cavi', 'French press']);
        });
    });
});

describe('renameExercise', () => {
    it('cambia il nome dell esercizio indicato lasciando intatti gli altri esercizi e gruppi', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        workout = unwrap(addMuscleGroup(workout, 'Schiena'));
        const [pettoGroup, schienaGroup] = workout.muscleGroups;
        workout = addExercise(workout, pettoGroup!.id, 'Panca piana');
        workout = addExercise(workout, pettoGroup!.id, 'Croci');
        workout = addExercise(workout, schienaGroup!.id, 'Lat machine');
        const exerciseToRename = listGroupExercises(workout.muscleGroups[0]!)[0]!;

        const renamed = renameExercise(workout, pettoGroup!.id, exerciseToRename.id, 'Panca piana con manubri');

        const renamedExercise = listGroupExercises(renamed.muscleGroups[0]!)[0]!;
        expect(renamedExercise.name).toBe('Panca piana con manubri');
        expect(renamedExercise.id).toBe(exerciseToRename.id);
        expect(listGroupExercises(renamed.muscleGroups[0]!)[1]!.name).toBe('Croci');
        expect(listGroupExercises(renamed.muscleGroups[1]!)[0]!.name).toBe('Lat machine');
    });

    it('non muta il documento originale', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Gambe'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Squat');
        const exerciseId = listGroupExercises(workout.muscleGroups[0]!)[0]!.id;

        renameExercise(workout, groupId, exerciseId, 'Squat frontale');

        expect(listGroupExercises(workout.muscleGroups[0]!)[0]!.name).toBe('Squat');
    });
});

describe('updateWorkoutNotes', () => {
    it('sostituisce le note della giornata lasciando il resto invariato', () => {
        const workout = createDraftWorkout('2026-01-15');

        const updated = updateWorkoutNotes(workout, 'Poco tempo, riscaldamento ridotto.');

        expect(updated.notes).toBe('Poco tempo, riscaldamento ridotto.');
        expect(updated.id).toBe(workout.id);
    });
});

describe('updateWorkoutDate', () => {
    it('cambia la data lasciando invariati gruppi, stato e createdAt', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const completed: Workout = { ...workout, status: 'completed' };

        const updated = updateWorkoutDate(completed, '2026-02-01');

        expect(updated.workoutDate).toBe('2026-02-01');
        expect(updated.id).toBe(completed.id);
        expect(updated.createdAt).toBe(completed.createdAt);
        expect(updated.status).toBe('completed');
        expect(updated.muscleGroups).toEqual(completed.muscleGroups);
    });

    it('non muta il documento originale', () => {
        const workout = createDraftWorkout('2026-01-15');

        updateWorkoutDate(workout, '2026-02-01');

        expect(workout.workoutDate).toBe('2026-01-15');
    });
});

describe('updateExerciseSet', () => {
    it('applica il cambiamento solo alla serie indicata, lasciando le altre invariate', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Panca piana');
        const exerciseId = listGroupExercises(workout.muscleGroups[0]!)[0]!.id;
        workout = addExerciseSet(workout, groupId, exerciseId);
        const [firstSet, secondSet] = listGroupExercises(workout.muscleGroups[0]!)[0]!.sets;

        workout = updateExerciseSet(workout, groupId, exerciseId, firstSet!.id, (set) => ({ ...set, repetitions: 8, weight: 40 }));

        const [updatedFirstSet, updatedSecondSet] = listGroupExercises(workout.muscleGroups[0]!)[0]!.sets;
        expect(updatedFirstSet).toEqual({ ...firstSet, repetitions: 8, weight: 40 });
        expect(updatedSecondSet).toEqual(secondSet);
    });

    it('inverte lo stato di completamento di una serie', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Panca piana');
        const exerciseId = listGroupExercises(workout.muscleGroups[0]!)[0]!.id;
        const setId = listGroupExercises(workout.muscleGroups[0]!)[0]!.sets[0]!.id;

        workout = updateExerciseSet(workout, groupId, exerciseId, setId, (set) => ({ ...set, completed: !set.completed }));

        expect(listGroupExercises(workout.muscleGroups[0]!)[0]!.sets[0]!.completed).toBe(true);
    });
});

describe('operazioni sui raggruppamenti a livello di giornata', () => {
    it('collega, cambia tipo, imposta i tempi, aggiunge, riordina e stacca dentro il gruppo indicato', () => {
        let workout = unwrap(addMuscleGroup(createDraftWorkout('2026-01-15'), 'Petto'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Panca');
        workout = addExercise(workout, groupId, 'Croci');
        workout = addExercise(workout, groupId, 'Push-up');
        const firstClusterId = workout.muscleGroups[0]!.clusters[0]!.id;

        workout = linkClusterToNext(workout, groupId, firstClusterId);
        workout = changeClusterKind(workout, groupId, firstClusterId, 'circuit');
        workout = updateClusterRestAfterRound(workout, groupId, firstClusterId, 120);
        workout = updateClusterRestBetweenExercises(workout, groupId, firstClusterId, 30);
        workout = addExerciseToCluster(workout, groupId, firstClusterId, 'Dip');
        workout = reorderCluster(workout, groupId, firstClusterId, 'down');

        const [pushUp, circuit] = workout.muscleGroups[0]!.clusters;
        expect(pushUp?.exercises.map((exercise) => exercise.name)).toEqual(['Push-up']);
        expect(circuit?.kind).toBe('circuit');
        expect(circuit?.restAfterRoundSeconds).toBe(120);
        expect(circuit?.restBetweenExercisesSeconds).toBe(30);
        expect(circuit?.exercises.map((exercise) => exercise.name)).toEqual(['Panca', 'Croci', 'Dip']);

        const detached = detachExercise(workout, groupId, circuit!.exercises[0]!.id);
        const names = detached.muscleGroups[0]!.clusters.map((cluster) => cluster.exercises.map((e) => e.name));
        expect(names).toEqual([['Push-up'], ['Croci', 'Dip'], ['Panca']]);
    });

    it('rifiuta con errore un gruppo inesistente', () => {
        const { workout } = buildWorkoutWithCluster('superset', ['Panca', 'Croci']);

        expect(() => linkClusterToNext(workout, 'inesistente', 'x')).toThrow('Gruppo muscolare non trovato');
    });
});
