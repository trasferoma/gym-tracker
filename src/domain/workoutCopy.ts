import { generateId } from './identity';
import type { Exercise, ExerciseCluster, ExerciseSet, MuscleGroupWorkout, Workout } from './workout';

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
        clusters: group.clusters.map(copyExerciseCluster)
    };
}

function copyExerciseCluster(cluster: ExerciseCluster): ExerciseCluster {
    return {
        id: generateId(),
        kind: cluster.kind,
        position: cluster.position,
        restAfterRoundSeconds: cluster.restAfterRoundSeconds,
        restBetweenExercisesSeconds: cluster.restBetweenExercisesSeconds,
        exercises: cluster.exercises.map(copyExercise)
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
