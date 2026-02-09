import { TEAM_NAME_MAP } from '../utils/constants.js'; // Ensure constants are available or move them

/**
 * Calculate per-90s, percentiles, and derived metrics
 */
export class StatCalculator {

    /**
     * calculate()
     * @param {Object} player - Merged player object
     * @param {Object} teamStats - Merged team stats
     * @param {Array} mergedPlayers - All players for percentile calculation
     */
    static calculate(player, teamStats, mergedPlayers) {
        const stats = { ...player };

        // Helper to get value from player object with multiple possible keys
        // We keep this because merging might preserve different keys from different sources
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

        const getVal = (obj, ...keys) => {
            if (!obj) return 0;
            const objKeys = Object.keys(obj);

            for (const k of keys) {
                // 1. Exact match and direct access
                if (obj[k] !== undefined) return parseFloat(obj[k]);

                // 2. Case-insensitive match
                let found = objKeys.find(key => key.toLowerCase() === k.toLowerCase());
                if (found && obj[found] !== undefined) return parseFloat(obj[found]);

                // 3. Ultra-fuzzy match (ignoring spaces/symbols)
                const normK = normalize(k);
                found = objKeys.find(key => normalize(key) === normK);
                if (found && obj[found] !== undefined) return parseFloat(obj[found]);
            }
            return 0;
        };

        // Get basic stats - Use EXACT stat names from HTML oldtitle attributes (or our mapped keys)
        let starts = getVal(player, 'Starts', 'Games Started', 'Start', 'GS');
        let minutes = getVal(player, 'Time Played - Exact', 'Exact Time Played', 'Minutes', 'Mins');

        // Fallback: Calculate Minutes from M/Strt if needed
        if (minutes === 0 && starts > 0) {
            const minsPerStart = getVal(player, 'Minutes Played per Start', 'Minutes per Start', 'M/Strt');
            if (minsPerStart > 0) {
                minutes = minsPerStart * starts;
            }
            // Fallback for M/Strt key variations if mapped differently
            if (minutes === 0) {
                const mps = getVal(player, 'M/Strt');
                if (mps > 0) minutes = mps * starts;
            }
        }

        // Fallback: If starts missing but we have M/Strt and Minutes
        if (starts === 0 && minutes > 0) {
            const minsPerStart = getVal(player, 'Minutes Played per Start', 'Minutes per Start', 'M/Strt');
            if (minsPerStart > 0) {
                starts = Math.round(minutes / minsPerStart);
            }
        }

        // Store minutes
        stats.minutes = minutes;
        stats.starts = starts;

        // Derived Stats

        // npxG
        // Our parsers map to 'npxG' (ShotsParser) or keep 'xG Non-Penalty'
        const npxG = getVal(player, 'npxG', 'xG Non-Penalty', 'Non-Penalty xG', 'xG Open Play');
        stats['npxG/90'] = minutes > 0 ? (npxG / minutes) * 90 : 0;

        // Shots
        // Parsers map to 'Shots'
        const shots = getVal(player, 'Shots', 'Goal Attempts', 'Shots Total');
        stats['Shots/90'] = minutes > 0 ? (shots / minutes) * 90 : 0;

        // npxG/Shot
        stats['npxG/Shot'] = getVal(player, 'npxG/Shot', 'xG Per Shot Non-Penalty', 'npxG per Shot')
            || (shots > 0 ? npxG / shots : 0);
        stats['xG Per Shot Non-Penalty'] = stats['npxG/Shot'];

        // Big Chances (Shooting)
        const bigChances = getVal(player, 'Big Chances Total', 'Big Chances', 'Big Ch Tot');
        stats['Big Ch/90'] = minutes > 0 ? (bigChances / minutes) * 90 : 0;

        // Passing
        const xA = getVal(player, 'xA', 'xG Assisted', 'Expected Assists');
        stats['xA/90'] = minutes > 0 ? (xA / minutes) * 90 : 0;
        stats['xG Assisted'] = xA;

        const keyPasses = getVal(player, 'Key Passes', 'Key Pass', 'Chances Created', 'Creativity');
        stats['Key Pass/90'] = minutes > 0 ? (keyPasses / minutes) * 90 : 0;

        const bigChCreated = getVal(player, 'Big Chances Created', 'Big Chance Created', 'BCC');
        stats['Big Ch Cr/90'] = minutes > 0 ? (bigChCreated / minutes) * 90 : 0;

        // Involvement
        const touchBox = getVal(player, 'Touches - Penalty Area', 'Box Touches', 'Touches In Box');
        stats['Touch Box/90'] = minutes > 0 ? (touchBox / minutes) * 90 : 0;

        // Defensive Individual
        let defcon = getVal(player, 'Defensive Contributions', 'Defcon');

        // Fallback: Calculate from DC/Strt
        if (!defcon) {
            const dcPerStart = getVal(player, 'DC/Strt', 'Defensive Contributions Per Start');
            if (dcPerStart && starts > 0) {
                defcon = dcPerStart * starts;
            }
        }

        stats['Defcon/90'] = minutes > 0 ? (defcon / minutes) * 90 : 0;

        // Def Success Rate
        stats['Defcon HR%'] = getVal(player,
            'FPL DC % Strt',
            'FPL Defensive Contribution Success Rate (Percentage of Starts with DC points)'
        );

        // Mins/Start
        let minsPerStart = getVal(player, 'M/Strt', 'Minutes Played per Start');
        if (!minsPerStart && stats.starts > 0) {
            minsPerStart = minutes / stats.starts;
        }
        stats['Mins/Start'] = minsPerStart;

        // Defender Derived
        const xG = getVal(player, 'xG', 'expected_goals');
        stats['Atk Threat'] = ((xG || 0) * 6) + ((xA || 0) * 3);

        // Stats from merged Team data
        StatCalculator.appendTeamStats(stats, teamStats);

        stats['FDR'] = 0; // Placeholder

        return stats;
    }

    static appendTeamStats(player, teamStats) {
        if (!teamStats) return;

        let teamName = player.team || '';

        // Resolve abbreviation to full name if possible
        if (TEAM_NAME_MAP[teamName]) {
            // console.log(`[StatCalculator] Mapping team "${teamName}" -> "${TEAM_NAME_MAP[teamName]}"`);
            teamName = TEAM_NAME_MAP[teamName];
        }

        let teamStatsObj = null;

        // 1. Try exact match
        if (teamStats[teamName]) {
            teamStatsObj = teamStats[teamName];
        } else {
            // Need map from constants. Importing at top.
            // But if we can't import easily due to circular deps, we might need to pass it in.
            // Assuming import works or we rely on fuzzy matching.

            // Fuzzy Match Team
            const teamKey = Object.keys(teamStats).find(k =>
                k.toLowerCase() === teamName.toLowerCase() ||
                k.toLowerCase().includes(teamName.toLowerCase()) ||
                teamName.toLowerCase().includes(k.toLowerCase())
            );
            if (teamKey) {
                teamStatsObj = teamStats[teamKey];
            } else {
                // REVERSE MAPPING CHECK:
                // If teamName is "Brighton and Hove Albion" but keys are "BHA"
                // Check if any key in TEAM_NAME_MAP maps to our current teamName
                const abbrKey = Object.keys(TEAM_NAME_MAP).find(abbr =>
                    TEAM_NAME_MAP[abbr] === teamName
                );
                if (abbrKey && teamStats[abbrKey]) {
                    teamStatsObj = teamStats[abbrKey];
                }
            }
        }

        if (teamStatsObj) {
            const getVal = (obj, key) => obj[key] !== undefined ? obj[key] : 0; // Simplified getVal for team stats

            player['xGC (Team)'] = teamStatsObj['xG Conceded'] || teamStatsObj['xGC'] || 0;
            player['Shots Conc'] = teamStatsObj['Shots Conceded'] || teamStatsObj['Shots Against'] || 0;
            player['BC Conc'] = teamStatsObj['Big Chances Conceded'] || teamStatsObj['Big Chances Against'] || 0;

            if (player['Shots Conc'] > 0) {
                player['xG/Shot C'] = player['xGC (Team)'] / player['Shots Conc'];
            }
        }
    }
}
