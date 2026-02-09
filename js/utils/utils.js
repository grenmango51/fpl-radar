/**
 * FPL Radar - Utility Functions
 * Reusable helper functions for the application
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity between two strings (0 = completely different, 1 = identical)
 * Uses Levenshtein distance algorithm
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
export function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename for download
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>]/g, '');
}

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

/**
 * Percentile cache for performance optimization
 */
const percentileCache = new Map();

/**
 * Get cached percentile or calculate and cache it
 * @param {string} playerId - Player identifier
 * @param {string} statKey - Stat key
 * @param {number} value - Stat value
 * @param {Object} distribution - Distribution object with values array
 * @param {Function} calculateFn - Function to calculate percentile
 * @returns {number} Percentile value
 */
export function getCachedPercentile(playerId, statKey, value, distribution, calculateFn) {
    const cacheKey = `${playerId}-${statKey}-${value}`;

    if (percentileCache.has(cacheKey)) {
        return percentileCache.get(cacheKey);
    }

    const percentile = calculateFn(value, distribution.values, distribution.inverted);
    percentileCache.set(cacheKey, percentile);

    return percentile;
}

/**
 * Clear the percentile cache (call when data changes)
 */
export function clearPercentileCache() {
    percentileCache.clear();
}
