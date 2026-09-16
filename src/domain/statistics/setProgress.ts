import type { StatSession } from './statSessions';

export type SetProgressDirection = 'up' | 'down' | 'flat';

export interface PreviousSetComparison {
    readonly kind: 'previous';
    readonly previousWeight: number;
    readonly previousDate: string;
    readonly difference: number;
    readonly direction: SetProgressDirection;
}

export interface MissingSetComparison {
    readonly kind: 'none';
}

export type SetComparison = PreviousSetComparison | MissingSetComparison;

export interface SetProgress {
    readonly setIndex: number;
    readonly latestWeight: number;
    readonly comparison: SetComparison;
}

interface RecordedSet {
    readonly workoutDate: string;
    readonly weight: number;
}

const NO_COMPARISON: MissingSetComparison = { kind: 'none' };

export function listSetProgress(sessions: readonly StatSession[]): readonly SetProgress[] {
    const setIndexes = listSetIndexes(sessions);
    const progressBySetIndex = setIndexes.map((setIndex) => buildSetProgress(sessions, setIndex));
    return progressBySetIndex.filter(isRecordedProgress);
}

function listSetIndexes(sessions: readonly StatSession[]): readonly number[] {
    const sessionSetCounts = sessions.map((session) => session.weights.length);
    const setCount = Math.max(0, ...sessionSetCounts);
    return Array.from({ length: setCount }, (_, setIndex) => setIndex);
}

function buildSetProgress(sessions: readonly StatSession[], setIndex: number): SetProgress | undefined {
    const recordedSets = listRecordedSets(sessions, setIndex);
    const latestSet = recordedSets.at(-1);
    if (latestSet === undefined) {
        return undefined;
    }
    const previousSet = recordedSets.at(-2);
    const comparison = previousSet === undefined ? NO_COMPARISON : compareWithPrevious(latestSet, previousSet);
    return { setIndex, latestWeight: latestSet.weight, comparison };
}

function listRecordedSets(sessions: readonly StatSession[], setIndex: number): readonly RecordedSet[] {
    const recordedSets: RecordedSet[] = [];
    sessions.forEach((session) => {
        const weight = session.weights[setIndex];
        if (weight === undefined) {
            return;
        }
        recordedSets.push({ workoutDate: session.workoutDate, weight });
    });
    return recordedSets;
}

function compareWithPrevious(latestSet: RecordedSet, previousSet: RecordedSet): PreviousSetComparison {
    const difference = latestSet.weight - previousSet.weight;
    const direction = resolveDirection(difference);
    return {
        kind: 'previous',
        previousWeight: previousSet.weight,
        previousDate: previousSet.workoutDate,
        difference,
        direction
    };
}

function resolveDirection(difference: number): SetProgressDirection {
    if (difference > 0) {
        return 'up';
    }
    if (difference < 0) {
        return 'down';
    }
    return 'flat';
}

function isRecordedProgress(progress: SetProgress | undefined): progress is SetProgress {
    return progress !== undefined;
}
