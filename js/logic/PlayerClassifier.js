/**
 * Classify a player as Attacker or Defender
 * @param {Object} player - Player object with position and cost
 * @param {string} [player.position] - Player position (e.g., "Defender", "Midfielder")
 * @param {number} [player.cost] - Player cost in FPL
 * @returns {'attacker'|'defender'} Classification
 */
export function classifyPlayer(player) {
    const pos = (player.position || '').toLowerCase();

    // Explicit position check
    if (pos.includes('defender') || pos.includes('def') || pos === 'd') return 'defender';
    if (pos.includes('goalkeeper') || pos.includes('gk') || pos === 'g') return 'defender';

    if (pos.includes('forward') || pos.includes('fwd') || pos === 'f') return 'attacker';
    if (pos.includes('midfielder') || pos.includes('mid') || pos === 'm') return 'attacker';

    // Cost-based heuristic (Fallback if position is missing)
    // Warning: This is unreliable for premium defenders (e.g., TAA > 6.0)
    // We rely on the parser correctly extracting 'position' to avoid this.
    if (player.cost && player.cost < 5.5) return 'defender';

    // Default to Attacker if high cost or unknown
    return 'attacker';
}
