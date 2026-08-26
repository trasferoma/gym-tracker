import { describe, expect, it } from 'vitest';

import {
    buildSparklineChart,
    computeSessionX,
    computeWeightGridLines,
    computeWeightScale,
    computeWeightY,
    DEFAULT_SPARKLINE_DIMENSIONS
} from './sparklineGeometry';

describe('computeSessionX', () => {
    it('centra il punto quando c è una sola sessione', () => {
        const x = computeSessionX(0, 1);

        const plotWidth = DEFAULT_SPARKLINE_DIMENSIONS.width
                - DEFAULT_SPARKLINE_DIMENSIONS.leftMargin - DEFAULT_SPARKLINE_DIMENSIONS.rightMargin;
        expect(x).toBe(DEFAULT_SPARKLINE_DIMENSIONS.leftMargin + plotWidth / 2);
    });

    it('distribuisce le sessioni dal margine sinistro al margine destro', () => {
        const first = computeSessionX(0, 3);
        const last = computeSessionX(2, 3);

        expect(first).toBe(DEFAULT_SPARKLINE_DIMENSIONS.leftMargin);
        expect(last).toBe(DEFAULT_SPARKLINE_DIMENSIONS.width - DEFAULT_SPARKLINE_DIMENSIONS.rightMargin);
    });
});

describe('computeWeightScale', () => {
    it('garantisce una banda verticale minima quando tutti i pesi sono uguali', () => {
        const scale = computeWeightScale([20, 20, 20]);

        expect(scale.maxWeight).toBeGreaterThan(scale.minWeight);
        expect(scale.maxWeight - scale.minWeight).toBeCloseTo(1.36, 5);
    });

    it('aggiunge un margine proporzionale quando i pesi variano', () => {
        const scale = computeWeightScale([10, 20]);

        expect(scale.minWeight).toBeLessThan(10);
        expect(scale.maxWeight).toBeGreaterThan(20);
    });
});

describe('computeWeightY', () => {
    it('non divide per zero quando la scala è degenere', () => {
        const y = computeWeightY(20, { minWeight: 20, maxWeight: 20 });

        expect(Number.isFinite(y)).toBe(true);
    });

    it('posiziona i pesi più alti più in alto nel disegno (y minore)', () => {
        const scale = computeWeightScale([10, 20]);

        const yForLowWeight = computeWeightY(10, scale);
        const yForHighWeight = computeWeightY(20, scale);

        expect(yForHighWeight).toBeLessThan(yForLowWeight);
    });
});

describe('computeWeightGridLines', () => {
    it('produce tre linee al minimo, al centro e al massimo della scala', () => {
        const scale = { minWeight: 10, maxWeight: 20 };

        const gridLines = computeWeightGridLines(scale);

        expect(gridLines.map((line) => line.weight)).toEqual([10, 15, 20]);
    });

    it('non divide per zero quando la scala è degenere', () => {
        const gridLines = computeWeightGridLines({ minWeight: 20, maxWeight: 20 });

        expect(gridLines.every((line) => Number.isFinite(line.y))).toBe(true);
    });
});

describe('buildSparklineChart', () => {
    it('include le linee guida della scala del peso', () => {
        const chart = buildSparklineChart([[10], [20]]);

        expect(chart.gridLines).toHaveLength(3);
    });


    it('non divide per zero con una sola sessione e centra il punto', () => {
        const chart = buildSparklineChart([[20]]);

        expect(chart.series).toHaveLength(1);
        expect(chart.series[0]!.points).toHaveLength(1);
        expect(Number.isFinite(chart.series[0]!.points[0]!.x)).toBe(true);
        expect(Number.isFinite(chart.series[0]!.points[0]!.y)).toBe(true);
    });

    it('non divide per zero quando tutti i pesi sono uguali', () => {
        const chart = buildSparklineChart([[20, 20], [20, 20], [20, 20]]);

        for (const series of chart.series) {
            for (const point of series.points) {
                expect(Number.isFinite(point.x)).toBe(true);
                expect(Number.isFinite(point.y)).toBe(true);
            }
        }
    });

    it('crea una serie per ogni posizione di serie, in ordine cronologico da sinistra a destra', () => {
        const chart = buildSparklineChart([[20, 22], [22, 24], [24, 26]]);

        expect(chart.series).toHaveLength(2);
        const firstSeriesXs = chart.series[0]!.points.map((point) => point.x);
        expect(firstSeriesXs).toEqual([...firstSeriesXs].sort((a, b) => a - b));
    });

    it('salta le sessioni prive di quella posizione di serie', () => {
        const chart = buildSparklineChart([[20, 22], [21]]);

        expect(chart.series).toHaveLength(2);
        expect(chart.series[1]!.points).toHaveLength(1);
    });
});
