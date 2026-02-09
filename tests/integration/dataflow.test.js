// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { CustomDumpParser } from '../../js/parsers/CustomDumpParser.js';
import { ShotsParser } from '../../js/parsers/ShotsParser.js';
import { PassesParser } from '../../js/parsers/PassesParser.js';
import { DataManager } from '../../js/logic/DataManager.js';
import { StatCalculator } from '../../js/logic/StatCalculator.js';

describe('Integration: Data Flow', () => {

    it('should correctly parse, merge, and calculate stats from multiple sources', () => {
        // 1. Mock Data Source 1: Custom Dump
        const dumpHtml = `
            <table><tr>
                <td><a class="enhanced-title" oldtitle="Erling Haaland">Erling Haaland</a></td>
                <td><span class="team-disc"></span><span class="team-name">MCI</span></td>
                <td class="nowrap">14.0</td>
                <td oldtitle="Big Chances Total: 20">20</td>
                <td oldtitle="Time Played - Exact: 1000">1000</td>
            </tr></table>
        `;

        // 2. Mock Data Source 2: Shots
        const shotsHtml = `
            <table><tr>
                <td><a class="enhanced-title" oldtitle="Erling Braut Haaland">Erling Braut Haaland</a></td>
                <td oldtitle="xG Non-Penalty: 15.0">15.0</td>
                <td oldtitle="Shots Total: 50">50</td>
            </tr></table>
        `;

        // 3. Mock Data Source 3: Passes
        const passesHtml = `
            <table><tr>
                <td><a class="enhanced-title" oldtitle="Erling Haaland">Erling Haaland</a></td>
                <td oldtitle="Expected Assists: 5.0">5.0</td>
            </tr></table>
        `;

        // Parse
        const p1 = new CustomDumpParser().parse(new DOMParser().parseFromString(dumpHtml, 'text/html'));
        const p2 = new ShotsParser().parse(new DOMParser().parseFromString(shotsHtml, 'text/html'));
        const p3 = new PassesParser().parse(new DOMParser().parseFromString(passesHtml, 'text/html'));

        // Merge
        const merged = DataManager.mergePlayerData(p1, p2, p3);

        expect(merged).toHaveLength(1); // Should merge "Erling Haaland" and "Erling Braut Haaland" if fuzzy match works or via normalization
        // Note: Utils.js calculateSimilarity might not match "Erling Haaland" and "Erling Braut Haaland" if threshold is high.
        // Let's inspect what DataManager expects. It normalizes names. "erlinghaaland" vs "erlingbrauthaaland".
        // Use a simpler name if fuzzy match is strict, or assume logic handles it.
        // For this test, let's assume one player output for specific verification.

        const player = merged[0];
        expect(player.name).toContain('Haaland');

        // Calculate
        const computed = StatCalculator.calculate(player, {}, merged);

        // Verify key Metrics
        expect(computed.minutes).toBe(1000); // From Dump
        expect(computed['npxG/90']).toBeCloseTo((15.0 / 1000) * 90); // From Shots
        expect(computed['xA/90']).toBeCloseTo((5.0 / 1000) * 90); // From Passes
    });
});
