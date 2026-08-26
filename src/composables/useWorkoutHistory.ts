import { computed, ref, shallowRef, type ComputedRef, type Ref } from 'vue';

import { MUSCLE_GROUPS } from '@/domain/muscleGroups';
import { todayLocalDate } from '@/domain/localDate';
import type { Workout } from '@/domain/workout';
import { deleteWorkout, listAllWorkouts } from '@/persistence/workoutRepository';

const COPY_CANDIDATE_LIMIT = 20;

export interface UseWorkoutHistory {
    readonly loading: Ref<boolean>;
    readonly groupFilter: Ref<string | undefined>;
    readonly allWorkouts: ComputedRef<readonly Workout[]>;
    readonly availableGroupFilters: ComputedRef<readonly string[]>;
    readonly todayEntries: ComputedRef<readonly Workout[]>;
    readonly previousEntries: ComputedRef<readonly Workout[]>;
    readonly copyCandidates: ComputedRef<readonly Workout[]>;
    readonly currentDraft: ComputedRef<Workout | undefined>;
    readonly lastCompletedWorkout: ComputedRef<Workout | undefined>;
    reload(): Promise<void>;
    remove(id: string): Promise<void>;
}

export function useWorkoutHistory(): UseWorkoutHistory {
    const loading = ref(false);
    const groupFilter = ref<string>();
    const workouts = shallowRef<readonly Workout[]>([]);

    const allWorkouts = computed(() => workouts.value);
    const sortedWorkouts = computed(() => sortByDateDescendingThenCreationAscending(workouts.value));
    const availableGroupFilters = computed(() => collectUsedGroupNames(workouts.value));
    const filteredWorkouts = computed(() => filterByGroup(sortedWorkouts.value, groupFilter.value));
    const todayEntries = computed(() => filteredWorkouts.value.filter(isToday));
    const previousEntries = computed(() => filteredWorkouts.value.filter((workout) => !isToday(workout)));
    const copyCandidates = computed(() => sortedWorkouts.value.slice(0, COPY_CANDIDATE_LIMIT));
    const currentDraft = computed(() => sortedWorkouts.value.find((workout) => workout.status === 'draft'));
    const lastCompletedWorkout = computed(() => sortedWorkouts.value.find((workout) => workout.status === 'completed'));

    async function reload(): Promise<void> {
        loading.value = true;
        try {
            workouts.value = await listAllWorkouts();
        } finally {
            loading.value = false;
        }
    }

    async function remove(id: string): Promise<void> {
        await deleteWorkout(id);
        await reload();
    }

    return {
        loading,
        groupFilter,
        allWorkouts,
        availableGroupFilters,
        todayEntries,
        previousEntries,
        copyCandidates,
        currentDraft,
        lastCompletedWorkout,
        reload,
        remove
    };
}

function isToday(workout: Workout): boolean {
    return workout.workoutDate === todayLocalDate();
}

function sortByDateDescendingThenCreationAscending(workouts: readonly Workout[]): readonly Workout[] {
    return [...workouts].sort(compareByDateDescendingThenCreationAscending);
}

function compareByDateDescendingThenCreationAscending(a: Workout, b: Workout): number {
    if (a.workoutDate !== b.workoutDate) {
        return a.workoutDate < b.workoutDate ? 1 : -1;
    }
    return a.createdAt < b.createdAt ? -1 : 1;
}

function filterByGroup(entries: readonly Workout[], groupName: string | undefined): readonly Workout[] {
    if (!groupName) {
        return entries;
    }
    return entries.filter((workout) => usesGroup(workout, groupName));
}

function usesGroup(workout: Workout, groupName: string): boolean {
    return workout.muscleGroups.some((group) => group.name === groupName);
}

function collectUsedGroupNames(entries: readonly Workout[]): readonly string[] {
    const usedNames = new Set<string>();
    for (const workout of entries) {
        for (const group of workout.muscleGroups) {
            usedNames.add(group.name);
        }
    }
    return MUSCLE_GROUPS.filter((name) => usedNames.has(name));
}
