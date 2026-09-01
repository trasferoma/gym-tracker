import { isValidLocalDate } from '@/domain/localDate';
import type { SetIssueLevel } from '@/domain/setIssue';
import type { Exercise, ExerciseSet, MuscleGroupWorkout, Workout, WorkoutStatus } from '@/domain/workout';
import { BACKUP_FORMAT_VERSION, type BackupFile } from './backupFormat';

export type BackupValidationResult =
    | { readonly valid: true; readonly backup: BackupFile }
    | { readonly valid: false; readonly reason: string };

export function validateBackupFile(input: unknown): BackupValidationResult {
    try {
        const backup = parseBackupFile(input);
        return { valid: true, backup };
    } catch (error) {
        if (error instanceof BackupValidationError) {
            return { valid: false, reason: error.message };
        }
        throw error;
    }
}

class BackupValidationError extends Error {}

function fail(reason: string): never {
    throw new BackupValidationError(reason);
}

function parseBackupFile(input: unknown): BackupFile {
    const file = requireRecord(input, 'Il file');
    requireExactFormatVersion(file.formatVersion);
    const exportedAt = requireNonEmptyString(file.exportedAt, 'La data di esportazione (exportedAt)');
    const rawWorkouts = requireArray(file.workouts, 'L\'elenco degli allenamenti (workouts)');
    const workouts = rawWorkouts.map((rawWorkout, index) => parseWorkout(rawWorkout, index));
    return { formatVersion: BACKUP_FORMAT_VERSION, exportedAt, workouts };
}

function parseWorkout(rawWorkout: unknown, index: number): Workout {
    const label = `L'allenamento in posizione ${index}`;
    const workout = requireRecord(rawWorkout, label);
    const id = requireNonEmptyString(workout.id, `${label}: id`);
    const workoutDate = requireLocalDate(workout.workoutDate, `${label}: workoutDate`);
    const status = requireWorkoutStatus(workout.status, `${label}: status`);
    const notes = requireString(workout.notes, `${label}: notes`);
    const createdAt = requireNonEmptyString(workout.createdAt, `${label}: createdAt`);
    const updatedAt = requireNonEmptyString(workout.updatedAt, `${label}: updatedAt`);
    const rawMuscleGroups = requireArray(workout.muscleGroups, `${label}: muscleGroups`);
    const muscleGroups = rawMuscleGroups.map((rawGroup, groupIndex) => parseMuscleGroup(rawGroup, label, groupIndex));
    requireContiguousPositions(muscleGroups, `${label}: muscleGroups`);
    return { id, workoutDate, status, notes, muscleGroups, createdAt, updatedAt };
}

function parseMuscleGroup(rawGroup: unknown, workoutLabel: string, index: number): MuscleGroupWorkout {
    const label = `${workoutLabel}, gruppo in posizione ${index}`;
    const group = requireRecord(rawGroup, label);
    const id = requireNonEmptyString(group.id, `${label}: id`);
    const name = requireNonEmptyString(group.name, `${label}: name`);
    const position = requireFiniteNumber(group.position, `${label}: position`);
    const rawExercises = requireArray(group.exercises, `${label}: exercises`);
    const exercises = rawExercises.map((rawExercise, exerciseIndex) => parseExercise(rawExercise, label, exerciseIndex));
    requireContiguousPositions(exercises, `${label}: exercises`);
    return { id, name, position, exercises };
}

function parseExercise(rawExercise: unknown, groupLabel: string, index: number): Exercise {
    const label = `${groupLabel}, esercizio in posizione ${index}`;
    const exercise = requireRecord(rawExercise, label);
    const id = requireNonEmptyString(exercise.id, `${label}: id`);
    const name = requireNonEmptyString(exercise.name, `${label}: name`);
    const position = requireFiniteNumber(exercise.position, `${label}: position`);
    const notes = requireString(exercise.notes, `${label}: notes`);
    const rawSets = requireArray(exercise.sets, `${label}: sets`);
    const sets = rawSets.map((rawSet, setIndex) => parseExerciseSet(rawSet, label, setIndex));
    requireContiguousPositions(sets, `${label}: sets`);
    return { id, name, position, notes, sets };
}

function parseExerciseSet(rawSet: unknown, exerciseLabel: string, index: number): ExerciseSet {
    const label = `${exerciseLabel}, serie in posizione ${index}`;
    const set = requireRecord(rawSet, label);
    const id = requireNonEmptyString(set.id, `${label}: id`);
    const position = requireFiniteNumber(set.position, `${label}: position`);
    const repetitions = requirePositiveInteger(set.repetitions, `${label}: repetitions`);
    const weight = requireNonNegativeNumber(set.weight, `${label}: weight`);
    const completed = requireBoolean(set.completed, `${label}: completed`);
    const notes = requireString(set.notes, `${label}: notes`);
    const issue = requireOptionalSetIssueLevel(set.issue, `${label}: issue`);
    return issue === undefined
            ? { id, position, repetitions, weight, completed, notes }
            : { id, position, repetitions, weight, completed, notes, issue };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
    if (!isRecord(value)) {
        fail(`${label} deve essere un oggetto JSON valido.`);
    }
    return value;
}

function requireArray(value: unknown, label: string): readonly unknown[] {
    if (!Array.isArray(value)) {
        fail(`${label} deve essere un elenco.`);
    }
    return value;
}

function requireString(value: unknown, label: string): string {
    if (typeof value !== 'string') {
        fail(`${label} deve essere un testo.`);
    }
    return value;
}

function requireNonEmptyString(value: unknown, label: string): string {
    const text = requireString(value, label);
    if (text.length === 0) {
        fail(`${label} non può essere vuoto.`);
    }
    return text;
}

function requireBoolean(value: unknown, label: string): boolean {
    if (typeof value !== 'boolean') {
        fail(`${label} deve essere un valore booleano.`);
    }
    return value;
}

function requireFiniteNumber(value: unknown, label: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        fail(`${label} deve essere un numero.`);
    }
    return value;
}

function requirePositiveInteger(value: unknown, label: string): number {
    const numericValue = requireFiniteNumber(value, label);
    if (!Number.isInteger(numericValue) || numericValue <= 0) {
        fail(`${label} deve essere un numero intero maggiore di zero.`);
    }
    return numericValue;
}

function requireNonNegativeNumber(value: unknown, label: string): number {
    const numericValue = requireFiniteNumber(value, label);
    if (numericValue < 0) {
        fail(`${label} non può essere negativo.`);
    }
    return numericValue;
}

function requireLocalDate(value: unknown, label: string): string {
    const text = requireNonEmptyString(value, label);
    if (!isValidLocalDate(text)) {
        fail(`${label} deve essere una data locale valida in formato YYYY-MM-DD.`);
    }
    return text;
}

function requireWorkoutStatus(value: unknown, label: string): WorkoutStatus {
    const text = requireNonEmptyString(value, label);
    if (text !== 'draft' && text !== 'completed') {
        fail(`${label} deve essere "draft" o "completed".`);
    }
    return text;
}

function requireOptionalSetIssueLevel(value: unknown, label: string): SetIssueLevel | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value !== 'warning' && value !== 'critical') {
        fail(`${label} deve essere assente, "warning" o "critical".`);
    }
    return value;
}

function requireExactFormatVersion(value: unknown): void {
    if (value !== BACKUP_FORMAT_VERSION) {
        fail(`Versione del formato non supportata: attesa ${BACKUP_FORMAT_VERSION}, trovata ${JSON.stringify(value)}.`);
    }
}

function requireContiguousPositions(items: readonly { readonly position: number }[], label: string): void {
    const positionsAreContiguous = items.every((item, index) => item.position === index);
    if (!positionsAreContiguous) {
        fail(`${label}: le posizioni devono essere contigue a partire da 0.`);
    }
}
