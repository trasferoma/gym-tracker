import { listGroupExercises } from './exerciseClusters';
import type { MuscleGroupWorkout, Workout } from './workout';

export interface WorkoutCounts {
    readonly exercises: number;
    readonly sets: number;
}

export function countWorkout(workout: Workout): WorkoutCounts {
    const groupCounts = workout.muscleGroups.map(countMuscleGroup);
    const exercises = groupCounts.reduce((total, counts) => total + counts.exercises, 0);
    const sets = groupCounts.reduce((total, counts) => total + counts.sets, 0);
    return { exercises, sets };
}

export function countMuscleGroup(group: MuscleGroupWorkout): WorkoutCounts {
    const exercises = listGroupExercises(group);
    const sets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    return { exercises: exercises.length, sets };
}
