import { CustomDumpParser } from '../parsers/CustomDumpParser.js';
import { ShotsParser } from '../parsers/ShotsParser.js';
import { PassesParser } from '../parsers/PassesParser.js';
import { TeamStatsParser } from '../parsers/TeamStatsParser.js';
import { FixtureParser } from '../parsers/FixtureParser.js';
import { DataManager } from '../logic/DataManager.js';
import { StatCalculator } from '../logic/StatCalculator.js';
import { classifyPlayer } from '../logic/PlayerClassifier.js';
import { clearPercentileCache } from '../utils/utils.js';
import { Store } from '../state/store.js';

export class DataService {

    static async loadData() {
        const state = Store.getState();

        // Read all files
        const [dumpContent, shotsContent, passesContent,
            defendingTeamContent, expectedTeamContent, fixturesContent] = await Promise.all([
                this.readFileAsText(state.files.dump),
                this.readFileAsText(state.files.shots),
                this.readFileAsText(state.files.passes),
                this.readFileAsText(state.files.defendingTeam),
                this.readFileAsText(state.files.expectedTeam),
                state.files.fixtures ? this.readFileAsText(state.files.fixtures) : Promise.resolve(null)
            ]);

        return this.processData(
            dumpContent,
            shotsContent,
            passesContent,
            defendingTeamContent,
            expectedTeamContent,
            fixturesContent
        );
    }

    static async loadDataFromContent() {
        const state = Store.getState();

        return this.processData(
            state.files.dump,
            state.files.shots,
            state.files.passes,
            state.files.defendingTeam,
            state.files.expectedTeam,
            state.files.fixtures
        );
    }

    static processData(dumpContent, shotsContent, passesContent, defendingTeamContent, expectedTeamContent, fixturesContent) {
        // Helpers
        const parse = (content, ParserClass) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            return new ParserClass().parse(doc);
        };

        // Parse HTML files using new Parsers
        const dumpData = parse(dumpContent, CustomDumpParser);
        const shotsData = parse(shotsContent, ShotsParser);
        const passesData = parse(passesContent, PassesParser);
        const defendingTeamData = parse(defendingTeamContent, TeamStatsParser);
        const expectedTeamData = parse(expectedTeamContent, TeamStatsParser);

        let fixtureData = {};
        // Parse fixtures if available
        if (fixturesContent) {
            fixtureData = parse(fixturesContent, FixtureParser);
        }

        // Merge team stats
        const teamStats = DataManager.mergeTeamStats(defendingTeamData, expectedTeamData);

        // Clear percentile cache
        clearPercentileCache();

        // Merge player data
        const mergedPlayers = DataManager.mergePlayerData(
            dumpData,
            shotsData,
            passesData
        );

        // Calculate derived stats for each player
        const players = mergedPlayers.map(player =>
            StatCalculator.calculate(player, teamStats, mergedPlayers)
        );

        // Classify players
        players.forEach(player => {
            player.classification = classifyPlayer(player);
        });

        // Update Store
        Store.setState({
            players,
            teamStats,
            fixtureData
        });

        return players;
    }

    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    static identifyFile(file) {
        const fileName = file.name.toLowerCase();

        // 1. Fixtures
        if (/fixture/.test(fileName)) return 'fixtures';

        // 2. StatsBomb Files
        if (/statsbomb/.test(fileName)) {
            if (/shot/.test(fileName)) return 'shots';
            if (/pass/.test(fileName)) return 'passes';
            return null; // Unknown StatsBomb file
        }

        // 3. Team Stats (Defending/Expected)
        if (/(defending|expected).*(team|stats)/.test(fileName)) {
            if (/defending/.test(fileName)) return 'defendingTeam';
            if (/expected/.test(fileName)) return 'expectedTeam';
        }

        // 4. Custom Dump (Fallback)
        // Must NOT contain 'statsbomb' (handled above)
        if (/(dump|stat dump)/.test(fileName)) {
            return 'dump';
        }

        return null;
    }
}
