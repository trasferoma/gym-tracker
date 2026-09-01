import type { SetIssueLevel } from './setIssue';

export type WorkoutStatus = 'draft' | 'completed';

export interface ExerciseSet {
    readonly id: string;
    readonly position: number;
    readonly repetitions: number;
    readonly weight: number;
    readonly completed: boolean;
    readonly notes: string;
    readonly issue?: SetIssueLevel | undefined;
}

export interface Exercise {
    readonly id: string;
    readonly name: string;
    readonly position: number;
    readonly notes: string;
    readonly sets: readonly ExerciseSet[];
}

export interface MuscleGroupWorkout {
    readonly id: string;
    readonly name: string;
    readonly position: number;
    readonly exercises: readonly Exercise[];
}

export interface Workout {
    readonly id: string;
    readonly workoutDate: string;
    readonly status: WorkoutStatus;
    readonly notes: string;
    readonly muscleGroups: readonly MuscleGroupWorkout[];
    readonly createdAt: string;
    readonly updatedAt: string;
}

export const MIN_COMPLETED_MUSCLE_GROUPS = 1;
export const MAX_COMPLETED_MUSCLE_GROUPS = 3;

export type WorkoutOperationOutcome =
    | { readonly outcome: 'applied'; readonly workout: Workout }
    | { readonly outcome: 'rejected'; readonly reason: string };
