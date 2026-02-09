/**
 * FPL Radar - Radar Chart
 * Chart.js radar implementation with custom percentile scaling
 */

import { getCachedPercentile } from './utils/utils.js';

// Attacker axes configuration (11 axes, clockwise from top)
// Order: xG -> Passes -> Defense -> Mins -> Box Touches -> Shooting -> (back to xG)
export const ATTACKER_AXES = [
    // Primary Expected Stats
    { key: 'npxG/90', label: 'npxG/90', category: 'shooting', color: '#f97316' },

    // Passing / Creativity
    { key: 'xA/90', label: 'xA/90', category: 'passing', color: '#22c55e' },
    { key: 'Big Ch Cr/90', label: 'Big Ch Cr', category: 'passing', color: '#22c55e' },
    { key: 'Key Pass/90', label: 'Chance Cr', category: 'passing', color: '#22c55e' },

    // Defensive & Mins (Grouped to separate passing from shooting)
    { key: 'Defcon/90', label: 'Defcon/90', category: 'defensive', color: '#3b82f6' },
    { key: 'Defcon HR%', label: 'Def HR%', category: 'defensive', color: '#3b82f6' },
    { key: 'Mins/Start', label: 'Mins/Start', category: 'defensive', color: '#3b82f6' },

    // Involvement (Bridging Mins -> Shooting)
    { key: 'Touch Box/90', label: 'Box Tch/90', category: 'involvement', color: '#eab308' },

    // Shooting
    { key: 'Shots/90', label: 'Shots/90', category: 'shooting', color: '#f97316' },
    { key: 'Big Ch/90', label: 'Big Ch/90', category: 'shooting', color: '#f97316' },
    { key: 'xG Per Shot Non-Penalty', label: 'npxG/Shot', category: 'shooting', color: '#f97316' }
];

// Defender axes configuration (9 axes, clockwise from top)
// Order: Attacking -> Team Defense -> Def HR% -> Defcon/90 -> Mins
export const DEFENDER_AXES = [
    // 1. Attacking
    { key: 'Atk Threat', label: 'Atk Threat', category: 'attacking', color: '#22c55e', inverted: false },

    // 2. Fixture (FDR)
    { key: 'FDR', label: 'FDR', category: 'defensive', color: '#eab308', inverted: true },

    // 3. Team Expected
    { key: 'xGC (Team)', label: 'xGC (Team)', category: 'defensive', color: '#ef4444', inverted: true },

    // 4. xG/Shot Conceded
    { key: 'xG/Shot C', label: 'xG/Shot C', category: 'defensive', color: '#ef4444', inverted: true },

    // 5. Shots Conceded
    { key: 'Shots Conc', label: 'Shots Conc', category: 'defensive', color: '#ef4444', inverted: true },

    // 6. Big Chances Conceded
    { key: 'BC Conc', label: 'BC Conc', category: 'defensive', color: '#ef4444', inverted: true },

    // 7. Defcon HR% (Swapped with 8)
    { key: 'Defcon HR%', label: 'Def HR%', category: 'defensive', color: '#3b82f6', inverted: false },

    // 8. Defcon/90 (Swapped with 7) - Now next to Mins/Start
    { key: 'Defcon/90', label: 'Defcon/90', category: 'defensive', color: '#3b82f6', inverted: false },

    // 9. Mins/Start
    { key: 'Mins/Start', label: 'Mins/Start', category: 'defensive', color: '#3b82f6', inverted: false }
];

// Category colors for legend
export const CATEGORY_COLORS = {
    shooting: { label: 'Shooting', color: '#f97316' },
    passing: { label: 'Passing', color: '#22c55e' },
    involvement: { label: 'Involvement', color: '#eab308' },
    defensive: { label: 'Defensive', color: '#3b82f6' },
    attacking: { label: 'Attacking', color: '#22c55e' }
};

/**
 * Calculate scaled value using Min-Max Normalization
 * Formula: (Value - Min) / (Max - Min) * 100
 */
export function calculateMinMaxScaling(value, min, max, isInverted = false) {
    if (min === max) return 100; // Edge case: all values same

    // For inverted stats (lower is better), we want lower values to be higher %
    // Standard: (val - min) / (max - min)
    // Inverted: (max - val) / (max - min)
    let scaled;
    if (isInverted) {
        scaled = ((max - value) / (max - min)) * 100;
    } else {
        scaled = ((value - min) / (max - min)) * 100;
    }

    return Math.max(0, Math.min(100, scaled));
}

/**
 * Calculate Min/Max range for each stat across all filtered players
 */
export function calculateStatDistributions(players, axes) {
    const distributions = {};

    axes.forEach(axis => {
        const values = players
            .map(p => p[axis.key])
            .filter(v => typeof v === 'number' && !isNaN(v));

        // Find absolute min and max in the filtered dataset
        // If dataset is empty, default to 0-100
        const min = values.length > 0 ? Math.min(...values) : 0;
        const max = values.length > 0 ? Math.max(...values) : 100;

        distributions[axis.key] = {
            min: min,
            max: max,
            inverted: axis.inverted || false
        };
    });

    return distributions;
}

/**
 * Convert player stats to percentile values for radar chart
 * Uses true percentile ranking (what % of players does this player outperform)
 * Results are cached for performance
 */
export function playerToPercentiles(player, axes, distributions) {
    return axes.map(axis => {
        // Debug Log
        // console.log('Processing axis:', axis.key);

        const value = player[axis.key];
        const dist = distributions[axis.key];

        if (typeof value !== 'number' || isNaN(value) || !dist) {
            return 0;
        }

        const scaledValue = calculateMinMaxScaling(
            value,
            dist.min,
            dist.max,
            dist.inverted
        );

        // Clamp between 0 and 100
        return scaledValue;
    });
}

// Keep the old function name for backward compatibility in app.js
export function calculateStatRanges(players, axes) {
    return calculateStatDistributions(players, axes);
}
/**
 * Create or update radar chart with category-colored segments
 */
/**
 * Create or update radar chart with category-colored segments
 */
export function createRadarChart(ctx, player, axes, ranges, existingChart = null, comparePlayer = null) {
    const percentiles = playerToPercentiles(player, axes, ranges);
    const labels = axes.map(a => a.label);

    let datasets = [];

    // Comparison Mode
    if (comparePlayer) {
        const comparePercentiles = playerToPercentiles(comparePlayer, axes, ranges);

        // Dataset 1: Primary Player (Blue)
        datasets.push({
            label: player.name || 'Player 1',
            data: percentiles,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.5)', // Blue with transparency
            borderColor: '#3b82f6',
            borderWidth: 3,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        });

        // Dataset 2: Comparison Player (Red)
        datasets.push({
            label: comparePlayer.name || 'Player 2',
            data: comparePercentiles,
            fill: true,
            backgroundColor: 'rgba(239, 68, 68, 0.5)', // Red with transparency
            borderColor: '#ef4444',
            borderWidth: 3,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    } else {
        // Standard Mode: Category Colors

        // Get unique categories and their colors
        const categories = [...new Set(axes.map(a => a.category))];

        // Create datasets for each category segment
        datasets = categories.map(category => {
            const categoryInfo = CATEGORY_COLORS[category] || { color: '#666' };
            const color = categoryInfo.color;

            // Create data array where only this category's points have values
            // Adjacent points need values to create filled segments
            const data = axes.map((axis, i) => {
                if (axis.category === category) {
                    return percentiles[i];
                }
                // Check if adjacent to a point in this category (for segment fill)
                const prevIdx = (i - 1 + axes.length) % axes.length;
                const nextIdx = (i + 1) % axes.length;
                if (axes[prevIdx].category === category || axes[nextIdx].category === category) {
                    return percentiles[i];
                }
                return null;
            });

            return {
                label: category,
                data: data,
                fill: true,
                backgroundColor: `${color}33`, // 20% opacity
                borderColor: color,
                borderWidth: 2,
                pointBackgroundColor: axes.map(a => a.category === category ? color : 'transparent'),
                pointBorderColor: axes.map(a => a.category === category ? '#fff' : 'transparent'),
                pointBorderWidth: axes.map(a => a.category === category ? 1 : 0),
                pointRadius: axes.map(a => a.category === category ? 4 : 0),
                pointHoverRadius: axes.map(a => a.category === category ? 6 : 0),
                spanGaps: false
            };
        });

        // Add an outline dataset to show the full shape
        datasets.unshift({
            label: player.name || 'Player',
            data: percentiles,
            fill: false,
            backgroundColor: 'transparent',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0
        });
    }

    const config = {
        type: 'radar',
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: !!comparePlayer, // Show legend only in comparison mode
                    labels: {
                        color: '#94a3b8'
                    }
                },
                tooltip: {
                    filter: (tooltipItem) => {
                        if (comparePlayer) return true; // Show all in compare mode

                        // Standard mode filtering
                        // Only show tooltip for actual data points
                        if (tooltipItem.raw === null || tooltipItem.datasetIndex === 0) return false;

                        // Only show if the dataset category matches the axis category
                        // This prevents duplicate tooltips where segments overlap
                        const datasetLabel = tooltipItem.dataset.label;
                        const axisCategory = axes[tooltipItem.dataIndex].category;
                        return datasetLabel === axisCategory;
                    },
                    callbacks: {
                        title: (context) => {
                            if (context.length === 0) return '';
                            return axes[context[0].dataIndex].label;
                        },
                        label: (context) => {
                            const axis = axes[context.dataIndex];

                            // Determine which player based on dataset index in comparison mode
                            let targetPlayer = player;
                            let targetPercentiles = percentiles;

                            if (comparePlayer) {
                                // In comparison mode: dataset 0 is player, dataset 1 is comparePlayer
                                if (context.datasetIndex === 1) {
                                    targetPlayer = comparePlayer;
                                    targetPercentiles = playerToPercentiles(comparePlayer, axes, ranges);
                                }
                            }

                            const rawValue = targetPlayer[axis.key];
                            // Re-calculate percentile for tooltip to be safe or reuse if generic
                            // but context.raw gives the plotted value (percentile)
                            const percentile = context.raw;

                            return [
                                `${targetPlayer.name}:`,
                                `Value: ${typeof rawValue === 'number' ? rawValue.toFixed(2) : rawValue || '-'}`,
                                `Percentile: ${typeof percentile === 'number' ? percentile.toFixed(0) : 0}%`
                            ];
                        }
                    },
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            },
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: (context) => {
                            const axis = axes[context.index];
                            return axis ? axis.color : '#94a3b8';
                        },
                        font: {
                            size: 11,
                            weight: 500
                        }
                    },
                    ticks: {
                        display: false,
                        stepSize: 20
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            elements: {
                line: {
                    tension: 0.1
                }
            }
        }
    };

    if (existingChart) {
        existingChart.data = config.data;
        existingChart.options = config.options;
        existingChart.update();
        return existingChart;
    }

    return new Chart(ctx, config);
}

/**
 * Generate legend HTML
 */
export function generateLegend(axes) {
    const categories = [...new Set(axes.map(a => a.category))];

    return categories.map(cat => {
        const info = CATEGORY_COLORS[cat] || { label: cat, color: '#666' };
        return `
            <div class="legend-item">
                <span class="legend-color" style="background: ${info.color}"></span>
                <span>${info.label}</span>
            </div>
        `;
    }).join('');
}
