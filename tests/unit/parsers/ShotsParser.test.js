// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ShotsParser } from '../../../js/parsers/ShotsParser.js';

describe('ShotsParser', () => {
    let parser;

    beforeEach(() => {
        parser = new ShotsParser();
    });

    it('should parse player and stats correctly', () => {
        const html = `
            <table>
                <tr>
                    <td>
                        <div class="profile-title">(Arsenal, Midfielder)</div>
                        <a class="enhanced-title" oldtitle="Bukayo Saka">Bukayo Saka</a>
                    </td>
                    <td oldtitle="Shots Total: 50">50</td>
                    <td oldtitle="xG Non-Penalty: 12.5">12.5</td>
                </tr>
            </table>
        `;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const results = parser.parse(doc);

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            name: 'Bukayo Saka',
            team: 'Arsenal',
            position: 'Midfielder',
            'Shots': 50,
            'npxG': 12.5
        });
    });

    it('should handle aliases correctly (e.g. Goal Attempts -> Shots)', () => {
        const html = `
            <table>
                <tr>
                    <td><a class="enhanced-title" oldtitle="Player A">Player A</a></td>
                    <td oldtitle="Goal Attempts: 5">5</td>
                </tr>
            </table>
        `;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const results = parser.parse(doc);
        expect(results[0]['Shots']).toBe(5);
    });
});
