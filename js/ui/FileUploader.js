import { Store } from '../state/store.js';
import { DataService } from '../services/DataService.js';
import { DataManager } from '../logic/DataManager.js'; // Might not be needed if logic moved

export class FileUploader {
    constructor() {
        this.cacheElements();
        this.setupEventListeners();
        this.subscribeToStore();
    }

    cacheElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileStatus = document.getElementById('fileStatus');
        this.loadDataBtn = document.getElementById('loadDataBtn');
    }

    setupEventListeners() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        this.loadDataBtn.addEventListener('click', () => this.handleLoadData());
    }

    subscribeToStore() {
        Store.on('stateChange', (state) => {
            this.updateFileStatus(state.files);
            this.checkAllFilesLoaded(state.files);
        });
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    processFiles(files) {
        console.log(`Processing ${files.length} file(s)...`);

        const currentFiles = Store.getState().files;
        const newFiles = { ...currentFiles };
        let updated = false;

        files.forEach(file => {
            console.log(`Checking file: ${file.name}`);
            const fileType = DataService.identifyFile(file);

            if (fileType) {
                newFiles[fileType] = file;
                console.log(`  → Stored as: ${fileType}`);
                updated = true;
            } else {
                console.warn(`  ✗ File not recognized: ${file.name}`);
            }
        });

        if (updated) {
            Store.setState({ files: newFiles });
            console.log('Current state:', newFiles);
        }
    }

    updateFileStatus(files) {
        const fileMap = {
            dump: 'custom-dump',
            shots: 'shots',
            passes: 'passes',
            defendingTeam: 'defending-team',
            expectedTeam: 'expected-team',
            fixtures: 'fixtures'
        };

        Object.entries(fileMap).forEach(([key, dataAttr]) => {
            const item = this.fileStatus.querySelector(`[data-file="${dataAttr}"]`);
            const loaded = !!files[key];

            if (item) {
                item.classList.toggle('loaded', loaded);
                item.querySelector('.status-icon').textContent = loaded ? '✅' : '⬜';
            }
        });
    }

    checkAllFilesLoaded(files) {
        const requiredFiles = ['dump', 'shots', 'passes', 'defendingTeam', 'expectedTeam'];
        const allLoaded = requiredFiles.every(f => files[f] !== null);
        this.loadDataBtn.disabled = !allLoaded;
    }

    async handleLoadData() {
        this.loadDataBtn.textContent = 'Loading...';
        this.loadDataBtn.disabled = true;

        try {
            // Check if files are File objects (manual upload) or strings (auto-load)
            const state = Store.getState();
            // Assuming we determine how to load based on what's in the store or a flag.
            // For now, let's assume if they are File objects we use loadData, if strings loadDataFromContent.
            // But DataService methods were separate.
            // Simpler: DataService.loadData() handles File objects. DataService.loadDataFromContent() handles strings.

            const isFileObject = state.files.dump instanceof File;

            if (isFileObject) {
                await DataService.loadData();
            } else {
                // If they are strings (auto-loaded content)
                await DataService.loadDataFromContent();
            }

            // Success: transition from upload view to main content
            const uploadSection = document.getElementById('uploadSection');
            const mainContent = document.getElementById('mainContent');

            if (uploadSection) uploadSection.style.display = 'none';
            if (mainContent) {
                mainContent.style.display = 'flex';
                mainContent.classList.add('fade-in');
            }

            window.scrollTo(0, 0);
            console.log('✅ Data loaded successfully, showing main content.');

        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Please check the console for details.');
            this.loadDataBtn.textContent = 'Load Data';
            this.loadDataBtn.disabled = false;
        }
    }
}
