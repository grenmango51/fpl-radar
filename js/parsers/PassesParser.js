import { StatsBombParser } from './StatsBombParser.js';

export class PassesParser extends StatsBombParser {

    static STAT_MAPPING = {
        'xG Assisted': 'xA',
        'xA': 'xA',
        'Expected Assists': 'xA',
        'Key Passes': 'Key Passes',
        'Key Pass': 'Key Passes',
        'Chances Created': 'Key Passes', // Alias often used in FFS
        'Creativity': 'Key Passes',
        'Big Chances Created': 'Big Chances Created',
        'Big Chance Created': 'Big Chances Created',
        // Add others as needed
    };
}
