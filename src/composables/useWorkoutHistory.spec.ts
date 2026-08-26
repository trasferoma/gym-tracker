import { afterEach, describe, expect, it } from 'vitest';

import { useWorkoutHistory } from './useWorkoutHistory';
import { gymTrackerDatabase } from '@/persistence/gymTrackerDatabase';
import { findWorkoutById, saveWorkout } from '@/persistence/workoutRepository';
import { createDraftWorkout, createMuscleGroupWorkout } from '@/domain/workoutFactory';
import { todayLocalDate } from '@/domain/localDate';
import type { Workout } from '@/domain/workout';

afterEach(async () => {
    await gymTrackerDatabase.workouts.clear();
});

function buildWorkout(
        workoutDate: string, createdAt: string, groupNames: readonly string[] = [], status: Workout['status'] = 'draft'
): Workout {
    const draft = createDraftWorkout(workoutDate);
    const muscleGroups = groupNames.map((name, index) => createMuscleGroupWorkout(name, index));
    return { ...draft, createdAt, updatedAt: createdAt, status, muscleGroups };
}

describe('ordinamento', () => {
    it('ordina decrescente per data e, a pari data, crescente per createdAt', async () => {
        const older = buildWorkout('2026-01-01', '2026-01-01T08:00:00.000Z');
        const sameDayFirst = buildWorkout('2026-01-05', '2026-01-05T07:00:00.000Z');
        const sameDaySecond = buildWorkout('2026-01-05', '2026-01-05T18:00:00.000Z');
        await saveWorkout(older);
        await saveWorkout(sameDaySecond);
        await saveWorkout(sameDayFirst);
        const history = useWorkoutHistory();

        await history.reload();

        const ids = history.previousEntries.value.map((workout) => workout.id);
        expect(ids).toEqual([sameDayFirst.id, sameDaySecond.id, older.id]);
    });
});

describe('sezione Oggi', () => {
    it('separa le giornate di oggi dalle precedenti', async () => {
        const today = buildWorkout(todayLocalDate(), '2026-01-05T07:00:00.000Z');
        const yesterday = buildWorkout('2020-01-01', '2020-01-01T07:00:00.000Z');
        await saveWorkout(today);
        await saveWorkout(yesterday);
        const history = useWorkoutHistory();

        await history.reload();

        expect(history.todayEntries.value.map((workout) => workout.id)).toEqual([today.id]);
        expect(history.previousEntries.value.map((workout) => workout.id)).toEqual([yesterday.id]);
    });
});

describe('filtro per gruppo', () => {
    it('elenca solo i gruppi effettivamente usati, in ordine di catalogo', async () => {
        await saveWorkout(buildWorkout('2026-01-01', '2026-01-01T00:00:00.000Z', ['Gambe']));
        await saveWorkout(buildWorkout('2026-01-02', '2026-01-02T00:00:00.000Z', ['Petto']));
        const history = useWorkoutHistory();

        await history.reload();

        expect(history.availableGroupFilters.value).toEqual(['Petto', 'Gambe']);
    });

    it('filtra le giornate per il gruppo selezionato', async () => {
        const withPetto = buildWorkout('2026-01-01', '2026-01-01T00:00:00.000Z', ['Petto']);
        const withGambe = buildWorkout('2026-01-02', '2026-01-02T00:00:00.000Z', ['Gambe']);
        await saveWorkout(withPetto);
        await saveWorkout(withGambe);
        const history = useWorkoutHistory();
        await history.reload();

        history.groupFilter.value = 'Petto';

        expect(history.previousEntries.value.map((workout) => workout.id)).toEqual([withPetto.id]);
    });
});

describe('bozza in corso e ultima giornata completata', () => {
    it('espone la bozza e la giornata completata più recenti', async () => {
        const oldDraft = buildWorkout('2026-01-01', '2026-01-01T00:00:00.000Z', ['Gambe'], 'draft');
        const recentDraft = buildWorkout('2026-01-05', '2026-01-05T00:00:00.000Z', ['Petto'], 'draft');
        const recentCompleted = buildWorkout('2026-01-04', '2026-01-04T00:00:00.000Z', ['Schiena'], 'completed');
        await saveWorkout(oldDraft);
        await saveWorkout(recentDraft);
        await saveWorkout(recentCompleted);
        const history = useWorkoutHistory();

        await history.reload();

        expect(history.currentDraft.value?.id).toBe(recentDraft.id);
        expect(history.lastCompletedWorkout.value?.id).toBe(recentCompleted.id);
    });

    it('non propone nulla quando non esiste una bozza o una giornata completata', async () => {
        const history = useWorkoutHistory();

        await history.reload();

        expect(history.currentDraft.value).toBeUndefined();
        expect(history.lastCompletedWorkout.value).toBeUndefined();
    });
});

describe('eliminazione', () => {
    it('rimuove la giornata dal database e ricarica l elenco', async () => {
        const workout = buildWorkout('2026-01-01', '2026-01-01T00:00:00.000Z', ['Petto']);
        await saveWorkout(workout);
        const history = useWorkoutHistory();
        await history.reload();

        await history.remove(workout.id);

        expect(await findWorkoutById(workout.id)).toBeUndefined();
        expect(history.allWorkouts.value).toEqual([]);
    });
});

describe('candidati alla copia', () => {
    it('propone le ultime 20 giornate dalla più recente, bozze incluse', async () => {
        for (let day = 1; day <= 25; day += 1) {
            const date = `2026-01-${String(day).padStart(2, '0')}`;
            await saveWorkout(buildWorkout(date, `${date}T00:00:00.000Z`, [], 'draft'));
        }
        const history = useWorkoutHistory();

        await history.reload();

        expect(history.copyCandidates.value).toHaveLength(20);
        expect(history.copyCandidates.value[0]?.workoutDate).toBe('2026-01-25');
        expect(history.copyCandidates.value.every((workout) => workout.status === 'draft')).toBe(true);
    });
});
