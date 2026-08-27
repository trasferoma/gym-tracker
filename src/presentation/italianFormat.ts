import { parseLocalDate } from '@/domain/localDate';
import { countWorkout } from '@/domain/workoutCounts';
import type { Workout } from '@/domain/workout';

const shortDayFormatter = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const longDayFormatter = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const compactDayFormatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

function formatShortDay(date: Date): string {
    return shortDayFormatter.format(date);
}

function formatLongDay(date: Date): string {
    return longDayFormatter.format(date);
}

function formatCompactDay(date: Date): string {
    return compactDayFormatter.format(date);
}

export function formatWorkoutDayShort(workoutDate: string): string {
    const date = parseLocalDate(workoutDate);
    return formatShortDay(date);
}

export function formatWorkoutDayLong(workoutDate: string): string {
    const date = parseLocalDate(workoutDate);
    return formatLongDay(date);
}

export function formatWorkoutDayCompact(workoutDate: string): string {
    const date = parseLocalDate(workoutDate);
    return formatCompactDay(date);
}

export function formatWeight(weight: number): string {
    return Number.isInteger(weight) ? String(weight) : String(weight).replace('.', ',');
}

export function formatCount(count: number, singular: string, plural: string): string {
    const label = count === 1 ? singular : plural;
    return `${count} ${label}`;
}

export function describeWorkoutDeletion(workout: Workout): string {
    const counts = countWorkout(workout);
    const dayLabel = formatWorkoutDayLong(workout.workoutDate);
    const exercisesLabel = formatCount(counts.exercises, 'esercizio', 'esercizi');
    const setsLabel = formatCount(counts.sets, 'serie', 'serie');
    return `${dayLabel} - ${exercisesLabel}, ${setsLabel}. Operazione non reversibile.`;
}

export function describeAllDataLoss(workoutCount: number, exerciseCount: number, setCount: number): string {
    const workoutsLabel = formatCount(workoutCount, 'allenamento', 'allenamenti');
    const exercisesLabel = formatCount(exerciseCount, 'esercizio', 'esercizi');
    const setsLabel = formatCount(setCount, 'serie', 'serie');
    return `Perderai ${workoutsLabel}, ${exercisesLabel}, ${setsLabel}. Esporta un backup prima di continuare, se vuoi conservarli.`;
}
