import { BaseParser } from './BaseParser.js';
import { PLAYER_COST_RANGE } from '../utils/constants.js';


export class StatsBombParser extends BaseParser {

    /**
     * Parse StatsBomb HTML
     * @param {Document} doc 
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

        console.log(`[StatsBombParser] Parsed ${players.length} players.`);
        return players;
    }

    parseRow(row) {
        // 1. Identify Player
        const nameLink = row.querySelector('a.enhanced-title') || row.querySelector('a[href*="player-profiles"]');
        if (!nameLink) return null;

        const name = nameLink.getAttribute('oldtitle') || nameLink.textContent.trim();
        const displayName = nameLink.textContent.trim();

        // 2. Identify Team & Position (Standard StatsBomb format)
        let team = null;
        let teamShort = null;
        let position = null;

        const teamLink = row.querySelector('td a[href*="player-stats"]');
        if (teamLink) {
            team = teamLink.getAttribute('oldtitle') || teamLink.textContent.trim();
            teamShort = teamLink.textContent.trim();
        }

        // Fallback or supplementary for position
        const profileDiv = row.querySelector('.profile-title');
        if (profileDiv) {
            const posMatch = profileDiv.textContent.match(/\((.*?),\s*(.*?)\)/);
            if (posMatch) {
                if (!team) team = posMatch[1].trim();
                position = posMatch[2].trim();
            }
        }

        // 3. Extract Cost
        let cost = null;
        const costCells = row.querySelectorAll('td.nowrap');
        costCells.forEach(cell => {
            const val = parseFloat(cell.textContent.trim());
            if (!isNaN(val) && val > PLAYER_COST_RANGE.MIN && val < PLAYER_COST_RANGE.MAX) {
                cost = val;
            }
        });

        // 4. Extract Stats
        const playerData = {
            name,
            displayName,
            team,
            teamShort,
            position,
            cost
        };

        const statCells = row.querySelectorAll('td[oldtitle], td[data-hasqtip]');
        statCells.forEach(cell => {
            const oldtitle = cell.getAttribute('oldtitle');
            if (!oldtitle) return;

            const match = oldtitle.match(/^(.+?):\s*(.+)$/);
            if (match) {
                const originalStatName = match[1].trim();
                const valueStr = match[2].trim();

                // Check mapping if it exists
                const mapping = this.constructor.STAT_MAPPING;
                let statKey = originalStatName;

                if (mapping) {
                    if (mapping[originalStatName]) {
                        statKey = mapping[originalStatName];
                    } else {
                        // If mapping exists but this stat isn't in it, skip it.
                        return;
                    }
                }

                const numValue = parseFloat(valueStr.replace(/,/g, ''));
                playerData[statKey] = isNaN(numValue) ? valueStr : numValue;
            }
        });

        return playerData;
    }

    /**
     * Predicate to determine if a stat should be extracted.
     * Deprecated in favor of strict mapping in parseRow, but kept for compatibility if needed.
     */
    shouldExtractStat(statName) {
        return true;
    }
}
