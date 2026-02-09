import { describe, it, expect } from 'vitest';
import { calculateSimilarity, sanitizeInput } from '../../../js/utils/utils.js';

describe('Utils', () => {

    describe('calculateSimilarity', () => {
        it('should return 1 for identical strings', () => {
            expect(calculateSimilarity('abc', 'abc')).toBe(1);
        });

        it('should return 0 for completely different strings properly?', () => {
            // Levenshtein of 'abc' and 'def' is 3. Max length is 3. (3-3)/3 = 0.
            expect(calculateSimilarity('abc', 'def')).toBe(0);
        });

        it('should return a high score for similar strings', () => {
            // 'test' vs 'tent' -> dist 1. len 4. (4-1)/4 = 0.75
            expect(calculateSimilarity('test', 'tent')).toBe(0.75);
        });

        it('should be case sensitive (implementation is case sensitive currently)', () => {
            // 'Test' vs 'test' -> dist 1.
            expect(calculateSimilarity('Test', 'test')).not.toBe(1);
        });
    });

    describe('sanitizeInput', () => {
        it('should remove HTML tags', () => {
            const input = '<script>alert("xss")</script>Hello';
            expect(sanitizeInput(input)).toBe('scriptalert("xss")/scriptHello'); // simple replace < >
        });
    });
});
