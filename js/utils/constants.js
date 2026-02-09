/**
 * FPL Radar - Constants and Configuration
 * Centralized configuration for the application
 */

export const PLAYER_COST_RANGE = {
    MIN: 3.0,
    MAX: 16.0
};

// Match and time constants
export const MINUTES_PER_MATCH = 90;

// Fuzzy matching configuration
export const FUZZY_MATCH_THRESHOLD = 0.85; // 85% similarity required

// Percentile calculation
export const PERCENTILE_TIE_WEIGHT = 0.5;

// UI Configuration
export const MAX_PLAYER_COMPARISONS = 3;
export const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds
export const PROGRESS_ANIMATION_DELAY = 500; // milliseconds

// File type identifiers
export const FILE_TYPES = {
    DUMP: 'dump',
    SHOTS: 'shots',
    PASSES: 'passes',
    DEFENDING_TEAM: 'defendingTeam',
    EXPECTED_TEAM: 'expectedTeam',
    FIXTURES: 'fixtures'
};

// Required files for data loading
export const REQUIRED_FILES = [
    FILE_TYPES.DUMP,
    FILE_TYPES.SHOTS,
    FILE_TYPES.PASSES,
    FILE_TYPES.DEFENDING_TEAM,
    FILE_TYPES.EXPECTED_TEAM
];

// Team mapping for stats matching (Abbr -> Full Name)
export const TEAM_NAME_MAP = {
    'ARS': 'Arsenal',
    'AVL': 'Aston Villa',
    'BOU': 'Bournemouth',
    'BRE': 'Brentford',
    'BHA': 'Brighton and Hove Albion',
    'BUR': 'Burnley',
    'CHE': 'Chelsea',
    'CRY': 'Crystal Palace',
    'EVE': 'Everton',
    'FUL': 'Fulham',
    'IPS': 'Ipswich Town',
    'LEI': 'Leicester City',
    'LIV': 'Liverpool',
    'MCI': 'Manchester City',
    'MUN': 'Manchester United',
    'NEW': 'Newcastle United',
    'NFO': 'Nottingham Forest',
    'SOU': 'Southampton',
    'TOT': 'Tottenham Hotspur',
    'WHU': 'West Ham United',
    'WOL': 'Wolverhampton Wanderers'
};
