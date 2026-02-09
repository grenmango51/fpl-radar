import { BaseParser } from './BaseParser.js';
import { PLAYER_COST_RANGE } from '../utils/constants.js';

/**
 * Parser for the Custom Dump HTML file from Fantasy Football Scout.
 * Extracts player details, cost, team, and position, along with configured stats.
 */
export class CustomDumpParser extends BaseParser {

    // Explicit mapping of the stats we want to extract from this file
    // Key: HTML column header name (oldtitle), Value: Internal stat name
    static STAT_MAPPING = {
        'Big Chances Total': 'Big Chances Total',
        'Chances Created': 'Chances Created',
        'Defensive Contributions': 'Defensive Contributions',
        'Defensive Contributions Per Start': 'DC/Strt',
        'Big Chances Created': 'Big Chances Created',
        'FPL Defensive Contribution Success Rate (Percentage of Starts with DC points)': 'FPL DC % Strt',
        'Touches - Penalty Area': 'Touches - Penalty Area',
        'Shots': 'Shots',
        'Minutes Played per Start': 'M/Strt',
        'Starts': 'Starts',
        'Time Played - Exact': 'Minutes',
        'Position': 'position' // Added to extract position
    };

    /**
     * Parse Custom Dump HTML
     * @param {Document} doc - The DOM Document parsed from HTML string
     * @returns {Array<Object>} List of parsed player objects
     */
    parse(doc) {
        const rows = doc.querySelectorAll('tr');
        const players = [];

        rows.forEach(row => {
            const player = this.parseRow(row);
            if (player) {
                players.push(player);
            }
        });

        console.log(`[CustomDumpParser] Parsed ${players.length} players.`);
        return players;
    }

    /**
     * Parse a single row from the table
     * @param {Element} row - The table row element
     * @returns {Object|null} The parsed player object or null if invalid
     */
    parseRow(row) {
        // 1. Identify Player
        const nameLink = row.querySelector('a.enhanced-title') || row.querySelector('a[href*="player-profiles"]');
        if (!nameLink) return null;

        const name = nameLink.getAttribute('oldtitle') || nameLink.textContent.trim();
        const displayName = nameLink.textContent.trim();

        // 2. Identify Team (Custom dump specific)
        let team = null;
        let teamShort = null;
        // Standard Custom Dump team cell
        const teamSpan = row.querySelector('.team-disc');
        if (teamSpan && teamSpan.parentElement) {
            teamShort = teamSpan.parentElement.textContent.trim();
            team = teamShort; // fallback
        } else {
            // Try standard link if present
            const teamLink = row.querySelector('td a[href*="player-stats"]');
            if (teamLink) {
                team = teamLink.getAttribute('oldtitle') || teamLink.textContent.trim();
                teamShort = teamLink.textContent.trim();
            }
        }

        // 3. Extract Cost using constants
        let cost = null;
        const costCells = row.querySelectorAll('td.nowrap');
        costCells.forEach(cell => {
            const val = parseFloat(cell.textContent.trim());
            // Use constants instead of magic numbers
            if (!isNaN(val) && val > PLAYER_COST_RANGE.MIN && val < PLAYER_COST_RANGE.MAX) {
                cost = val;
            }
        });

        const playerData = {
            name,
            displayName,
            team,
            teamShort,
            cost
        };

        // 4. Extract Stats using STAT_MAPPING
        const statCells = row.querySelectorAll('td[oldtitle]');
        statCells.forEach(cell => {
            const oldtitle = cell.getAttribute('oldtitle');
            if (oldtitle) {
                const match = oldtitle.match(/^(.+?):\s*(.+)$/);
                if (match) {
                    const originalStatName = match[1].trim();
                    const valueStr = match[2].trim();

                    // Check mapping strictly
                    const mapping = CustomDumpParser.STAT_MAPPING;
                    if (mapping && mapping[originalStatName]) {
                        const statKey = mapping[originalStatName];

                        // Special handling for Position which is a string
                        if (statKey === 'position') {
                            playerData[statKey] = valueStr;
                        } else {
                            const numValue = parseFloat(valueStr.replace(/,/g, ''));
                            playerData[statKey] = isNaN(numValue) ? valueStr : numValue;
                        }
                    }
                }
            }
        });

        return playerData;
    }
}
