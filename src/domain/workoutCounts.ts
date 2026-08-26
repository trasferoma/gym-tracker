import type { MuscleGroupWorkout, Workout } from './workout';

export interface WorkoutCounts {
    readonly exercises: number;
    readonly sets: number;
}

export function countWorkout(workout: Workout): WorkoutCounts {
    const exercises = workout.muscleGroups.reduce((total, group) => total + group.exercises.length, 0);
    const sets = workout.muscleGroups.reduce((total, group) => total + countSetsInGroup(group), 0);
    return { exercises, sets };
}

export function countMuscleGroup(group: MuscleGroupWorkout): WorkoutCounts {
    const sets = countSetsInGroup(group);
    return { exercises: group.exercises.length, sets };
}

function countSetsInGroup(group: MuscleGroupWorkout): number {
    return group.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}
