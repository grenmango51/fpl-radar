/**
 * Auto Loader - Automatically load HTML files from parent directory
 */

// File paths relative to the fpl-radar directory
const FILE_PATHS = {
    dump: '../stat dump _ Fantasy Football Scout Members Area.html',
    shots: '../StatsBomb - Shots _ Outfield Players _ Fantasy Football Scout Members Area.html',
    passes: '../StatsBomb - Passes _ Outfield Players _ Fantasy Football Scout Members Area.html',
    defendingTeam: '../Defending _ Team Stats _ Fantasy Football Scout Members Area.html',
    expectedTeam: '../Expected _ Team Stats _ Fantasy Football Scout Members Area.html',
    fixtures: '../Fixture Ticker _ Fantasy Football Scout Members Area.html'
};

/**
 * Automatically fetch all required files from the parent directory
 */
export async function autoLoadFiles() {
    const loadedFiles = {};
    const errors = [];

    console.log('🔄 Auto-loading files from parent directory...');

    for (const [fileType, filePath] of Object.entries(FILE_PATHS)) {
        try {
            console.log(`  Fetching ${fileType}: ${filePath}`);
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();
            loadedFiles[fileType] = content;
            console.log(`  ✅ Loaded ${fileType} (${(content.length / 1024).toFixed(1)} KB)`);

        } catch (error) {
            console.error(`  ❌ Failed to load ${fileType}:`, error.message);
            errors.push({ fileType, error: error.message });
        }
    }

    if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} file(s) failed to load:`, errors);
    }

    console.log(`✅ Auto-loaded ${Object.keys(loadedFiles).length}/${Object.keys(FILE_PATHS).length} files`);

    return { loadedFiles, errors };
}

/**
 * Check if all required files are available
 */
export function checkFilesAvailable(loadedFiles) {
    const required = ['dump', 'shots', 'passes', 'defendingTeam', 'expectedTeam'];
    const missing = required.filter(f => !loadedFiles[f]);

    if (missing.length > 0) {
        console.warn(`⚠️ Missing required files: ${missing.join(', ')}`);
        return false;
    }

    return true;
}
