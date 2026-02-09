import { describe, it, expect } from 'vitest';
import { StatCalculator } from '../../../js/logic/StatCalculator.js';

describe('StatCalculator', () => {

    it('should calculate basic per 90 stats', () => {
        const player = {
            name: 'Test Player',
            Minutes: 900,
            Shots: 10,
            npxG: 1.0,
            xA: 2.0
        };
        const teamStats = {};
        const mergedPlayers = [player];

        const computed = StatCalculator.calculate(player, teamStats, mergedPlayers);

        expect(computed['Shots/90']).toBe(1.0); // 10 / (900/90) = 1
        expect(computed['npxG/90']).toBe(0.1);
        expect(computed['xA/90']).toBe(0.2);
    });

    it('should fallback to calculating Minutes from M/Strt and Starts', () => {
        const player = {
            name: 'Fallback Player',
            Starts: 10,
            'M/Strt': 80
        };
        const computed = StatCalculator.calculate(player, {}, []);
        expect(computed.minutes).toBe(800);
    });

    it('should handle zero minutes to avoid division by zero', () => {
        const player = {
            name: 'Bencher',
            Minutes: 0,
            Shots: 5
        };
        const computed = StatCalculator.calculate(player, {}, []);
        expect(computed['Shots/90']).toBe(0);
    });

    it('should append team stats if available', () => {
        const player = { name: 'P', team: 'Arsenal' };
        const teamStats = {
            'Arsenal': { 'xG Conceded': 10, 'Shots Conceded': 100 }
        };
        const computed = StatCalculator.calculate(player, teamStats, []);
        expect(computed['xGC (Team)']).toBe(10);
        expect(computed['Shots Conc']).toBe(100);
        expect(computed['xG/Shot C']).toBe(0.1); // 10/100
    });
});
