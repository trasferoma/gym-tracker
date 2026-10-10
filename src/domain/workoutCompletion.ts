import { checkClusterInvariants, listGroupExercises } from './exerciseClusters';
import {
    MAX_COMPLETED_MUSCLE_GROUPS,
    MIN_COMPLETED_MUSCLE_GROUPS,
    type Exercise,
    type Workout,
    type WorkoutOperationOutcome
} from './workout';

export type CompletionEligibility =
    | { readonly eligible: true }
    | { readonly eligible: false; readonly reason: string };

export function checkCompletionEligibility(workout: Workout): CompletionEligibility {
    const groupCountEligibility = checkGroupCount(workout);
    if (!groupCountEligibility.eligible) {
        return groupCountEligibility;
    }
    const groupWithoutExercises = workout.muscleGroups.find((group) => listGroupExercises(group).length === 0);
    if (groupWithoutExercises) {
        return { eligible: false, reason: `Il gruppo "${groupWithoutExercises.name}" non ha ancora esercizi.` };
    }
    const clusterEligibility = checkClusterStructure(workout);
    if (!clusterEligibility.eligible) {
        return clusterEligibility;
    }
    const exerciseWithoutValidSet = findExerciseWithoutValidSet(workout);
    if (exerciseWithoutValidSet) {
        return { eligible: false, reason: `L'esercizio "${exerciseWithoutValidSet.name}" non ha ancora una serie valida.` };
    }
    return { eligible: true };
}

export function completeWorkout(workout: Workout): WorkoutOperationOutcome {
    const eligibility = checkCompletionEligibility(workout);
    if (!eligibility.eligible) {
        return { outcome: 'rejected', reason: eligibility.reason };
    }
    return { outcome: 'applied', workout: { ...workout, status: 'completed' } };
}

export function reopenWorkout(workout: Workout): Workout {
    return { ...workout, status: 'draft' };
}

function checkGroupCount(workout: Workout): CompletionEligibility {
    const groupCount = workout.muscleGroups.length;
    const isWithinRange = groupCount >= MIN_COMPLETED_MUSCLE_GROUPS && groupCount <= MAX_COMPLETED_MUSCLE_GROUPS;
    if (isWithinRange) {
        return { eligible: true };
    }
    return {
        eligible: false,
        reason: `Servono da ${MIN_COMPLETED_MUSCLE_GROUPS} a ${MAX_COMPLETED_MUSCLE_GROUPS} gruppi muscolari, non ${groupCount}.`
    };
}

function checkClusterStructure(workout: Workout): CompletionEligibility {
    for (const group of workout.muscleGroups) {
        const violation = checkClusterInvariants(group.clusters);
        if (violation) {
            return { eligible: false, reason: `Gruppo "${group.name}": ${violation}` };
        }
    }
    return { eligible: true };
}

function findExerciseWithoutValidSet(workout: Workout): Exercise | undefined {
    return workout.muscleGroups
            .flatMap((group) => listGroupExercises(group))
            .find((exercise) => !hasValidSet(exercise));
}

function hasValidSet(exercise: Exercise): boolean {
    return exercise.sets.some((set) => Number.isInteger(set.repetitions) && set.repetitions > 0 && set.weight >= 0);
}
