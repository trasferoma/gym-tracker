import type { ExerciseClusterKind } from '@/domain/workout';

const KIND_LABELS: Readonly<Record<ExerciseClusterKind, string>> = {
    single: 'Singolo',
    superset: 'Superserie',
    circuit: 'Circuito'
};

export function formatClusterKind(kind: ExerciseClusterKind): string {
    return KIND_LABELS[kind];
}

export function formatRestAfterRoundLabel(kind: ExerciseClusterKind): string {
    return kind === 'single' ? 'Recupero fra le serie' : 'Recupero a fine giro';
}

export function formatRestAfterRoundShortLabel(kind: ExerciseClusterKind): string {
    return kind === 'single' ? 'fra serie' : 'fine giro';
}

export function formatRestBetweenExercisesLabel(): string {
    return 'Recupero fra esercizi';
}

export function formatRestBetweenExercisesShortLabel(): string {
    return 'fra esercizi';
}
