// DEMO Gesuch Upload - Garantiert erfolgreich!

function openGesuchUploadDemo() {
    const modal = document.createElement('div');
    modal.id = 'gesuchModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 class="text-2xl font-bold mb-4">Gesuch hochladen</h2>
            
            <form id="gesuchUploadForm">
                <div class="mb-4">
                    <label class="block text-sm font-semibold mb-2">Jahr</label>
                    <input type="number" id="gesuchJahr" value="2024" class="w-full border rounded-lg px-3 py-2" required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold mb-2">Titel</label>
                    <input type="text" id="gesuchTitel" value="Förderantrag 2024" class="w-full border rounded-lg px-3 py-2" required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-semibold mb-2">Dokument (PDF/Word)</label>
                    <input type="file" id="gesuchFile" accept=".pdf,.doc,.docx" class="w-full border rounded-lg px-3 py-2" required>
                </div>
                
                <div id="demoProgress" class="hidden mb-4">
                    <!-- Progress wird hier angezeigt -->
                </div>
                
                <div class="flex justify-end gap-3">
                    <button type="button" onclick="closeDemoModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-100">
                        Abbrechen
                    </button>
                    <button type="submit" id="uploadBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Hochladen & Verarbeiten
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('gesuchUploadForm').onsubmit = function(e) {
        e.preventDefault();
        startDemoUpload();
    };
}

async function startDemoUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const progressDiv = document.getElementById('demoProgress');
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Wird verarbeitet...';
    
    // Zeige Progress
    progressDiv.className = 'mb-4';
    progressDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded p-4">
            <div class="flex items-center mb-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span class="font-semibold">Dokument wird analysiert...</span>
            </div>
            <div class="text-sm text-gray-600">Textextraktion läuft...</div>
        </div>
    `;
    
    // Verarbeitung (3.5 Sekunden für realistischeres Gefühl)
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    // Zeige Erfolg
    progressDiv.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded p-4">
            <h3 class="font-bold text-green-800 mb-3">Erfolgreich verarbeitet</h3>
            <p class="text-sm mb-3">6 Teilprojekte wurden automatisch erkannt:</p>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between bg-white p-2 rounded">
                    <span>TP1 - Leitmedien</span>
                    <span class="font-semibold">CHF 1'650'000</span>
                </div>
                <div class="flex justify-between bg-white p-2 rounded">
                    <span>TP2 - Onlinemedien</span>
                    <span class="font-semibold">CHF 920'000</span>
                </div>
                <div class="flex justify-between bg-white p-2 rounded">
                    <span>TP3 - TV</span>
                    <span class="font-semibold">CHF 410'000</span>
                </div>
                <div class="flex justify-between bg-white p-2 rounded">
                    <span>TP4 - Radio</span>
                    <span class="font-semibold">CHF 740'000</span>
                </div>
                <div class="flex justify-between bg-white p-2 rounded">
                    <span>TP5 - Bevölkerung</span>
                    <span class="font-semibold">CHF 450'000</span>
                </div>
                <div class="flex justify-between bg-white p-2 rounded">
                    <span>TP6 - Weiterbildung</span>
                    <span class="font-semibold">CHF 240'000</span>
                </div>
                <div class="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Gesamtbudget:</span>
                    <span>CHF 4'410'000</span>
                </div>
            </div>
            <button onclick="createDemoRapporte()" class="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                Rapporte erstellen
            </button>
        </div>
    `;
    
    uploadBtn.style.display = 'none';
}

async function createDemoRapporte() {
    const progressDiv = document.getElementById('demoProgress');
    
    // Zeige Erstellung
    progressDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded p-4">
            <div class="flex items-center mb-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span class="font-semibold">Rapporte werden erstellt...</span>
            </div>
            <div class="text-sm text-gray-600">6 Rapporte werden generiert...</div>
        </div>
    `;
    
    // API Call zum Mock-Backend
    try {
        const response = await fetch(`${window.API_BASE_URL || ''}/api/gesuch/123/create-rapporte`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        
        // Zeige Erfolg
        progressDiv.innerHTML = `
            <div class="bg-green-100 border border-green-400 rounded p-4">
                <h3 class="font-bold text-green-800 mb-2">Rapporte erfolgreich erstellt</h3>
                <p class="mb-3">6 Rapporte wurden erstellt und sind bereit zur Bearbeitung!</p>
                <div class="text-sm text-gray-600 mb-3">
                    Weiterleitung zur Rapport-Seite in 3 Sekunden...
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-green-600 h-2 rounded-full animate-pulse" style="width: 100%"></div>
                </div>
            </div>
        `;
        
        // Archiv-Ordner hinzufügen
        addArchiveFolder();
        
        // Weiterleitung nach 3 Sekunden
        setTimeout(() => {
            window.location.href = 'rapport.html';
        }, 3000);
        
    } catch (error) {
        console.error('Demo error:', error);
        progressDiv.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-400 rounded p-4">
                <p>Rapporte wurden erstellt</p>
                <button onclick="window.location.href='rapport.html'" class="mt-2 text-blue-600 underline">
                    Zur Rapport-Seite
                </button>
            </div>
        `;
    }
}

function closeDemoModal() {
    const modal = document.getElementById('gesuchModal');
    if (modal) modal.remove();
}

// Füge neuen Archiv-Ordner hinzu
function addArchiveFolder() {
    // Hole das Jahr aus dem Formular
    const jahr = document.getElementById('gesuchJahr').value;
    
    // Prüfe ob Archiv-Grid existiert
    const archiveGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6');
    if (!archiveGrid) return;
    
    // Prüfe ob Ordner schon existiert
    const existingFolders = archiveGrid.querySelectorAll('.folder-card');
    for (let folder of existingFolders) {
        if (folder.querySelector('h3').textContent === jahr) {
            // Ordner existiert schon, aktualisiere nur die Anzahl
            const countElement = folder.querySelector('.text-3xl');
            if (countElement) {
                const currentCount = parseInt(countElement.textContent) || 0;
                countElement.textContent = currentCount + 6; // 6 neue Rapporte
            }
            return;
        }
    }
    
    // Erstelle neuen Ordner
    const newFolder = document.createElement('div');
    newFolder.className = 'folder-card';
    newFolder.innerHTML = `
        <div class="flex flex-col items-center">
            <svg fill="var(--color-primary)" height="80" viewBox="0 0 24 24" width="80" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
            <h3 class="text-xl font-bold mt-2 text-[var(--color-text-primary)]">${jahr}</h3>
            <p class="text-sm text-[var(--color-text-secondary)] mt-1">6 neue Dokumente</p>
            <div class="flex items-center gap-4 mt-4">
                <div class="text-center">
                    <p class="text-3xl font-bold text-[var(--color-primary)]">6</p>
                    <p class="text-xs text-[var(--color-text-secondary)]">Rapporte</p>
                </div>
                <div class="text-center">
                    <p class="text-3xl font-bold text-[var(--color-secondary)]">1</p>
                    <p class="text-xs text-[var(--color-text-secondary)]">Gesuch</p>
                </div>
            </div>
        </div>
    `;
    
    newFolder.onclick = function() { 
        openArchive(jahr); 
    };
    
    // Füge neuen Ordner am Anfang hinzu
    archiveGrid.insertBefore(newFolder, archiveGrid.firstChild);
    
    // Animiere den neuen Ordner
    newFolder.style.animation = 'fadeIn 0.5s ease-in';
}

// Überschreibe die normale Funktion mit der Demo-Version
window.openGesuchUpload = openGesuchUploadDemo;