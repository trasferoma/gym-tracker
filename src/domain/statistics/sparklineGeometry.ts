export interface SparklineDimensions {
    readonly width: number;
    readonly height: number;
    readonly leftMargin: number;
    readonly rightMargin: number;
    readonly topMargin: number;
    readonly bottomMargin: number;
}

export const DEFAULT_SPARKLINE_DIMENSIONS: SparklineDimensions = {
    width: 320,
    height: 120,
    leftMargin: 30,
    rightMargin: 6,
    topMargin: 8,
    bottomMargin: 20
};

export interface WeightScale {
    readonly minWeight: number;
    readonly maxWeight: number;
}

export interface SparklinePoint {
    readonly x: number;
    readonly y: number;
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

const RANGE_PADDING_RATIO = 0.18;
const MINIMUM_RANGE_WHEN_FLAT = 1;
const GRID_LINE_FRACTIONS: readonly number[] = [0, 0.5, 1];

export function computeWeightScale(weights: readonly number[]): WeightScale {
    if (weights.length === 0) {
        return { minWeight: 0, maxWeight: 1 };
    }
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    const flatWeights = rawMax === rawMin;
    const widenedMax = flatWeights ? rawMin + MINIMUM_RANGE_WHEN_FLAT : rawMax;
    const padding = (widenedMax - rawMin) * RANGE_PADDING_RATIO;
    return { minWeight: rawMin - padding, maxWeight: widenedMax + padding };
}

export function computeSessionX(
        sessionIndex: number, sessionCount: number, dimensions: SparklineDimensions = DEFAULT_SPARKLINE_DIMENSIONS
): number {
    const plotWidth = dimensions.width - dimensions.leftMargin - dimensions.rightMargin;
    if (sessionCount <= 1) {
        return dimensions.leftMargin + plotWidth / 2;
    }
    return dimensions.leftMargin + (sessionIndex * plotWidth) / (sessionCount - 1);
}

export function computeWeightY(
        weight: number, scale: WeightScale, dimensions: SparklineDimensions = DEFAULT_SPARKLINE_DIMENSIONS
): number {
    const plotHeight = dimensions.height - dimensions.topMargin - dimensions.bottomMargin;
    const range = scale.maxWeight - scale.minWeight;
    if (range === 0) {
        return dimensions.topMargin + plotHeight / 2;
    }
    const normalizedPosition = 1 - (weight - scale.minWeight) / range;
    return dimensions.topMargin + plotHeight * normalizedPosition;
}

export function computeWeightGridLines(
        scale: WeightScale, dimensions: SparklineDimensions = DEFAULT_SPARKLINE_DIMENSIONS
): readonly WeightGridLine[] {
    return GRID_LINE_FRACTIONS.map((fraction) => buildWeightGridLine(scale, fraction, dimensions));
}

export function buildSparklineChart(
        sessionWeights: readonly (readonly number[])[],
        dimensions: SparklineDimensions = DEFAULT_SPARKLINE_DIMENSIONS
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
        points.push({ x, y });
    });
    return { setIndex, points };
}
