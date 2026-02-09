import { Store } from '../state/store.js';
import { debounce } from '../utils/utils.js';
import { SEARCH_DEBOUNCE_DELAY } from '../utils/constants.js';
import { showExportModal } from '../services/ExportService.js';

export class ControlsHandler {
    constructor() {
        this.cacheElements();
        this.setupEventListeners();
        this.subscribeToStore();
    }

    cacheElements() {
        this.attackersBtn = document.getElementById('attackersBtn');
        this.defendersBtn = document.getElementById('defendersBtn');
        this.minTotalMinutesFilter = document.getElementById('minTotalMinutesFilter');
        this.minMinutesValue = document.getElementById('minMinutesValue');
        this.searchInput = document.getElementById('searchInput');

        // Export button might be dynamic, check existence
        this.exportBtn = document.getElementById('exportBtn');
    }

    setupEventListeners() {
        // View toggle
        this.attackersBtn.addEventListener('click', () => this.switchView('attackers'));
        this.defendersBtn.addEventListener('click', () => this.switchView('defenders'));

        // Filters
        this.minTotalMinutesFilter.addEventListener('change', () => this.updateFilters());
        this.minTotalMinutesFilter.addEventListener('input', () => this.updateMinMinutesLabel());

        // Debounced search
        // Note: We need to bind `this` to updateFilters before debouncing
        this.searchInput.addEventListener('input', () => {
            const searchTerm = this.searchInput.value;
            Store.setState({ searchTerm });
        });

        // Export button
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.handleExport());
        }
    }

    subscribeToStore() {
        let lastState = {};
        Store.on('stateChange', (state) => {
            if (state.currentView !== lastState.currentView) {
                this.updateViewButtons(state.currentView);
            }

            // Handle max range update when players are loaded
            if (state.players && state.players !== lastState.players) {
                this.updateMinutesSliderRange(state.players);
            }

            // Check if we need to add export button (e.g. after data load)
            if (state.players && state.players.length > 0 && !this.exportBtn) {
                this.addExportButton();
            }
            lastState = state;
        });
    }

    updateMinutesSliderRange(players) {
        if (!this.minTotalMinutesFilter || !players || players.length === 0) return;

        // Find max minutes in the dataset
        const maxMinutes = Math.max(...players.map(p => {
            // Handle different minute properties if possible, but standard is 'minutes' (total)
            // Some parsers might output 'Minutes' or 'minutes'
            return p.minutes || p.Minutes || 0;
        }));

        this.minTotalMinutesFilter.max = maxMinutes > 0 ? maxMinutes : 3420;

        // Optional: Update bubble or label if needed? No, max attribute handles the range.

    }

    switchView(view) {
        Store.setState({ currentView: view, selectedPlayer: null });
    }

    updateViewButtons(view) {
        this.attackersBtn.classList.toggle('active', view === 'attackers');
        this.defendersBtn.classList.toggle('active', view === 'defenders');
    }

    updateMinMinutesLabel() {
        if (this.minMinutesValue) {
            this.minMinutesValue.textContent = `${this.minTotalMinutesFilter.value}+`;
        }
    }

    updateFilters() {
        const minMinutes = parseInt(this.minTotalMinutesFilter.value) || 0;
        this.updateMinMinutesLabel();

        Store.setState({
            filters: { ...Store.getState().filters, minMinutes }
        });
    }

    triggerRender() {
        // Since search isn't in store in original app (it read DOM), 
        // we can trigger a "noop" state update or better, add search to store.
        // Let's add search to store for purity, but `TableRenderer` reads input value currently.
        // If TableRenderer reads inputs, then just triggering a re-render is enough.
        // Store.setState({ ...Store.getState() }) will trigger listeners.
        // But better:
        Store.emit('stateChange', Store.getState());
    }

    addExportButton() {
        const controlsBar = document.querySelector('.controls-bar');
        if (!controlsBar) return;

        // Double check
        if (document.getElementById('exportBtn')) return;

        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportBtn';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '📥 Export Data';
        exportBtn.onclick = () => this.handleExport();

        controlsBar.appendChild(exportBtn);
        this.exportBtn = exportBtn;
    }

    handleExport() {
        const state = Store.getState();
        if (state.players && state.players.length > 0) {
            showExportModal(state.players, state.currentView);
        }
    }
}
