import { StatsBombParser } from './StatsBombParser.js';

export class ShotsParser extends StatsBombParser {

    static STAT_MAPPING = {
        'Shots': 'Shots',
        'Goal Attempts': 'Shots', // Alias
        'Shots Total': 'Shots',
        'Goals': 'Goals',
        'xG': 'xG', // or 'xG Expected Goals'
        'xG Expected Goals': 'xG',
        'xG Non-Penalty': 'npxG',
        'Non-Penalty xG': 'npxG',
        'Shots Non-Penalty': 'Shots Non-Penalty',
        'Shots Non-Penalty Tot': 'Shots Non-Penalty',
        'xG Per Shot Non-Penalty': 'npxG/Shot',
        // Add others as needed
    };

    // Override to support fuzzy matching of stat names if needed
    shouldExtractStat(statName) {
        // Simple exact match against known keys
        return Object.keys(ShotsParser.STAT_MAPPING).some(k => k === statName);
    }
}
