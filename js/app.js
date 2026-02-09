/**
 * FPL Radar - Main Application
 */

import { Store } from './state/store.js';
import { DataService } from './services/DataService.js';
import { TableRenderer } from './ui/TableRenderer.js';
import { RadarRenderer } from './ui/RadarRenderer.js';
import { ControlsHandler } from './ui/ControlsHandler.js';
import { FileUploader } from './ui/FileUploader.js';
import {
    autoLoadFiles,
    checkFilesAvailable
} from './services/AutoLoader.js';

// DOM Elements needed for initial bootstrapping
const elements = {
    loadingMsg: document.getElementById('autoLoadingMessage'),
    manualArea: document.getElementById('manualUploadArea'),
    uploadSection: document.getElementById('uploadSection'),
    mainContent: document.getElementById('mainContent')
};

/**
 * Initialize the application
 */
async function init() {
    console.log('FPL Radar initializing...');

    // Instantiate UI Components
    new TableRenderer();
    new RadarRenderer();
    new ControlsHandler();
    new FileUploader();

    // Try to auto-load files
    if (Store.getState().autoLoadEnabled) {
        await tryAutoLoad();
    }
}

/**
 * Try to automatically load files from parent directory
 */
async function tryAutoLoad() {
    console.log('🚀 Attempting auto-load...');

    // Show loading message
    if (elements.loadingMsg) elements.loadingMsg.style.display = 'block';
    if (elements.manualArea) elements.manualArea.style.display = 'none';

    try {
        const { loadedFiles, errors } = await autoLoadFiles();

        // Hide loading, show manual area with status
        if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
        if (elements.manualArea) elements.manualArea.style.display = 'block';

        // Store the loaded content as strings
        Store.setState({
            files: {
                dump: loadedFiles.dump || null,
                shots: loadedFiles.shots || null,
                passes: loadedFiles.passes || null,
                defendingTeam: loadedFiles.defendingTeam || null,
                expectedTeam: loadedFiles.expectedTeam || null,
                fixtures: loadedFiles.fixtures || null
            }
        });

        // Check if we have all required files
        if (checkFilesAvailable(loadedFiles)) {
            console.log('✅ All required files auto-loaded successfully!');

            // Automatically start loading data
            await DataService.loadDataFromContent();

            // Show main content
            showMainContent();

        } else {
            console.warn('⚠️ Some required files missing. Please upload manually.');
            if (errors.length > 0) {
                console.error('Errors:', errors);
            }
        }

    } catch (error) {
        console.error('❌ Auto-load failed:', error);
        console.log('💡 Falling back to manual upload mode');
        if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
        if (elements.manualArea) elements.manualArea.style.display = 'block';
    }
}

/**
 * Show main content after data load
 */
function showMainContent() {
    elements.uploadSection.style.display = 'none';
    elements.mainContent.style.display = 'flex';
    elements.mainContent.classList.add('fade-in');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Start application
document.addEventListener('DOMContentLoaded', init);
