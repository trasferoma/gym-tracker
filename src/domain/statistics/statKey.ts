import type { Exercise, MuscleGroupWorkout } from '@/domain/workout';

export interface StatKey {
    readonly groupPosition: number;
    readonly groupName: string;
    readonly exerciseName: string;
    readonly repetitionScheme: readonly number[];
}

export function deriveStatKey(groupPosition: number, group: MuscleGroupWorkout, exercise: Exercise): StatKey {
    const repetitionScheme = exercise.sets.map((set) => set.repetitions);
    return { groupPosition, groupName: group.name, exerciseName: exercise.name, repetitionScheme };
}

export function schemeLabel(repetitionScheme: readonly number[]): string {
    if (repetitionScheme.length === 0) {
        return '-';
    }
    const firstRepetitions = repetitionScheme[0]!;
    const uniform = repetitionScheme.every((repetitions) => repetitions === firstRepetitions);
    return uniform ? `${repetitionScheme.length}x${firstRepetitions}` : repetitionScheme.join('-');
}

export function sameRepetitionScheme(a: readonly number[], b: readonly number[]): boolean {
    return a.length === b.length && a.every((repetitions, index) => repetitions === b[index]);
}

export function sameStatKey(a: StatKey, b: StatKey): boolean {
    return a.groupPosition === b.groupPosition
            && a.groupName === b.groupName
            && a.exerciseName === b.exerciseName
            && sameRepetitionScheme(a.repetitionScheme, b.repetitionScheme);
}
