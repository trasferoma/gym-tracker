import type { Workout } from './workout';

export const MAX_VISIBLE_SUGGESTIONS = 8;

export interface FilteredSuggestions {
    readonly names: readonly string[];
    readonly hiddenCount: number;
}

export function suggestExerciseNames(workouts: readonly Workout[], groupName: string): readonly string[] {
    const workoutsByRecency = [...workouts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const seenNames = new Set<string>();
    const names: string[] = [];
    for (const workout of workoutsByRecency) {
        collectExerciseNamesFromWorkout(workout, groupName, seenNames, names);
    }
    return names;
}

export function filterSuggestionsByQuery(suggestions: readonly string[], query: string): FilteredSuggestions {
    const normalizedQuery = normalizeForSearch(query);
    const matchingNames = normalizedQuery === ''
            ? suggestions
            : suggestions.filter((name) => normalizeForSearch(name).includes(normalizedQuery));
    return {
        names: matchingNames.slice(0, MAX_VISIBLE_SUGGESTIONS),
        hiddenCount: Math.max(0, matchingNames.length - MAX_VISIBLE_SUGGESTIONS)
    };
}

const COMBINING_DIACRITIC_RANGE_START = String.fromCharCode(0x0300);
const COMBINING_DIACRITIC_RANGE_END = String.fromCharCode(0x036f);
const DIACRITIC_MARKS_PATTERN = new RegExp(
        `[${COMBINING_DIACRITIC_RANGE_START}-${COMBINING_DIACRITIC_RANGE_END}]`, 'g');

function normalizeForSearch(value: string): string {
    return value
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(DIACRITIC_MARKS_PATTERN, '');
}

function collectExerciseNamesFromWorkout(
        workout: Workout, groupName: string, seenNames: Set<string>, names: string[]): void {
    for (const group of workout.muscleGroups) {
        if (group.name !== groupName) {
            continue;
        }
        for (const exercise of group.exercises) {
            const normalizedName = normalizeExerciseName(exercise.name);
            if (seenNames.has(normalizedName)) {
                continue;
            }
            seenNames.add(normalizedName);
            names.push(exercise.name);
        }
    }
}

function normalizeExerciseName(name: string): string {
    return name.trim().toLowerCase();
}
