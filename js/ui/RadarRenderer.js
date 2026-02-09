import { Store } from '../state/store.js';
import {
    ATTACKER_AXES,
    DEFENDER_AXES,
    calculateStatRanges,
    createRadarChart,
    generateLegend
} from '../radar_chart.js';

export class RadarRenderer {
    constructor() {
        this.cacheElements();
        this.setupEventListeners();
        this.subscribeToStore();
        this.chartInstance = null;
        this.currentRadarPlayer = null; // Track who is currently on grid
    }

    cacheElements() {
        this.radarTitle = document.getElementById('radarTitle');
        this.generateRadarBtn = document.getElementById('generateRadarBtn');
        this.compareRadarBtn = document.getElementById('compareRadarBtn');
        this.radarChartCanvas = document.getElementById('radarChart');
        this.radarPlaceholder = document.getElementById('radarPlaceholder');
        this.radarLegend = document.getElementById('radarLegend');
    }

    setupEventListeners() {
        if (this.generateRadarBtn) {
            this.generateRadarBtn.addEventListener('click', () => this.generateRadar());
        }
        if (this.compareRadarBtn) {
            // Compare button click
            this.compareRadarBtn.addEventListener('click', () => this.generateComparisonRadar());
        }
    }

    subscribeToStore() {
        let lastState = {};
        Store.on('stateChange', (state) => {
            // Handle selection change
            if (state.selectedPlayer !== lastState.selectedPlayer) {
                this.updateSelectionState(state);
            }

            // Handle view change (reset radar)
            if (state.currentView !== lastState.currentView) {
                this.resetRadar();
                this.updateLegend(state.currentView);
            }

            lastState = state;
        });

        // Initialize legend
        // Wait for initial state to be populated or just default
        this.updateLegend(Store.getState().currentView);
    }

    updateSelectionState(state) {
        if (state.selectedPlayer) {
            this.radarTitle.textContent = state.selectedPlayer.name || 'Unknown Player';
            this.generateRadarBtn.disabled = false;

            // Enable compare button if:
            // 1. We have a radar already generated (currentRadarPlayer is set)
            // 2. The selected player is DIFFERENT from the one on the radar
            if (this.currentRadarPlayer &&
                this.currentRadarPlayer !== state.selectedPlayer) {
                this.compareRadarBtn.disabled = false;
            } else {
                this.compareRadarBtn.disabled = true;
            }
        } else {
            this.generateRadarBtn.disabled = true;
            this.compareRadarBtn.disabled = true;
        }
    }

    generateRadar() {
        const state = Store.getState();
        if (!state.selectedPlayer) return;

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library is not loaded. Please check your internet connection or script includes.');
            alert('Error: Chart.js library is not loaded. The radar chart cannot be generated without it.\n\nPlease check your internet connection if you are using the online CDN version.');
            return;
        }

        const isAttacker = state.currentView === 'attackers';
        const axes = isAttacker ? ATTACKER_AXES : DEFENDER_AXES;

        // Get all players of same type for percentile calculation, respecting filters
        const samePlayers = state.players.filter(p => {
            const isCorrectType = isAttacker ? p.classification === 'attacker' : p.classification === 'defender';
            // Use filters from state
            // Filter by Total Minutes (case insensitive check for minutes property)
            const playerMinutes = p.minutes || p.Minutes || 0;
            const hasEnoughMinutes = playerMinutes >= state.filters.minMinutes;
            return isCorrectType && hasEnoughMinutes;
        });

        // Calculate stat ranges
        const ranges = calculateStatRanges(samePlayers, axes);

        // Hide placeholder
        if (this.radarPlaceholder) {
            this.radarPlaceholder.style.display = 'none';
        }

        // Create/update chart
        if (this.radarChartCanvas) {
            const ctx = this.radarChartCanvas.getContext('2d');
            try {
                this.chartInstance = createRadarChart(
                    ctx,
                    state.selectedPlayer,
                    axes,
                    ranges,
                    this.chartInstance
                );

                // Update current radar player tracking
                this.currentRadarPlayer = state.selectedPlayer;

                // Update buttons state
                this.updateSelectionState(state);

            } catch (error) {
                console.error('Failed to generate radar chart:', error);
                alert(`An error occurred while generating the radar chart:\n${error.message}\n\nPlease check the console for more details.`);
                // Restore placeholder if failed
                if (this.radarPlaceholder) {
                    this.radarPlaceholder.style.display = 'flex';
                }
            }
        }
    }

    generateComparisonRadar() {
        const state = Store.getState();
        // Check preconditions
        if (!state.selectedPlayer || !this.currentRadarPlayer) return;

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library is not loaded.');
            return;
        }

        const isAttacker = state.currentView === 'attackers';
        const axes = isAttacker ? ATTACKER_AXES : DEFENDER_AXES;

        // Get filter set
        const samePlayers = state.players.filter(p => {
            const isCorrectType = isAttacker ? p.classification === 'attacker' : p.classification === 'defender';
            const playerMinutes = p.minutes || p.Minutes || 0;
            return isCorrectType && (playerMinutes >= state.filters.minMinutes);
        });

        const ranges = calculateStatRanges(samePlayers, axes);

        // Update chart with comparison
        if (this.radarChartCanvas) {
            const ctx = this.radarChartCanvas.getContext('2d');
            try {
                // Pass both players: 
                // 1. this.currentRadarPlayer (the original one, Player A)
                // 2. state.selectedPlayer (the new one to compare, Player B)
                this.chartInstance = createRadarChart(
                    ctx,
                    this.currentRadarPlayer,
                    axes,
                    ranges,
                    this.chartInstance,
                    state.selectedPlayer // The comparison player
                );

                // Note: We do NOT update this.currentRadarPlayer, 
                // because we want the "Generate Radar" button to still be able to 
                // overwrite the whole view with the NEW player if clicked.

            } catch (error) {
                console.error('Failed to generate comparison chart:', error);
                alert(`Error generating comparison:\n${error.message}`);
            }
        }
    }

    resetRadar() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        this.currentRadarPlayer = null;
        if (this.radarPlaceholder) {
            this.radarPlaceholder.style.display = 'flex'; // Restore placeholder
        }
        // Maybe clear canvas
    }

    updateLegend(view) {
        const isAttacker = view === 'attackers';
        const axes = isAttacker ? ATTACKER_AXES : DEFENDER_AXES;

        if (this.radarLegend) {
            this.radarLegend.innerHTML = generateLegend(axes);
        }
    }
}

