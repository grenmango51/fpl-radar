// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { CustomDumpParser } from '../../../js/parsers/CustomDumpParser.js';

describe('CustomDumpParser', () => {
    let parser;

    beforeEach(() => {
        parser = new CustomDumpParser();
    });

    it('should parse player data correctly from HTML row', () => {
        const html = `
            <table>
                <tr>
                    <td>
                        <a class="enhanced-title" oldtitle="Erling Haaland">Erling Haaland</a>
                    </td>
                    <td>
                        <span class="team-disc"></span><span class="team-name">MCI</span>
                    </td>
                    <td class="nowrap">14.0</td>
                    <td oldtitle="Big Chances Total: 20">20</td>
                    <td oldtitle="Chances Created: 15">15</td>
                    <td oldtitle="Time Played - Exact: 1000">1,000</td>
                </tr>
            </table>
        `;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const results = parser.parse(doc);

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            name: 'Erling Haaland',
            team: 'MCI',
            cost: 14.0,
            'Big Chances Total': 20,
            'Chances Created': 15,
            'Minutes': 1000
        });
    });

    it('should ignore rows without player links', () => {
        const html = `<table><tr><td>No Link</td></tr></table>`;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const results = parser.parse(doc);
        expect(results).toHaveLength(0);
    });

    it('should parse stats using mapping', () => {
        const html = `
            <table>
                <tr>
                    <td><a class="enhanced-title" oldtitle="Test Player">Test Player</a></td>
                    <td oldtitle="Defensive Contributions Per Start: 1.5">1.5</td>
                </tr>
            </table>
        `;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const results = parser.parse(doc);
        expect(results[0]['DC/Strt']).toBe(1.5);
    });
});
