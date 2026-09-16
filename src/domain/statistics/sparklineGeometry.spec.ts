import { describe, expect, it } from 'vitest';

import {
    buildSparklineChart,
    computeSessionX,
    computeWeightGridLines,
    computeWeightScale,
    computeWeightY,
    MINI_SPARKLINE_DIMENSIONS
} from './sparklineGeometry';

const dimensions = MINI_SPARKLINE_DIMENSIONS;

describe('computeSessionX', () => {
    it('centra il punto quando c è una sola sessione', () => {
        const x = computeSessionX(0, 1, dimensions);

        const plotWidth = dimensions.width - dimensions.leftMargin - dimensions.rightMargin;
        expect(x).toBe(dimensions.leftMargin + plotWidth / 2);
    });

    it('distribuisce le sessioni dal margine sinistro al margine destro', () => {
        const first = computeSessionX(0, 3, dimensions);
        const last = computeSessionX(2, 3, dimensions);

        expect(first).toBe(dimensions.leftMargin);
        expect(last).toBe(dimensions.width - dimensions.rightMargin);
    });
});

describe('computeWeightScale', () => {
    it('arrotonda la scala a valori tondi che contengono tutti i pesi', () => {
        const scale = computeWeightScale([100, 102, 105]);

        expect(scale).toEqual({ minWeight: 100, maxWeight: 105 });
    });

    it('sceglie uno step più largo quando i pesi sono più distanti', () => {
        const scale = computeWeightScale([12, 47]);

        expect(scale).toEqual({ minWeight: 0, maxWeight: 50 });
    });

    it('espande lo step oltre la lista quando la distanza è molto grande', () => {
        const scale = computeWeightScale([100, 400]);

        expect(scale.minWeight).toBeLessThanOrEqual(100);
        expect(scale.maxWeight).toBeGreaterThanOrEqual(400);
    });

    it('centra la banda verticale quando tutti i pesi sono uguali', () => {
        const scale = computeWeightScale([20, 20, 20]);

        expect(scale).toEqual({ minWeight: 19, maxWeight: 21 });
    });

    it('resta su valori tondi anche senza pesi', () => {
        const scale = computeWeightScale([]);

        expect(scale).toEqual({ minWeight: 0, maxWeight: 2 });
    });
});

describe('computeWeightY', () => {
    it('non divide per zero quando la scala è degenere', () => {
        const y = computeWeightY(20, { minWeight: 20, maxWeight: 20 }, dimensions);

        expect(Number.isFinite(y)).toBe(true);
    });

    it('posiziona i pesi più alti più in alto nel disegno (y minore)', () => {
        const scale = computeWeightScale([10, 20]);

        const yForLowWeight = computeWeightY(10, scale, dimensions);
        const yForHighWeight = computeWeightY(20, scale, dimensions);

        expect(yForHighWeight).toBeLessThan(yForLowWeight);
    });

    it('tiene i pesi dentro il disegno perché la scala arrotondata li contiene', () => {
        const scale = computeWeightScale([100, 105]);

        const yForLowWeight = computeWeightY(100, scale, dimensions);
        const yForHighWeight = computeWeightY(105, scale, dimensions);

        expect(yForHighWeight).toBeGreaterThanOrEqual(dimensions.topMargin);
        expect(yForLowWeight).toBeLessThanOrEqual(dimensions.height - dimensions.bottomMargin);
    });
});

describe('computeWeightGridLines', () => {
    it('produce tre linee al minimo, al centro e al massimo della scala', () => {
        const scale = { minWeight: 10, maxWeight: 20 };

        const gridLines = computeWeightGridLines(scale, dimensions);

        expect(gridLines.map((line) => line.weight)).toEqual([10, 15, 20]);
    });

    it('etichetta valori leggibili anche quando i pesi grezzi non sono tondi', () => {
        const scale = computeWeightScale([100, 101, 105]);

        const gridLines = computeWeightGridLines(scale, dimensions);

        expect(gridLines.map((line) => line.weight)).toEqual([100, 102.5, 105]);
    });

    it('non divide per zero quando la scala è degenere', () => {
        const gridLines = computeWeightGridLines({ minWeight: 20, maxWeight: 20 }, dimensions);

        expect(gridLines.every((line) => Number.isFinite(line.y))).toBe(true);
    });
});

describe('buildSparklineChart', () => {
    it('include le linee guida della scala del peso', () => {
        const chart = buildSparklineChart([[10], [20]], dimensions);

        expect(chart.gridLines).toHaveLength(3);
    });

    it('porta il peso dentro ogni punto', () => {
        const chart = buildSparklineChart([[20, 22], [24, 26]], dimensions);

        expect(chart.series[0]!.points.map((point) => point.weight)).toEqual([20, 24]);
        expect(chart.series[1]!.points.map((point) => point.weight)).toEqual([22, 26]);
    });

    it('non divide per zero con una sola sessione e centra il punto', () => {
        const chart = buildSparklineChart([[20]], dimensions);

        expect(chart.series).toHaveLength(1);
        expect(chart.series[0]!.points).toHaveLength(1);
        expect(Number.isFinite(chart.series[0]!.points[0]!.x)).toBe(true);
        expect(Number.isFinite(chart.series[0]!.points[0]!.y)).toBe(true);
    });

    it('non divide per zero quando tutti i pesi sono uguali', () => {
        const chart = buildSparklineChart([[20, 20], [20, 20], [20, 20]], dimensions);

        for (const series of chart.series) {
            for (const point of series.points) {
                expect(Number.isFinite(point.x)).toBe(true);
                expect(Number.isFinite(point.y)).toBe(true);
            }
        }
    });

    it('crea una serie per ogni posizione di serie, in ordine cronologico da sinistra a destra', () => {
        const chart = buildSparklineChart([[20, 22], [22, 24], [24, 26]], dimensions);

        expect(chart.series).toHaveLength(2);
        const firstSeriesXs = chart.series[0]!.points.map((point) => point.x);
        expect(firstSeriesXs).toEqual([...firstSeriesXs].sort((a, b) => a - b));
    });

    it('salta le sessioni prive di quella posizione di serie', () => {
        const chart = buildSparklineChart([[20, 22], [21]], dimensions);

        expect(chart.series).toHaveLength(2);
        expect(chart.series[1]!.points).toHaveLength(1);
    });
});
