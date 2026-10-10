import type { ExerciseSet } from '@/domain/workout';

export function formatRepetitionScheme(sets: readonly ExerciseSet[]): string {
    if (sets.length === 0) {
        return '-';
    }
    const repetitions = sets.map((set) => set.repetitions);
    const firstRepetitions = repetitions[0]!;
    const uniform = repetitions.every((value) => value === firstRepetitions);
    return uniform ? `${sets.length}x${firstRepetitions}` : repetitions.join('-');
}
