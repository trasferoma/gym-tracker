export interface SparklineDimensions {
    readonly width: number;
    readonly height: number;
    readonly leftMargin: number;
    readonly rightMargin: number;
    readonly topMargin: number;
    readonly bottomMargin: number;
}

export const MINI_SPARKLINE_DIMENSIONS: SparklineDimensions = {
    width: 200,
    height: 62,
    leftMargin: 28,
    rightMargin: 6,
    topMargin: 13,
    bottomMargin: 15
};

export interface WeightScale {
    readonly minWeight: number;
    readonly maxWeight: number;
}

export interface SparklinePoint {
    readonly x: number;
    readonly y: number;
    readonly weight: number;
}

export interface SparklineSeries {
    readonly setIndex: number;
    readonly points: readonly SparklinePoint[];
}

export interface WeightGridLine {
    readonly weight: number;
    readonly y: number;
}

export interface SparklineChart {
    readonly dimensions: SparklineDimensions;
    readonly scale: WeightScale;
    readonly series: readonly SparklineSeries[];
    readonly gridLines: readonly WeightGridLine[];
}

const GRID_STEPS: readonly number[] = [1, 2.5, 5, 10, 20, 25, 50, 100];
const SMALLEST_GRID_STEP = 1;
const LARGEST_GRID_STEP = 100;
const GRID_INTERVALS = 2;
const GRID_LINE_FRACTIONS: readonly number[] = [0, 0.5, 1];

export function computeWeightScale(weights: readonly number[]): WeightScale {
    if (weights.length === 0) {
        return buildScaleFrom(0, SMALLEST_GRID_STEP);
    }
    const lowestWeight = Math.min(...weights);
    const highestWeight = Math.max(...weights);
    if (lowestWeight === highestWeight) {
        return centeredScaleAround(lowestWeight);
    }
    const step = chooseGridStep(lowestWeight, highestWeight);
    const minWeight = floorToStep(lowestWeight, step);
    return buildScaleFrom(minWeight, step);
}

export function computeSessionX(
        sessionIndex: number, sessionCount: number, dimensions: SparklineDimensions
): number {
    const plotWidth = dimensions.width - dimensions.leftMargin - dimensions.rightMargin;
    if (sessionCount <= 1) {
        return dimensions.leftMargin + plotWidth / 2;
    }
    return dimensions.leftMargin + (sessionIndex * plotWidth) / (sessionCount - 1);
}

export function computeWeightY(weight: number, scale: WeightScale, dimensions: SparklineDimensions): number {
    const plotHeight = dimensions.height - dimensions.topMargin - dimensions.bottomMargin;
    const range = scale.maxWeight - scale.minWeight;
    if (range === 0) {
        return dimensions.topMargin + plotHeight / 2;
    }
    const normalizedPosition = 1 - (weight - scale.minWeight) / range;
    return dimensions.topMargin + plotHeight * normalizedPosition;
}

export function computeWeightGridLines(
        scale: WeightScale, dimensions: SparklineDimensions
): readonly WeightGridLine[] {
    return GRID_LINE_FRACTIONS.map((fraction) => buildWeightGridLine(scale, fraction, dimensions));
}

export function buildSparklineChart(
        sessionWeights: readonly (readonly number[])[], dimensions: SparklineDimensions
): SparklineChart {
    const allWeights = sessionWeights.flat();
    const scale = computeWeightScale(allWeights);
    const sessionSetCounts = sessionWeights.map((weights) => weights.length);
    const setCount = Math.max(0, ...sessionSetCounts);
    const series = Array.from(
            { length: setCount },
            (_, setIndex) => buildSparklineSeries(sessionWeights, setIndex, scale, dimensions));
    const gridLines = computeWeightGridLines(scale, dimensions);
    return { dimensions, scale, series, gridLines };
}

function buildScaleFrom(minWeight: number, step: number): WeightScale {
    return { minWeight, maxWeight: minWeight + GRID_INTERVALS * step };
}

function centeredScaleAround(weight: number): WeightScale {
    const roundedWeight = floorToStep(weight, SMALLEST_GRID_STEP);
    const minWeight = roundedWeight - SMALLEST_GRID_STEP;
    return buildScaleFrom(minWeight, SMALLEST_GRID_STEP);
}

function chooseGridStep(lowestWeight: number, highestWeight: number): number {
    const listedStep = GRID_STEPS.find((step) => coversRange(step, lowestWeight, highestWeight));
    return listedStep ?? expandStepUntilCovered(LARGEST_GRID_STEP, lowestWeight, highestWeight);
}

function expandStepUntilCovered(step: number, lowestWeight: number, highestWeight: number): number {
    if (coversRange(step, lowestWeight, highestWeight)) {
        return step;
    }
    return expandStepUntilCovered(step * 2, lowestWeight, highestWeight);
}

function coversRange(step: number, lowestWeight: number, highestWeight: number): boolean {
    const minWeight = floorToStep(lowestWeight, step);
    return minWeight + GRID_INTERVALS * step >= highestWeight;
}

function floorToStep(weight: number, step: number): number {
    return Math.floor(weight / step) * step;
}

function buildWeightGridLine(
        scale: WeightScale, fraction: number, dimensions: SparklineDimensions): WeightGridLine {
    const weight = scale.minWeight + (scale.maxWeight - scale.minWeight) * fraction;
    const y = computeWeightY(weight, scale, dimensions);
    return { weight, y };
}

function buildSparklineSeries(
        sessionWeights: readonly (readonly number[])[], setIndex: number, scale: WeightScale,
        dimensions: SparklineDimensions
): SparklineSeries {
    const points: SparklinePoint[] = [];
    sessionWeights.forEach((weights, sessionIndex) => {
        const weight = weights[setIndex];
        if (weight === undefined) {
            return;
        }
        const x = computeSessionX(sessionIndex, sessionWeights.length, dimensions);
        const y = computeWeightY(weight, scale, dimensions);
        points.push({ x, y, weight });
    });
    return { setIndex, points };
}
