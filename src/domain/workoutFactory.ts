import { generateId } from './identity';
import type { Exercise, ExerciseSet, MuscleGroupWorkout, Workout } from './workout';

const DEFAULT_SET_REPETITIONS = 10;
const DEFAULT_SET_WEIGHT = 0;

export function createDraftWorkout(workoutDate: string): Workout {
    const timestamp = new Date().toISOString();
    return {
        id: generateId(),
        workoutDate,
        status: 'draft',
        notes: '',
        muscleGroups: [],
        createdAt: timestamp,
        updatedAt: timestamp
    };
}

export function createMuscleGroupWorkout(name: string, position: number): MuscleGroupWorkout {
    return {
        id: generateId(),
        name,
        position,
        exercises: []
    };
}

export function createExercise(name: string, position: number): Exercise {
    return {
        id: generateId(),
        name,
        position,
        notes: '',
        sets: [createExerciseSet(0)]
    };
}

export function createExerciseSet(
        position: number,
        repetitions: number = DEFAULT_SET_REPETITIONS,
        weight: number = DEFAULT_SET_WEIGHT): ExerciseSet {
    return {
        id: generateId(),
        position,
        repetitions,
        weight,
        completed: false,
        notes: ''
    };
}
