/**
 * Application State Management
 */
export const Store = {
    state: {
        files: {
            dump: null,
            shots: null,
            passes: null,
            defendingTeam: null,
            expectedTeam: null,
            fixtures: null
        },
        players: [],
        teamStats: {},
        fixtureData: {},
        currentView: 'attackers',
        filters: {
            minMinutes: 0
        },
        searchTerm: '',
        sorting: {
            key: null,
            direction: 'desc'  // 'asc' or 'desc'
        },
        selectedPlayer: null,
        autoLoadEnabled: true
    },

    events: new EventTarget(),

    /**
     * Subscribe to state changes or specific events
     * @param {string} eventName 
     * @param {Function} callback 
     */
    on(eventName, callback) {
        this.events.addEventListener(eventName, (e) => callback(e.detail));
    },

    /**
     * Emit an event
     * @param {string} eventName 
     * @param {any} data 
     */
    emit(eventName, data) {
        this.events.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },

    /**
     * Update state and notify listeners
     * @param {Object} partialState 
     */
    setState(partialState) {
        this.state = { ...this.state, ...partialState };
        this.emit('stateChange', this.state);
    },

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
};
