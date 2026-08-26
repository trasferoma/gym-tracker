import type { StatEntry } from './statEntries';
import { sameStatKey, type StatKey } from './statKey';

export interface StatSession {
    readonly workoutDate: string;
    readonly weights: readonly number[];
}

export function listStatSessions(entries: readonly StatEntry[], key: StatKey): readonly StatSession[] {
    return entries
            .filter((entry) => sameStatKey(entry.key, key))
            .slice()
            .sort(compareByDateThenCreationAscending)
            .map(toStatSession);
}

function toStatSession(entry: StatEntry): StatSession {
    return { workoutDate: entry.workoutDate, weights: entry.weights };
}

function compareByDateThenCreationAscending(a: StatEntry, b: StatEntry): number {
    if (a.workoutDate !== b.workoutDate) {
        return a.workoutDate < b.workoutDate ? -1 : 1;
    }
    return a.createdAt < b.createdAt ? -1 : 1;
}
