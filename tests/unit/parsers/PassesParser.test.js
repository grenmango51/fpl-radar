// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { PassesParser } from '../../../js/parsers/PassesParser.js';

describe('PassesParser', () => {
    let parser;

    beforeEach(() => {
        parser = new PassesParser();
    });

    it('should parse player and stats correctly', () => {
        const html = `
            <table>
                <tr>
                    <td>
                        <a class="enhanced-title" oldtitle="Kevin De Bruyne">Kevin De Bruyne</a>
                    </td>
                    <td oldtitle="xG Assisted: 10.2">10.2</td>
                    <td oldtitle="Key Passes: 80">80</td>
                </tr>
            </table>
        `;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const results = parser.parse(doc);

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            name: 'Kevin De Bruyne',
            'xA': 10.2,
            'Key Passes': 80
        });
    });

    it('should handle aliases correctly (e.g. Chances Created -> Key Passes)', () => {
        const html = `
            <table>
                <tr>
                    <td><a class="enhanced-title" oldtitle="Player A">Player A</a></td>
                    <td oldtitle="Chances Created: 15">15</td>
                </tr>
            </table>
        `;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const results = parser.parse(doc);
        expect(results[0]['Key Passes']).toBe(15);
    });
});
