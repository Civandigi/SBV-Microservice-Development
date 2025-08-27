// Enhanced Gesuch Manager with Real Service Integration
// SBV Professional V2 - Phase 3 Implementation
// Erweitert das bestehende demo-gesuch.js System

class GesuchManagerWithService {
    constructor() {
        this.currentJobId = null;
        this.currentGesuchId = null;
        this.progressState = 'idle';
        
        // Initialize WebSocket connections
        this.initWebSocket();
        
        // Bind methods
        this.uploadGesuch = this.uploadGesuch.bind(this);
        this.handleProcessingComplete = this.handleProcessingComplete.bind(this);
        this.handleExportReady = this.handleExportReady.bind(this);
        
        console.log('✅ Enhanced Gesuch Manager initialized');
    }
    
    initWebSocket() {
        if (typeof window.wsManager !== 'undefined') {
            // Set up event listeners for gesuch-related events
            window.wsManager.on('gesuch-processed', this.handleProcessingComplete);
            window.wsManager.on('rapporte-ready', this.handleExportReady);
            window.wsManager.on('export-ready', this.handleExportReady);
            window.wsManager.on('job-progress', this.handleJobProgress.bind(this));
            window.wsManager.on('service-status', this.handleServiceStatus.bind(this));
            
            console.log('✅ WebSocket gesuch events connected');
        } else {
            console.warn('⚠️ WebSocket manager not available, using polling fallback');
        }
    }
    
    // Enhanced version of the upload process
    async uploadGesuch(formData) {
        const uploadBtn = document.getElementById('uploadBtn');
        const progressDiv = document.getElementById('demoProgress');
        
        if (!uploadBtn || !progressDiv) {
            console.error('Required elements not found');
            return;
        }
        
        try {
            this.progressState = 'uploading';
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Wird hochgeladen...';
            
            // Show initial upload progress
            this.showProgress('upload', 'Dokument wird hochgeladen...');
            
            // Make API call to real backend
            const response = await fetch(`${window.API_BASE_URL || ''}/api/gesuch/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.currentGesuchId = result.gesuchId;
                this.currentJobId = result.jobId;
                
                if (result.status === 'processing') {
                    // Microservice is processing
                    this.progressState = 'processing';
                    this.showProgress('processing', 'Dokument wird automatisch verarbeitet...', result.jobId);
                    
                    // Start status polling as fallback
                    this.startStatusPolling();
                } else if (result.status === 'manual') {
                    // Fallback to manual mode
                    this.progressState = 'manual';
                    this.showManualMode();
                }
            } else {
                throw new Error(result.message || 'Upload failed');
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showError(error.message);
        }
    }
    
    showProgress(type, message, jobId = null) {
        const progressDiv = document.getElementById('demoProgress');
        if (!progressDiv) return;
        
        let iconHtml = '';
        let bgColor = 'bg-blue-50 border-blue-200';
        
        switch (type) {
            case 'upload':
                iconHtml = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>';
                break;
            case 'processing':
                iconHtml = '<div class="animate-pulse rounded-full h-4 w-4 bg-blue-600 mr-3"></div>';
                break;
            case 'completed':
                iconHtml = '<div class="rounded-full h-4 w-4 bg-green-600 mr-3 flex items-center justify-center"><svg class="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8"><path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/></svg></div>';
                bgColor = 'bg-green-50 border-green-200';
                break;
            case 'error':
                iconHtml = '<div class="rounded-full h-4 w-4 bg-red-600 mr-3 flex items-center justify-center"><span class="text-white text-xs">!</span></div>';
                bgColor = 'bg-red-50 border-red-200';
                break;
        }
        
        progressDiv.className = 'mb-4';
        progressDiv.innerHTML = `
            <div class="${bgColor} border rounded p-4">
                <div class="flex items-center mb-2">
                    ${iconHtml}
                    <span class="font-semibold">${message}</span>
                </div>
                ${jobId ? `<div class="text-xs text-gray-500 mt-1">Job ID: ${jobId}</div>` : ''}
                ${this.getServiceStatusIndicator()}
            </div>
        `;
    }
    
    getServiceStatusIndicator() {
        return `
            <div class="mt-2 text-xs">
                <div class="flex items-center gap-2">
                    <div class="flex items-center">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <span>Microservice Status: Aktiv</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    showManualMode() {
        const progressDiv = document.getElementById('demoProgress');
        if (!progressDiv) return;
        
        progressDiv.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-400 rounded p-4">
                <h3 class="font-bold text-yellow-800 mb-2">Manuelle Verarbeitung erforderlich</h3>
                <p class="text-sm mb-3">Das Dokument konnte nicht automatisch verarbeitet werden. Bitte geben Sie die Teilprojekte manuell ein:</p>
                <button onclick="this.showManualInput()" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                    Teilprojekte manuell eingeben
                </button>
            </div>
        `;
    }
    
    showError(message) {
        this.progressState = 'error';
        this.showProgress('error', `Fehler: ${message}`);
        
        // Re-enable upload button
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Erneut versuchen';
        }
    }
    
    // WebSocket event handlers
    handleProcessingComplete(data) {
        if (data.gesuchId !== this.currentGesuchId) return;
        
        console.log('📄 Gesuch processing completed:', data);
        
        if (data.status === 'completed' && data.teilprojekte) {
            this.progressState = 'completed';
            this.showProcessingSuccess(data.teilprojekte);
        } else if (data.status === 'failed') {
            this.showError(data.error || 'Verarbeitung fehlgeschlagen');
        }
    }
    
    handleExportReady(data) {
        if (data.gesuchId !== this.currentGesuchId) return;
        
        console.log('📤 Export ready:', data);
        this.showExportReady(data.downloadUrl);
    }
    
    handleJobProgress(data) {
        if (data.jobId !== this.currentJobId) return;
        
        console.log('⏳ Job progress:', data);
        
        let progressMessage = 'Verarbeitung läuft...';
        if (data.progress) {
            progressMessage = `${data.stage || 'Verarbeitung'}: ${data.progress}%`;
        }
        
        this.showProgress('processing', progressMessage, data.jobId);
    }
    
    handleServiceStatus(data) {
        console.log('🔧 Service status update:', data);
        // Update service status indicator
        this.updateServiceStatusIndicator(data);
    }
    
    showProcessingSuccess(teilprojekte) {
        const progressDiv = document.getElementById('demoProgress');
        if (!progressDiv) return;
        
        let teilprojekteHtml = '';
        let totalBudget = 0;
        
        teilprojekte.forEach((tp, index) => {
            const budget = parseFloat(tp.budget) || 0;
            totalBudget += budget;
            
            teilprojekteHtml += `
                <div class="flex justify-between bg-white p-2 rounded">
                    <span>TP${index + 1} - ${tp.name}</span>
                    <span class="font-semibold">CHF ${budget.toLocaleString()}</span>
                </div>
            `;
        });
        
        progressDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded p-4">
                <h3 class="font-bold text-green-800 mb-3">✅ Erfolgreich verarbeitet</h3>
                <p class="text-sm mb-3">${teilprojekte.length} Teilprojekte wurden automatisch erkannt:</p>
                <div class="space-y-2 text-sm">
                    ${teilprojekteHtml}
                    <div class="border-t pt-2 mt-2 flex justify-between font-bold">
                        <span>Gesamtbudget:</span>
                        <span>CHF ${totalBudget.toLocaleString()}</span>
                    </div>
                </div>
                <button onclick="gesuchManager.createRapporte()" class="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                    Rapporte erstellen
                </button>
            </div>
        `;
        
        // Hide upload button
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) uploadBtn.style.display = 'none';
    }
    
    async createRapporte() {
        if (!this.currentGesuchId) {
            console.error('No gesuch ID available');
            return;
        }
        
        const progressDiv = document.getElementById('demoProgress');
        
        try {
            // Show creating progress
            progressDiv.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded p-4">
                    <div class="flex items-center mb-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                        <span class="font-semibold">Rapporte werden erstellt...</span>
                    </div>
                    <div class="text-sm text-gray-600">Rapport-Templates werden generiert...</div>
                </div>
            `;
            
            // API call to create rapporte
            const response = await fetch(`${window.API_BASE_URL || ''}/api/gesuch/${this.currentGesuchId}/create-rapporte`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Rapport creation failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Show success and redirect
                progressDiv.innerHTML = `
                    <div class="bg-green-100 border border-green-400 rounded p-4">
                        <h3 class="font-bold text-green-800 mb-2">✅ Rapporte erfolgreich erstellt</h3>
                        <p class="mb-3">${result.count || 'Mehrere'} Rapporte wurden erstellt und sind bereit zur Bearbeitung!</p>
                        <div class="text-sm text-gray-600 mb-3">
                            Weiterleitung zur Rapport-Seite in 3 Sekunden...
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full animate-pulse" style="width: 100%"></div>
                        </div>
                    </div>
                `;
                
                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'pages/rapport.html';
                }, 3000);
            } else {
                throw new Error(result.message || 'Rapport creation failed');
            }
            
        } catch (error) {
            console.error('Rapport creation error:', error);
            progressDiv.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-400 rounded p-4">
                    <p class="text-yellow-800">⚠️ ${error.message}</p>
                    <button onclick="window.location.href='pages/rapport.html'" class="mt-2 text-blue-600 underline">
                        Zur Rapport-Seite
                    </button>
                </div>
            `;
        }
    }
    
    // Status polling fallback (if WebSocket fails)
    startStatusPolling() {
        if (!this.currentJobId) return;
        
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${window.API_BASE_URL || ''}/api/gesuch/status/${this.currentJobId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                
                if (response.ok) {
                    const status = await response.json();
                    
                    if (status.status === 'completed') {
                        clearInterval(pollInterval);
                        this.handleProcessingComplete({
                            gesuchId: this.currentGesuchId,
                            status: 'completed',
                            teilprojekte: status.result?.teilprojekte || []
                        });
                    } else if (status.status === 'failed') {
                        clearInterval(pollInterval);
                        this.showError(status.error || 'Verarbeitung fehlgeschlagen');
                    }
                }
            } catch (error) {
                console.error('Status polling error:', error);
                clearInterval(pollInterval);
            }
        }, 3000); // Poll every 3 seconds
        
        // Stop polling after 5 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
        }, 300000);
    }
    
    updateServiceStatusIndicator(statusData) {
        const statusElements = document.querySelectorAll('.service-status-indicator');
        statusElements.forEach(element => {
            // Update service status display
            element.innerHTML = `
                <div class="flex items-center gap-2 text-xs">
                    <div class="w-2 h-2 ${statusData.healthy ? 'bg-green-500' : 'bg-red-500'} rounded-full"></div>
                    <span>Microservice: ${statusData.healthy ? 'Aktiv' : 'Nicht verfügbar'}</span>
                </div>
            `;
        });
    }
}

// Initialize enhanced gesuch manager
let gesuchManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        gesuchManager = new GesuchManagerWithService();
    });
} else {
    gesuchManager = new GesuchManagerWithService();
}

// Export for global access
window.gesuchManager = gesuchManager;