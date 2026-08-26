import { computed, ref, type ComputedRef, type Ref } from 'vue';

import { collectStatEntries } from '@/domain/statistics/statEntries';
import type { StatKey } from '@/domain/statistics/statKey';
import {
    listExerciseOptions,
    listGroupOptions,
    listPositionOptions,
    listSchemeOptions,
    type ExerciseOption,
    type GroupOption,
    type PositionOption,
    type SchemeOption
} from '@/domain/statistics/statNavigation';
import { listStatSessions, type StatSession } from '@/domain/statistics/statSessions';
import type { Workout } from '@/domain/workout';
import { listAllWorkouts } from '@/persistence/workoutRepository';

export type StatisticsStep = 'position' | 'group' | 'exercise' | 'scheme' | 'sessions';
type SelectableStep = Exclude<StatisticsStep, 'sessions'>;

export interface UseStatisticsPath {
    readonly loading: Ref<boolean>;
    readonly step: ComputedRef<StatisticsStep>;
    readonly groupPosition: Ref<number | undefined>;
    readonly groupName: Ref<string | undefined>;
    readonly exerciseName: Ref<string | undefined>;
    readonly repetitionScheme: Ref<readonly number[] | undefined>;
    readonly exerciseSearchQuery: Ref<string>;
    readonly positionOptions: ComputedRef<readonly PositionOption[]>;
    readonly groupOptions: ComputedRef<readonly GroupOption[]>;
    readonly exerciseOptions: ComputedRef<readonly ExerciseOption[]>;
    readonly schemeOptions: ComputedRef<readonly SchemeOption[]>;
    readonly sessions: ComputedRef<readonly StatSession[]>;
    reload(): Promise<void>;
    selectPosition(groupPosition: number): void;
    selectGroup(groupName: string): void;
    selectExercise(exerciseName: string): void;
    selectScheme(repetitionScheme: readonly number[]): void;
    goToStep(step: SelectableStep): void;
    enterFromShortcut(key: StatKey): void;
    reset(): void;
}

export function useStatisticsPath(): UseStatisticsPath {
    const loading = ref(false);
    const workouts = ref<readonly Workout[]>([]);
    const entries = computed(() => collectStatEntries(workouts.value));

    const groupPosition = ref<number>();
    const groupName = ref<string>();
    const exerciseName = ref<string>();
    const repetitionScheme = ref<readonly number[]>();
    const exerciseSearchQuery = ref('');

    const step = computed<StatisticsStep>(() => resolveStep(
            groupPosition.value, groupName.value, exerciseName.value, repetitionScheme.value));

    const positionOptions = computed(() => listPositionOptions(entries.value));

    const groupOptions = computed(() => (
        groupPosition.value === undefined ? [] : listGroupOptions(entries.value, groupPosition.value)
    ));

    const exerciseOptions = computed(() => {
        if (groupPosition.value === undefined || groupName.value === undefined) {
            return [];
        }
        return listExerciseOptions(entries.value, groupPosition.value, groupName.value, exerciseSearchQuery.value);
    });

    const schemeOptions = computed(() => {
        if (groupPosition.value === undefined || groupName.value === undefined || exerciseName.value === undefined) {
            return [];
        }
        return listSchemeOptions(entries.value, groupPosition.value, groupName.value, exerciseName.value);
    });

    const sessions = computed(() => {
        const key = currentKey();
        return key === undefined ? [] : listStatSessions(entries.value, key);
    });

    function currentKey(): StatKey | undefined {
        if (groupPosition.value === undefined || groupName.value === undefined
                || exerciseName.value === undefined || repetitionScheme.value === undefined) {
            return undefined;
        }
        return {
            groupPosition: groupPosition.value,
            groupName: groupName.value,
            exerciseName: exerciseName.value,
            repetitionScheme: repetitionScheme.value
        };
    }

    async function reload(): Promise<void> {
        loading.value = true;
        try {
            workouts.value = await listAllWorkouts();
        } finally {
            loading.value = false;
        }
    }

    function selectPosition(nextGroupPosition: number): void {
        groupPosition.value = nextGroupPosition;
        clearFromGroup();
    }

    function selectGroup(nextGroupName: string): void {
        groupName.value = nextGroupName;
        clearFromExercise();
    }

    function selectExercise(nextExerciseName: string): void {
        exerciseName.value = nextExerciseName;
        clearFromScheme();
    }

    function selectScheme(nextRepetitionScheme: readonly number[]): void {
        repetitionScheme.value = nextRepetitionScheme;
    }

    function goToStep(target: SelectableStep): void {
        if (target === 'position') {
            groupPosition.value = undefined;
        }
        if (target === 'position' || target === 'group') {
            clearFromGroup();
            return;
        }
        if (target === 'exercise') {
            clearFromExercise();
            return;
        }
        clearFromScheme();
    }

    function enterFromShortcut(key: StatKey): void {
        groupPosition.value = key.groupPosition;
        groupName.value = key.groupName;
        exerciseName.value = key.exerciseName;
        repetitionScheme.value = key.repetitionScheme;
    }

    function reset(): void {
        goToStep('position');
    }

    function clearFromGroup(): void {
        groupName.value = undefined;
        clearFromExercise();
    }

    function clearFromExercise(): void {
        exerciseName.value = undefined;
        exerciseSearchQuery.value = '';
        clearFromScheme();
    }

    function clearFromScheme(): void {
        repetitionScheme.value = undefined;
    }

    return {
        loading,
        step,
        groupPosition,
        groupName,
        exerciseName,
        repetitionScheme,
        exerciseSearchQuery,
        positionOptions,
        groupOptions,
        exerciseOptions,
        schemeOptions,
        sessions,
        reload,
        selectPosition,
        selectGroup,
        selectExercise,
        selectScheme,
        goToStep,
        enterFromShortcut,
        reset
    };
}

export const sharedStatisticsPath = useStatisticsPath();

function resolveStep(
        groupPosition: number | undefined, groupName: string | undefined, exerciseName: string | undefined,
        repetitionScheme: readonly number[] | undefined
): StatisticsStep {
    if (groupPosition === undefined) {
        return 'position';
    }
    if (groupName === undefined) {
        return 'group';
    }
    if (exerciseName === undefined) {
        return 'exercise';
    }
    if (repetitionScheme === undefined) {
        return 'scheme';
    }
    return 'sessions';
}
