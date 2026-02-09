/**
 * FPL Radar - Data Export Module
 * Handles exporting player data in various formats
 */

import { downloadBlob, formatDate } from '../utils/utils.js';
import { ATTACKER_AXES, DEFENDER_AXES } from '../radar_chart.js';

/**
 * Export all player data as JSON
 * @param {Array} players - Array of player objects
 */
export function exportAsJSON(players) {
    const data = {
        exportDate: new Date().toISOString(),
        totalPlayers: players.length,
        version: '1.0',
        source: 'FPL Radar - Fantasy Football Scout',
        players: players
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `fpl-data-${formatDate()}.json`);
}

/**
 * Export current view as CSV
 * @param {Array} players - Array of player objects
 * @param {string} view - Current view ('attackers' or 'defenders')
 */
export function exportAsCSV(players, view) {
    const axes = view === 'attackers' ? ATTACKER_AXES : DEFENDER_AXES;

    // Create CSV header
    const headers = ['Name', 'Team', 'Position', 'Cost', 'Minutes', 'Starts', ...axes.map(a => a.label)];

    // Create CSV rows
    const rows = players.map(p => [
        p.name || '',
        p.team || '',
        p.position || '',
        p.cost || '',
        p.minutes || 0,
        p.starts || 0,
        ...axes.map(a => {
            const value = p[a.key];
            return typeof value === 'number' ? value.toFixed(2) : '';
        })
    ]);

    // Combine into CSV string
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `fpl-${view}-${formatDate()}.csv`);
}

/**
 * Show export modal and handle user choice
 * @param {Array} players - Array of player objects
 * @param {string} currentView - Current view ('attackers' or 'defenders')
 */
export function showExportModal(players, currentView) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.innerHTML = `
        <div class="export-modal-content">
            <h3>📥 Export Data</h3>
            <p>Choose export format:</p>
            <div class="export-options">
                <button class="btn btn-primary" id="exportJSON">
                    📄 Export All Data (JSON)
                </button>
                <button class="btn btn-primary" id="exportCSV">
                    📊 Export Current View (CSV)
                </button>
                <button class="btn btn-secondary" id="exportCancel">
                    Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle button clicks
    document.getElementById('exportJSON').onclick = () => {
        exportAsJSON(players);
        document.body.removeChild(modal);
    };

    document.getElementById('exportCSV').onclick = () => {
        const filteredPlayers = players.filter(p =>
            p.classification === (currentView === 'attackers' ? 'attacker' : 'defender')
        );
        exportAsCSV(filteredPlayers, currentView);
        document.body.removeChild(modal);
    };

    document.getElementById('exportCancel').onclick = () => {
        document.body.removeChild(modal);
    };

    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}
