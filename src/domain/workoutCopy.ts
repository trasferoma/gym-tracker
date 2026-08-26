import { generateId } from './identity';
import type { Exercise, ExerciseSet, MuscleGroupWorkout, Workout } from './workout';

export function copyWorkoutStructure(source: Workout, workoutDate: string): Workout {
    const timestamp = new Date().toISOString();
    return {
        id: generateId(),
        workoutDate,
        status: 'draft',
        notes: '',
        muscleGroups: source.muscleGroups.map(copyMuscleGroup),
        createdAt: timestamp,
        updatedAt: timestamp
    };
}

function copyMuscleGroup(group: MuscleGroupWorkout): MuscleGroupWorkout {
    return {
        id: generateId(),
        name: group.name,
        position: group.position,
        exercises: group.exercises.map(copyExercise)
    };
}

function copyExercise(exercise: Exercise): Exercise {
    return {
        id: generateId(),
        name: exercise.name,
        position: exercise.position,
        notes: exercise.notes,
        sets: exercise.sets.map(copyExerciseSet)
    };
}

function copyExerciseSet(set: ExerciseSet): ExerciseSet {
    return {
        id: generateId(),
        position: set.position,
        repetitions: set.repetitions,
        weight: set.weight,
        completed: false,
        notes: ''
    };
}
