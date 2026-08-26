import { deriveStatKey, type StatKey } from './statKey';
import type { Exercise, MuscleGroupWorkout, Workout } from '@/domain/workout';

export interface StatEntry {
    readonly key: StatKey;
    readonly workoutDate: string;
    readonly createdAt: string;
    readonly weights: readonly number[];
}

export function collectStatEntries(workouts: readonly Workout[]): readonly StatEntry[] {
    const completedWorkouts = workouts.filter((workout) => workout.status === 'completed');
    return completedWorkouts.flatMap(collectEntriesFromWorkout);
}

function collectEntriesFromWorkout(workout: Workout): readonly StatEntry[] {
    return workout.muscleGroups.flatMap((group, groupIndex) => collectEntriesFromGroup(workout, group, groupIndex));
}

function collectEntriesFromGroup(
        workout: Workout, group: MuscleGroupWorkout, groupIndex: number): readonly StatEntry[] {
    const groupPosition = groupIndex + 1;
    return group.exercises
            .filter((exercise) => exercise.sets.length > 0)
            .map((exercise) => buildStatEntry(workout, groupPosition, group, exercise));
}

function buildStatEntry(
        workout: Workout, groupPosition: number, group: MuscleGroupWorkout, exercise: Exercise): StatEntry {
    const key = deriveStatKey(groupPosition, group, exercise);
    const weights = exercise.sets.map((set) => set.weight);
    return { key, workoutDate: workout.workoutDate, createdAt: workout.createdAt, weights };
}
