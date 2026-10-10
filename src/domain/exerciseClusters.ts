import { reindexPositions, reorderByPosition, type ReorderDirection } from './positions';
import type { Exercise, ExerciseCluster, ExerciseClusterKind, MuscleGroupWorkout } from './workout';
import { createExercise, createExerciseCluster } from './workoutFactory';

const MIN_MULTIPLE_CLUSTER_EXERCISES = 2;
const CLUSTER_COLOR_SLOT_COUNT = 4;

export function isMultipleCluster(cluster: ExerciseCluster): boolean {
    return cluster.kind !== 'single';
}

export function findClusterColorSlot(
        clusters: readonly ExerciseCluster[], clusterId: string): number | undefined {
    const multipleClusters = clusters.filter(isMultipleCluster);
    const multipleIndex = multipleClusters.findIndex((cluster) => cluster.id === clusterId);
    return multipleIndex < 0 ? undefined : multipleIndex % CLUSTER_COLOR_SLOT_COUNT;
}

export function listGroupExercises(group: MuscleGroupWorkout): readonly Exercise[] {
    return group.clusters.flatMap(cluster => cluster.exercises);
}

export function wrapExercisesInSingleClusters(exercises: readonly Exercise[]): readonly ExerciseCluster[] {
    return exercises.map((exercise, index) => createExerciseCluster(exercise, index));
}

export function checkClusterInvariants(clusters: readonly ExerciseCluster[]): string | undefined {
    const violations = clusters
        .map(describeInvariantViolation)
        .filter((reason): reason is string => reason !== undefined);
    return violations[0];
}

export function linkClusterToNext(
        clusters: readonly ExerciseCluster[], clusterId: string): readonly ExerciseCluster[] {
    const upper = findCluster(clusters, clusterId);
    const lower = findNextCluster(clusters, upper);
    const merged = mergeClusters(upper, lower);
    const withoutLower = clusters.filter((candidate) => candidate.id !== lower.id);
    const withMerged = replaceCluster(withoutLower, merged);
    return reindexPositions(withMerged);
}

export function detachExercise(
        clusters: readonly ExerciseCluster[], exerciseId: string): readonly ExerciseCluster[] {
    const cluster = findClusterOfExercise(clusters, exerciseId);
    requireMultipleCluster(cluster, 'Solo un esercizio di una superserie o di un circuito si può staccare');
    const exercise = findExercise(cluster, exerciseId);
    const remainingExercises = cluster.exercises.filter((candidate) => candidate.id !== exerciseId);
    const shrunkCluster = shrinkCluster(cluster, remainingExercises);
    const standaloneCluster = createExerciseCluster(exercise, 0);
    const detachedCluster = { ...standaloneCluster, restAfterRoundSeconds: cluster.restAfterRoundSeconds };
    const withShrunk = replaceCluster(clusters, shrunkCluster);
    const withDetached = insertClusterAfter(withShrunk, cluster.id, detachedCluster);
    return reindexPositions(withDetached);
}

export function changeClusterKind(
        clusters: readonly ExerciseCluster[], clusterId: string,
        kind: ExerciseClusterKind): readonly ExerciseCluster[] {
    if (kind === 'single') {
        throw new Error('Il tipo di un raggruppamento multiplo non può diventare singolo.');
    }
    return updateCluster(clusters, clusterId, (cluster) => {
        requireMultipleCluster(cluster, 'Il tipo di un esercizio singolo non si cambia');
        return { ...cluster, kind };
    });
}

export function updateClusterRestAfterRound(
        clusters: readonly ExerciseCluster[], clusterId: string, seconds: number): readonly ExerciseCluster[] {
    requireRestSeconds(seconds);
    return updateCluster(clusters, clusterId, (cluster) => ({ ...cluster, restAfterRoundSeconds: seconds }));
}

export function updateClusterRestBetweenExercises(
        clusters: readonly ExerciseCluster[], clusterId: string, seconds: number): readonly ExerciseCluster[] {
    requireRestSeconds(seconds);
    return updateCluster(clusters, clusterId, (cluster) => ({ ...cluster, restBetweenExercisesSeconds: seconds }));
}

export function reorderCluster(
        clusters: readonly ExerciseCluster[], clusterId: string,
        direction: ReorderDirection): readonly ExerciseCluster[] {
    return reorderByPosition(clusters, clusterId, direction);
}

export function addExerciseToCluster(
        clusters: readonly ExerciseCluster[], clusterId: string, name: string): readonly ExerciseCluster[] {
    return updateCluster(clusters, clusterId, (cluster) => {
        requireMultipleCluster(cluster, 'Si può aggiungere un esercizio solo a una superserie o a un circuito');
        const newExercise = createExercise(name, cluster.exercises.length);
        const exercises = reindexPositions([...cluster.exercises, newExercise]);
        return withExercises(cluster, exercises);
    });
}

export function removeExerciseFromClusters(
        clusters: readonly ExerciseCluster[], exerciseId: string): readonly ExerciseCluster[] {
    const cluster = findClusterOfExercise(clusters, exerciseId);
    const remainingExercises = cluster.exercises.filter((exercise) => exercise.id !== exerciseId);
    if (remainingExercises.length === 0) {
        const withoutCluster = clusters.filter((candidate) => candidate.id !== cluster.id);
        return reindexPositions(withoutCluster);
    }
    const shrunkCluster = shrinkCluster(cluster, remainingExercises);
    const withShrunk = replaceCluster(clusters, shrunkCluster);
    return reindexPositions(withShrunk);
}

export function reorderExerciseWithinCluster(
        clusters: readonly ExerciseCluster[], exerciseId: string,
        direction: ReorderDirection): readonly ExerciseCluster[] {
    const cluster = findClusterOfExercise(clusters, exerciseId);
    const exercises = reorderByPosition(cluster.exercises, exerciseId, direction);
    const reorderedCluster = withExercises(cluster, exercises);
    return replaceCluster(clusters, reorderedCluster);
}

export function updateExerciseInClusters(
        clusters: readonly ExerciseCluster[], exerciseId: string,
        updater: (exercise: Exercise) => Exercise): readonly ExerciseCluster[] {
    const cluster = findClusterOfExercise(clusters, exerciseId);
    const exercises = cluster.exercises.map((candidate) => (
        candidate.id === exerciseId ? updater(candidate) : candidate
    ));
    const updatedCluster = withExercises(cluster, exercises);
    return replaceCluster(clusters, updatedCluster);
}

function describeInvariantViolation(cluster: ExerciseCluster): string | undefined {
    const exerciseCount = cluster.exercises.length;
    if (exerciseCount === 0) {
        return 'Un raggruppamento non contiene esercizi.';
    }
    if (!isMultipleCluster(cluster)) {
        return exerciseCount === 1 ? undefined : 'Un esercizio singolo non può contenere più di un esercizio.';
    }
    return exerciseCount >= MIN_MULTIPLE_CLUSTER_EXERCISES
        ? undefined
        : 'Una superserie o un circuito richiede almeno due esercizi.';
}

function requireMultipleCluster(cluster: ExerciseCluster, message: string): void {
    if (!isMultipleCluster(cluster)) {
        throw new Error(`${message}: ${cluster.id}`);
    }
}

function requireRestSeconds(seconds: number): void {
    if (!Number.isInteger(seconds) || seconds < 0) {
        throw new Error(`I secondi di recupero devono essere un intero maggiore o uguale a zero: ${seconds}`);
    }
}

function findCluster(clusters: readonly ExerciseCluster[], clusterId: string): ExerciseCluster {
    const cluster = clusters.find((candidate) => candidate.id === clusterId);
    if (!cluster) {
        throw new Error(`Raggruppamento non trovato: ${clusterId}`);
    }
    return cluster;
}

function findNextCluster(clusters: readonly ExerciseCluster[], cluster: ExerciseCluster): ExerciseCluster {
    const nextCluster = clusters[clusters.indexOf(cluster) + 1];
    if (!nextCluster) {
        throw new Error(`Nessun raggruppamento successivo a: ${cluster.id}`);
    }
    return nextCluster;
}

function findClusterOfExercise(clusters: readonly ExerciseCluster[], exerciseId: string): ExerciseCluster {
    const cluster = clusters.find((candidate) => (
        candidate.exercises.some((exercise) => exercise.id === exerciseId)
    ));
    if (!cluster) {
        throw new Error(`Esercizio non trovato: ${exerciseId}`);
    }
    return cluster;
}

function findExercise(cluster: ExerciseCluster, exerciseId: string): Exercise {
    const exercise = cluster.exercises.find((candidate) => candidate.id === exerciseId);
    if (!exercise) {
        throw new Error(`Esercizio non trovato: ${exerciseId}`);
    }
    return exercise;
}

function mergeClusters(upper: ExerciseCluster, lower: ExerciseCluster): ExerciseCluster {
    const base = pickMergeBase(upper, lower);
    const exercises = reindexPositions([...upper.exercises, ...lower.exercises]);
    return { ...base, id: upper.id, exercises };
}

function pickMergeBase(upper: ExerciseCluster, lower: ExerciseCluster): ExerciseCluster {
    if (isMultipleCluster(upper)) {
        return upper;
    }
    if (isMultipleCluster(lower)) {
        return lower;
    }
    return { ...upper, kind: 'superset' };
}

function shrinkCluster(cluster: ExerciseCluster, remainingExercises: readonly Exercise[]): ExerciseCluster {
    const exercises = reindexPositions(remainingExercises);
    const isLeftAlone = exercises.length === 1;
    return { ...cluster, kind: isLeftAlone ? 'single' : cluster.kind, exercises };
}

function withExercises(cluster: ExerciseCluster, exercises: readonly Exercise[]): ExerciseCluster {
    return { ...cluster, exercises };
}

function replaceCluster(
        clusters: readonly ExerciseCluster[], updatedCluster: ExerciseCluster): readonly ExerciseCluster[] {
    return clusters.map((candidate) => (candidate.id === updatedCluster.id ? updatedCluster : candidate));
}

function updateCluster(
        clusters: readonly ExerciseCluster[], clusterId: string,
        updater: (cluster: ExerciseCluster) => ExerciseCluster): readonly ExerciseCluster[] {
    const cluster = findCluster(clusters, clusterId);
    const updatedCluster = updater(cluster);
    return replaceCluster(clusters, updatedCluster);
}

function insertClusterAfter(
        clusters: readonly ExerciseCluster[], anchorId: string,
        insertedCluster: ExerciseCluster): readonly ExerciseCluster[] {
    const insertionIndex = clusters.findIndex((candidate) => candidate.id === anchorId) + 1;
    return [...clusters.slice(0, insertionIndex), insertedCluster, ...clusters.slice(insertionIndex)];
}
