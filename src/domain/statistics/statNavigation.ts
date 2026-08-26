import type { StatEntry } from './statEntries';
import { sameRepetitionScheme, schemeLabel } from './statKey';

export interface PositionOption {
    readonly groupPosition: number;
    readonly groupNames: readonly string[];
}

export interface GroupOption {
    readonly groupName: string;
    readonly sessionCount: number;
}

export interface ExerciseOption {
    readonly exerciseName: string;
    readonly sessionCount: number;
    readonly schemeCount: number;
}

export interface SchemeOption {
    readonly repetitionScheme: readonly number[];
    readonly label: string;
    readonly sessionCount: number;
    readonly lastSessionDate: string;
}

export function listPositionOptions(entries: readonly StatEntry[]): readonly PositionOption[] {
    const groupPositions = entries.map((entry) => entry.key.groupPosition);
    const positions = distinctNumbersAscending(groupPositions);
    return positions.map((groupPosition) => buildPositionOption(entries, groupPosition));
}

export function listGroupOptions(entries: readonly StatEntry[], groupPosition: number): readonly GroupOption[] {
    const entriesAtPosition = filterByPosition(entries, groupPosition);
    const groupNames = distinctGroupNames(entriesAtPosition);
    return groupNames.map((groupName) => buildGroupOption(entriesAtPosition, groupName));
}

export function listExerciseOptions(
        entries: readonly StatEntry[], groupPosition: number, groupName: string, searchQuery = ''
): readonly ExerciseOption[] {
    const entriesForGroup = filterByPositionAndGroup(entries, groupPosition, groupName);
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const exerciseNames = distinctExerciseNames(entriesForGroup)
            .filter((name) => name.toLowerCase().includes(normalizedQuery));
    return exerciseNames.map((exerciseName) => buildExerciseOption(entriesForGroup, exerciseName));
}

export function listSchemeOptions(
        entries: readonly StatEntry[], groupPosition: number, groupName: string, exerciseName: string
): readonly SchemeOption[] {
    const entriesForExercise = filterByExercise(entries, groupPosition, groupName, exerciseName);
    const schemes = distinctSchemes(entriesForExercise);
    const options = schemes.map((repetitionScheme) => buildSchemeOption(entriesForExercise, repetitionScheme));
    return options.slice().sort((a, b) => b.sessionCount - a.sessionCount);
}

function buildPositionOption(entries: readonly StatEntry[], groupPosition: number): PositionOption {
    const entriesAtPosition = filterByPosition(entries, groupPosition);
    const groupNames = distinctGroupNames(entriesAtPosition);
    return { groupPosition, groupNames };
}

function buildGroupOption(entriesAtPosition: readonly StatEntry[], groupName: string): GroupOption {
    const entriesForGroup = entriesAtPosition.filter((entry) => entry.key.groupName === groupName);
    const workoutDates = entriesForGroup.map((entry) => entry.workoutDate);
    const distinctDates = distinctStringsInOrder(workoutDates);
    return { groupName, sessionCount: distinctDates.length };
}

function distinctGroupNames(entries: readonly StatEntry[]): readonly string[] {
    const groupNames = entries.map((entry) => entry.key.groupName);
    return distinctStringsInOrder(groupNames);
}

function distinctExerciseNames(entries: readonly StatEntry[]): readonly string[] {
    const exerciseNames = entries.map((entry) => entry.key.exerciseName);
    return distinctStringsInOrder(exerciseNames);
}

function buildExerciseOption(entriesForGroup: readonly StatEntry[], exerciseName: string): ExerciseOption {
    const entriesForExercise = entriesForGroup.filter((entry) => entry.key.exerciseName === exerciseName);
    const schemeCount = distinctSchemes(entriesForExercise).length;
    return { exerciseName, sessionCount: entriesForExercise.length, schemeCount };
}

function buildSchemeOption(
        entriesForExercise: readonly StatEntry[], repetitionScheme: readonly number[]): SchemeOption {
    const entriesForScheme = entriesForExercise.filter(
            (entry) => sameRepetitionScheme(entry.key.repetitionScheme, repetitionScheme));
    const sortedDates = entriesForScheme.map((entry) => entry.workoutDate).sort();
    const lastSessionDate = sortedDates.at(-1)!;
    return {
        repetitionScheme,
        label: schemeLabel(repetitionScheme),
        sessionCount: entriesForScheme.length,
        lastSessionDate
    };
}

function filterByPosition(entries: readonly StatEntry[], groupPosition: number): readonly StatEntry[] {
    return entries.filter((entry) => entry.key.groupPosition === groupPosition);
}

function filterByPositionAndGroup(
        entries: readonly StatEntry[], groupPosition: number, groupName: string): readonly StatEntry[] {
    return filterByPosition(entries, groupPosition).filter((entry) => entry.key.groupName === groupName);
}

function filterByExercise(
        entries: readonly StatEntry[], groupPosition: number, groupName: string, exerciseName: string
): readonly StatEntry[] {
    return filterByPositionAndGroup(entries, groupPosition, groupName)
            .filter((entry) => entry.key.exerciseName === exerciseName);
}

function distinctSchemes(entries: readonly StatEntry[]): readonly (readonly number[])[] {
    const schemes: (readonly number[])[] = [];
    for (const entry of entries) {
        const alreadyListed = schemes.some((scheme) => sameRepetitionScheme(scheme, entry.key.repetitionScheme));
        if (!alreadyListed) {
            schemes.push(entry.key.repetitionScheme);
        }
    }
    return schemes;
}

function distinctNumbersAscending(values: readonly number[]): readonly number[] {
    const uniqueValues = new Set(values);
    return Array.from(uniqueValues).sort((a, b) => a - b);
}

function distinctStringsInOrder(values: readonly string[]): readonly string[] {
    const uniqueValues = new Set(values);
    return Array.from(uniqueValues);
}
