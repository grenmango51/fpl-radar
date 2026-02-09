import { describe, it, expect } from 'vitest';
import { classifyPlayer } from '../../../js/logic/PlayerClassifier.js';

describe('PlayerClassifier', () => {

    it('should classify defenders based on position string', () => {
        expect(classifyPlayer({ position: 'Defender' })).toBe('defender');
        expect(classifyPlayer({ position: 'Def' })).toBe('defender');
        expect(classifyPlayer({ position: 'Goalkeeper' })).toBe('defender');
    });

    it('should classify attackers based on position string', () => {
        expect(classifyPlayer({ position: 'Midfielder' })).toBe('attacker');
        expect(classifyPlayer({ position: 'Forward' })).toBe('attacker');
    });

    it('should fallback to cost classification if position is missing', () => {
        // Cost < 5.5 = Defender
        expect(classifyPlayer({ cost: 4.5 })).toBe('defender');
        expect(classifyPlayer({ cost: 5.0 })).toBe('defender');

        // Cost >= 5.5 = Attacker (default)
        expect(classifyPlayer({ cost: 6.0 })).toBe('attacker');
        expect(classifyPlayer({ cost: 12.0 })).toBe('attacker');
    });

    it('should default to attacker if no info provided', () => {
        expect(classifyPlayer({})).toBe('attacker');
    });
});
