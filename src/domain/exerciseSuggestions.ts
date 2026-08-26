import type { Workout } from './workout';

interface HistoryEntry {
    readonly groupName: string;
    readonly exerciseName: string;
}

export const MAX_VISIBLE_SUGGESTIONS = 8;

export interface FilteredSuggestions {
    readonly names: readonly string[];
    readonly hiddenCount: number;
}

export function suggestExerciseNames(workouts: readonly Workout[], groupName: string): readonly string[] {
    const historyEntries = collectHistoryEntries(workouts);
    const namesForGroup = uniqueExerciseNames(historyEntries.filter((entry) => entry.groupName === groupName));
    if (namesForGroup.length > 0) {
        return namesForGroup;
    }
    return uniqueExerciseNames(historyEntries);
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

function collectHistoryEntries(workouts: readonly Workout[]): readonly HistoryEntry[] {
    const workoutsByRecency = [...workouts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const seenGroupAndName = new Set<string>();
    const entries: HistoryEntry[] = [];
    for (const workout of workoutsByRecency) {
        collectEntriesFromWorkout(workout, seenGroupAndName, entries);
    }
    return entries;
}

function collectEntriesFromWorkout(
        workout: Workout, seenGroupAndName: Set<string>, entries: HistoryEntry[]): void {
    for (const group of workout.muscleGroups) {
        for (const exercise of group.exercises) {
            const key = buildHistoryKey(group.name, exercise.name);
            if (seenGroupAndName.has(key)) {
                continue;
            }
            seenGroupAndName.add(key);
            entries.push({ groupName: group.name, exerciseName: exercise.name });
        }
    }
}

function uniqueExerciseNames(entries: readonly HistoryEntry[]): readonly string[] {
    const seenNames = new Set<string>();
    const names: string[] = [];
    for (const entry of entries) {
        const normalizedName = normalizeExerciseName(entry.exerciseName);
        if (seenNames.has(normalizedName)) {
            continue;
        }
        seenNames.add(normalizedName);
        names.push(entry.exerciseName);
    }
    return names;
}

function buildHistoryKey(groupName: string, exerciseName: string): string {
    return `${groupName}\u0000${normalizeExerciseName(exerciseName)}`;
}

function normalizeExerciseName(name: string): string {
    return name.trim().toLowerCase();
}
