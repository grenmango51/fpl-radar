import { calculateSimilarity } from '../utils/utils.js';
import { FUZZY_MATCH_THRESHOLD } from '../utils/constants.js'; // Assuming constants.js will be moved to utils or importing from root

export class DataManager {

    /**
     * Merge multiple lists of players into one unified list
     * @param {Array<Array>} playerLists - Array of player arrays from different parsers
     */
    static mergePlayerData(...playerLists) {
        const playerMap = new Map();
        const normalizeName = (name) => (name || '').toLowerCase().replace(/[^a-z]/g, '');

        playerLists.forEach(players => {
            if (!players) return;

            players.forEach(player => {
                const rawName = player.name || player.displayName;
                if (!rawName) return;

                let key = rawName;

                // Check if we already have this player
                if (!playerMap.has(key)) {
                    const normName = normalizeName(key);

                    // 1. Exact normalized match
                    for (const existingKey of playerMap.keys()) {
                        if (normalizeName(existingKey) === normName) {
                            key = existingKey;
                            break;
                        }
                    }

                    // 2. Fuzzy match
                    if (!playerMap.has(key)) {
                        let bestMatch = null;
                        let bestSimilarity = 0;

                        for (const existingKey of playerMap.keys()) {
                            const normExist = normalizeName(existingKey);
                            const similarity = calculateSimilarity(normExist, normName);

                            if (similarity >= FUZZY_MATCH_THRESHOLD && similarity > bestSimilarity) {
                                bestMatch = existingKey;
                                bestSimilarity = similarity;
                            }
                        }

                        if (bestMatch) {
                            // console.log(`Fuzzy match: "${key}" -> "${bestMatch}"`);
                            key = bestMatch;
                        }
                    }
                }

                if (!playerMap.has(key)) {
                    playerMap.set(key, { ...player });
                } else {
                    const existing = playerMap.get(key);
                    // Merge, preferring non-null/undefined values
                    // We simply spread, so 'player' overrides 'existing' for same keys.
                    // This means later files override earlier ones.
                    // IMPORTANT: Ensure merge logic is sound (merging derived stats?)
                    playerMap.set(key, { ...existing, ...player });
                }
            });
        });

        return Array.from(playerMap.values());
    }

    static mergeTeamStats(defending, expected) {
        // Simple merge by Team Name
        const merged = { ...defending };
        if (!expected) return merged;

        Object.entries(expected).forEach(([team, stats]) => {
            if (merged[team]) {
                Object.assign(merged[team], stats);
            } else {
                merged[team] = stats;
            }
        });
        return merged;
    }
}
