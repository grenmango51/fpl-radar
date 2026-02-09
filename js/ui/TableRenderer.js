import { Store } from '../state/store.js';
import {
    ATTACKER_AXES,
    DEFENDER_AXES
} from '../radar_chart.js';
import { sanitizeInput } from '../utils/utils.js';
import { TEAM_NAME_MAP } from '../utils/constants.js';

export class TableRenderer {
    constructor() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupTableScroll();
        this.subscribeToStore();
    }

    cacheElements() {
        this.tableTitle = document.getElementById('tableTitle');
        this.tableHead = document.getElementById('tableHead');
        this.tableBody = document.getElementById('tableBody');
        this.searchInput = document.getElementById('searchInput');
    }

    setupEventListeners() {
        // Additional listeners might be set up in renderTable for dynamic elements
    }

    subscribeToStore() {
        let lastState = {};
        Store.on('stateChange', (state) => {
            // Re-render if relevant data changes
            const shouldRender =
                state.players !== lastState.players ||
                state.currentView !== lastState.currentView ||
                state.filters !== lastState.filters ||
                state.sorting !== lastState.sorting ||
                state.searchTerm !== lastState.searchTerm ||
                state.selectedPlayer !== lastState.selectedPlayer; // Re-render to highlight selection

            if (shouldRender) {
                this.renderTable(state);
            }

            lastState = state;
        });
    }

    renderTable(state) {
        if (!state.players || state.players.length === 0) return;

        const view = state.currentView;
        const isAttacker = view === 'attackers';
        const axes = isAttacker ? ATTACKER_AXES : DEFENDER_AXES;

        // Update Title
        if (this.tableTitle) {
            this.tableTitle.textContent = isAttacker ? 'Attackers' : 'Defenders';
        }

        // Filter players
        let filteredPlayers = state.players.filter(p =>
            isAttacker ? p.classification === 'attacker' : p.classification === 'defender'
        );

        // Apply Min Total Minutes filter
        if (state.filters.minMinutes > 0) {
            filteredPlayers = filteredPlayers.filter(p => (p.minutes || p.Minutes || 0) >= state.filters.minMinutes);
        }

        // Apply search filter
        const searchTerm = (state.searchTerm || '').toLowerCase();
        if (searchTerm) {
            filteredPlayers = filteredPlayers.filter(p =>
                (p.name || '').toLowerCase().includes(searchTerm) ||
                (p.team || '').toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        if (state.sorting.key) {
            filteredPlayers.sort((a, b) => {
                let aVal, bVal;

                if (state.sorting.key === 'name') {
                    aVal = (a.name || '').toLowerCase();
                    bVal = (b.name || '').toLowerCase();
                    return state.sorting.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                } else if (state.sorting.key === 'team') {
                    aVal = (a.team || '').toLowerCase();
                    bVal = (b.team || '').toLowerCase();
                    return state.sorting.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                } else {
                    aVal = typeof a[state.sorting.key] === 'number' ? a[state.sorting.key] : -Infinity;
                    bVal = typeof b[state.sorting.key] === 'number' ? b[state.sorting.key] : -Infinity;
                    return state.sorting.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
            });
        }

        // Build sortable header
        const columns = [
            { key: 'name', label: 'Player' },
            { key: 'team', label: 'Team' },
            ...axes.map(a => ({ key: a.key, label: a.label }))
        ];

        this.tableHead.innerHTML = `
            <tr>
                ${columns.map(col => {
            const isSorted = state.sorting.key === col.key;
            const arrow = isSorted
                ? (state.sorting.direction === 'asc' ? ' ▲' : ' ▼')
                : '';
            return `<th class="sortable ${isSorted ? 'sorted' : ''}" data-sort-key="${col.key}">${col.label}${arrow}</th>`;
        }).join('')}
            </tr>
        `;

        // Add headers click listeners
        this.tableHead.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th.dataset.sortKey));
        });

        // Helper for teams
        const getShortTeamName = (name) => {
            if (!name) return '-';
            if (TEAM_NAME_MAP[name]) return name;
            const entry = Object.entries(TEAM_NAME_MAP).find(([key, val]) => val === name);
            return entry ? entry[0] : name;
        };

        // Render body
        this.tableBody.innerHTML = filteredPlayers.map((player, index) => `
            <tr data-index="${index}" class="${state.selectedPlayer === player ? 'selected' : ''}">
                <td class="player-name">${player.name || 'Unknown'}</td>
                <td><span class="team-badge">${getShortTeamName(player.team || player['Team'] || player['Squad'])}</span></td>
                ${axes.map(axis => {
            const value = player[axis.key];
            const display = typeof value === 'number' ? value.toFixed(2) : '-';
            return `<td class="stat-value">${display}</td>`;
        }).join('')}
            </tr>
        `).join('');

        // Row click listeners
        // Note: we need to map back index to actual player object in filtered list
        // Or store ID. Assuming filteredPlayers is what we rendered.
        this.tableBody.querySelectorAll('tr').forEach((row, idx) => {
            row.addEventListener('click', () => this.selectPlayer(filteredPlayers[idx]));
        });
    }

    handleSort(key) {
        const state = Store.getState();
        let direction = 'desc';

        if (state.sorting.key === key) {
            direction = state.sorting.direction === 'asc' ? 'desc' : 'asc';
        } else {
            direction = (key === 'name' || key === 'team') ? 'asc' : 'desc';
        }

        Store.setState({
            sorting: { key, direction }
        });
    }

    selectPlayer(player) {
        Store.setState({ selectedPlayer: player });
    }

    setupTableScroll() {
        const tableWrapper = document.querySelector('.table-wrapper');
        const scrollSlider = document.getElementById('tableScrollSlider');
        const scrollControls = document.querySelector('.table-scroll-controls');

        if (!tableWrapper || !scrollSlider || !scrollControls) return;

        const updateSlider = () => {
            const maxScroll = tableWrapper.scrollWidth - tableWrapper.clientWidth;
            if (maxScroll > 0) {
                scrollControls.style.display = 'block';
                scrollSlider.max = maxScroll;
                scrollSlider.value = tableWrapper.scrollLeft;
            } else {
                scrollControls.style.display = 'none';
            }
        };

        scrollSlider.addEventListener('input', (e) => {
            tableWrapper.scrollLeft = e.target.value;
        });

        tableWrapper.addEventListener('scroll', () => {
            scrollSlider.value = tableWrapper.scrollLeft;
        });

        window.addEventListener('resize', updateSlider);

        const observer = new MutationObserver(updateSlider);
        if (this.tableBody) {
            observer.observe(this.tableBody, { childList: true, subtree: true });
        }

        setTimeout(updateSlider, 100);
    }
}
