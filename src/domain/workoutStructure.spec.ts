import { describe, expect, it } from 'vitest';

import { createDraftWorkout, createExerciseSet } from './workoutFactory';
import {
    addExercise,
    addExerciseSet,
    addMuscleGroup,
    duplicateLastExerciseSet,
    reorderExercise,
    reorderMuscleGroup,
    removeExercise,
    removeExerciseSet,
    removeMuscleGroup,
    renameExercise,
    updateExerciseSet,
    updateWorkoutNotes
} from './workoutStructure';
import type { Workout } from './workout';

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
        const [firstExercise, secondExercise] = workout.muscleGroups[0]!.exercises;

        expect(firstExercise!.sets).toHaveLength(1);
        expect(secondExercise!.position).toBe(1);

        workout = addExerciseSet(workout, groupId, firstExercise!.id);
        const updatedFirstExercise = workout.muscleGroups[0]!.exercises[0]!;

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
        const exerciseId = workout.muscleGroups[0]!.exercises[0]!.id;
        const originalSet = workout.muscleGroups[0]!.exercises[0]!.sets[0]!;

        workout = duplicateLastExerciseSet(workout, groupId, exerciseId);
        const sets = workout.muscleGroups[0]!.exercises[0]!.sets;

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
        const [firstExercise] = workout.muscleGroups[0]!.exercises;

        workout = removeExercise(workout, groupId, firstExercise!.id);

        expect(workout.muscleGroups[0]!.exercises.map((exercise) => exercise.position)).toEqual([0]);
        expect(workout.muscleGroups[0]!.exercises[0]!.name).toBe('Curl a martello');

        const remainingExerciseId = workout.muscleGroups[0]!.exercises[0]!.id;
        workout = addExerciseSet(workout, groupId, remainingExerciseId);
        const firstSetId = workout.muscleGroups[0]!.exercises[0]!.sets[0]!.id;

        workout = removeExerciseSet(workout, groupId, remainingExerciseId, firstSetId);

        expect(workout.muscleGroups[0]!.exercises[0]!.sets.map((set) => set.position)).toEqual([0]);
    });

    it('sposta un esercizio su e giù rinumerando le position', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Tricipiti'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Pushdown ai cavi');
        workout = addExercise(workout, groupId, 'French press');
        const firstExerciseId = workout.muscleGroups[0]!.exercises[0]!.id;

        workout = reorderExercise(workout, groupId, firstExerciseId, 'down');

        expect(workout.muscleGroups[0]!.exercises.map((exercise) => exercise.name)).toEqual([
            'French press',
            'Pushdown ai cavi'
        ]);
        expect(workout.muscleGroups[0]!.exercises.map((exercise) => exercise.position)).toEqual([0, 1]);
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
        const exerciseToRename = workout.muscleGroups[0]!.exercises[0]!;

        const renamed = renameExercise(workout, pettoGroup!.id, exerciseToRename.id, 'Panca piana con manubri');

        const renamedExercise = renamed.muscleGroups[0]!.exercises[0]!;
        expect(renamedExercise.name).toBe('Panca piana con manubri');
        expect(renamedExercise.id).toBe(exerciseToRename.id);
        expect(renamed.muscleGroups[0]!.exercises[1]!.name).toBe('Croci');
        expect(renamed.muscleGroups[1]!.exercises[0]!.name).toBe('Lat machine');
    });

    it('non muta il documento originale', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Gambe'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Squat');
        const exerciseId = workout.muscleGroups[0]!.exercises[0]!.id;

        renameExercise(workout, groupId, exerciseId, 'Squat frontale');

        expect(workout.muscleGroups[0]!.exercises[0]!.name).toBe('Squat');
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

describe('updateExerciseSet', () => {
    it('applica il cambiamento solo alla serie indicata, lasciando le altre invariate', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Panca piana');
        const exerciseId = workout.muscleGroups[0]!.exercises[0]!.id;
        workout = addExerciseSet(workout, groupId, exerciseId);
        const [firstSet, secondSet] = workout.muscleGroups[0]!.exercises[0]!.sets;

        workout = updateExerciseSet(workout, groupId, exerciseId, firstSet!.id, (set) => ({ ...set, repetitions: 8, weight: 40 }));

        const [updatedFirstSet, updatedSecondSet] = workout.muscleGroups[0]!.exercises[0]!.sets;
        expect(updatedFirstSet).toEqual({ ...firstSet, repetitions: 8, weight: 40 });
        expect(updatedSecondSet).toEqual(secondSet);
    });

    it('inverte lo stato di completamento di una serie', () => {
        let workout = createDraftWorkout('2026-01-15');
        workout = unwrap(addMuscleGroup(workout, 'Petto'));
        const groupId = workout.muscleGroups[0]!.id;
        workout = addExercise(workout, groupId, 'Panca piana');
        const exerciseId = workout.muscleGroups[0]!.exercises[0]!.id;
        const setId = workout.muscleGroups[0]!.exercises[0]!.sets[0]!.id;

        workout = updateExerciseSet(workout, groupId, exerciseId, setId, (set) => ({ ...set, completed: !set.completed }));

        expect(workout.muscleGroups[0]!.exercises[0]!.sets[0]!.completed).toBe(true);
    });
});
