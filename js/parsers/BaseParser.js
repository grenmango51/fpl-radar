/**
 * Abstract Base Parser
 * Interfaces for all specific file parsers.
 */
export class BaseParser {
    constructor() {
        if (this.constructor === BaseParser) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * Parse the HTML content and return a list of player objects
     * @param {Document} doc - The parsed HTML document
     * @returns {Array} - List of player objects
     */
    parse(doc) {
        throw new Error("Method 'parse()' must be implemented.");
    }

    /**
     * Helper to extract a specific stat from a row based on column index or data attribute
     * @param {Element} row 
     * @param {string} statName 
     */
    extractStat(row, statName) {
        // To be implemented by subclasses or shared utility
        return 0;
    }
}
