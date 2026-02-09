
import { describe, it, expect } from 'vitest';
import { calculateMinMaxScaling, calculateStatDistributions, playerToPercentiles } from '../../js/radar_chart.js';

describe('Radar Chart Min-Max Logic', () => {

    describe('calculateMinMaxScaling', () => {
        it('should scale values correctly (Standard)', () => {
            // Min=0, Max=100, Value=50 -> 50%
            expect(calculateMinMaxScaling(50, 0, 100)).toBe(50);

            // Min=10, Max=20, Value=15 -> 50%
            expect(calculateMinMaxScaling(15, 10, 20)).toBe(50);

            // Min=10, Max=20, Value=20 -> 100%
            expect(calculateMinMaxScaling(20, 10, 20)).toBe(100);
        });

        it('should scale values correctly (Inverted)', () => {
            // Lower is better. Min=10 (best), Max=50 (worst). Value=10.
            // Inverted Logic: (Max - Value) / (Max - Min) * 100
            // (50 - 10) / (50 - 10) = 1 * 100 = 100% (The best value gets 100%)
            expect(calculateMinMaxScaling(10, 10, 50, true)).toBe(100);

            // Value=50 (worst)
            // (50 - 50) / 40 = 0%
            expect(calculateMinMaxScaling(50, 10, 50, true)).toBe(0);

            // Value=30 (middle)
            // (50 - 30) / 40 = 20 / 40 = 50%
            expect(calculateMinMaxScaling(30, 10, 50, true)).toBe(50);
        });

        it('should clamp values outside range', () => {
            // Value 200, Range 0-100 -> 100
            expect(calculateMinMaxScaling(200, 0, 100)).toBe(100);

            // Value -50, Range 0-100 -> 0
            expect(calculateMinMaxScaling(-50, 0, 100)).toBe(0);
        });
    });

    describe('Integration with Distributions', () => {
        const mockAxes = [
            { key: 'goals', label: 'Goals', inverted: false },
            { key: 'errors', label: 'Errors', inverted: true }
        ];

        const mockPlayers = [
            { goals: 0, errors: 5 },  // Worst goals, Worst errors
            { goals: 5, errors: 2 },
            { goals: 10, errors: 0 }  // Best goals, Best errors
        ];

        it('should calculate correct min/max distributions', () => {
            const dists = calculateStatDistributions(mockPlayers, mockAxes);

            expect(dists.goals.min).toBe(0);
            expect(dists.goals.max).toBe(10);

            expect(dists.errors.min).toBe(0);
            expect(dists.errors.max).toBe(5);
        });

        it('should map player to scaled values', () => {
            const dists = calculateStatDistributions(mockPlayers, mockAxes);
            const midPlayer = mockPlayers[1]; // 5 goals, 2 errors

            const scaled = playerToPercentiles(midPlayer, mockAxes, dists);

            // Goals: 5 in 0-10 range -> 50%
            expect(scaled[0]).toBe(50);

            // Errors: 2 in 0-5 range (Inverted). 
            // Better to have 0 errors. 5 is worst.
            // (5 - 2) / (5 - 0) = 3/5 = 60%
            expect(scaled[1]).toBe(60);
        });
    });

});
