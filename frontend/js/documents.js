// SBV Professional V2 - Dokumente Management
// Verwaltung von Dokumenten mit Upload, Download, Ansicht und Löschen

// Import dependencies
import { showSuccess, showError, showWarning, showInfo } from './notifications.js';
import './modal.js';
import './config.js';

// Global variables
let documents = [];
let currentFilter = 'all';
let searchQuery = '';

// API helper
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    };

    const response = await fetch(`${window.API_BASE_URL}${endpoint}`, {
        ...options,
        ...defaultOptions,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    });

    if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '../login.html';
        return;
    }

    return response;
}

// Document upload function
window.uploadDocument = async function() {
    const modalId = window.modalSystem.createFormModal({
        title: 'Dokument hochladen',
        fields: [
            {
                type: 'file',
                name: 'file',
                label: 'Datei auswählen',
                required: true,
                accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg'
            },
            {
                type: 'text',
                name: 'title',
                label: 'Dokumenttitel',
                required: true,
                placeholder: 'z.B. Antrag Formular 2025'
            },
            {
                type: 'select',
                name: 'category',
                label: 'Kategorie',
                required: true,
                options: [
                    { value: 'formulare', label: 'Formulare' },
                    { value: 'richtlinien', label: 'Richtlinien' },
                    { value: 'vorlagen', label: 'Vorlagen' },
                    { value: 'berichte', label: 'Berichte' }
                ]
            },
            {
                type: 'textarea',
                name: 'description',
                label: 'Beschreibung',
                placeholder: 'Kurze Beschreibung des Dokuments',
                required: false
            }
        ],
        onSubmit: async (data) => {
            try {
                const formData = new FormData();
                const fileInput = document.querySelector('input[name="file"]');
                
                if (!fileInput.files[0]) {
                    showError('Bitte wählen Sie eine Datei aus');
                    return;
                }

                formData.append('file', fileInput.files[0]);
                formData.append('title', data.title);
                formData.append('category', data.category);
                formData.append('description', data.description || '');

                const response = await apiRequest('/api/documents', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    showSuccess('Dokument erfolgreich hochgeladen');
                    window.modalSystem.close(modalId);
                    await loadDocuments();
                } else {
                    const error = await response.json();
                    showError(error.message || 'Fehler beim Hochladen');
                }
            } catch (error) {
                showError('Netzwerkfehler beim Hochladen');
                console.error('Upload error:', error);
            }
        }
    });

    window.modalSystem.open(modalId);
};

// Load documents from server
async function loadDocuments() {
    try {
        const response = await apiRequest('/api/documents');
        
        if (response.ok) {
            const data = await response.json();
            documents = data.documents || [];
            renderDocuments();
            updateCategoryStats();
        } else {
            showError('Fehler beim Laden der Dokumente');
        }
    } catch (error) {
        showError('Netzwerkfehler beim Laden der Dokumente');
        console.error('Load error:', error);
    }
}

// Render documents table
function renderDocuments() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    // Filter documents
    let filteredDocs = documents;
    
    if (currentFilter !== 'all') {
        filteredDocs = filteredDocs.filter(doc => doc.category === currentFilter);
    }
    
    if (searchQuery) {
        filteredDocs = filteredDocs.filter(doc => 
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Clear table
    tbody.innerHTML = '';

    if (filteredDocs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Keine Dokumente gefunden
                </td>
            </tr>
        `;
        return;
    }

    // Render documents
    filteredDocs.forEach(doc => {
        const row = createDocumentRow(doc);
        tbody.appendChild(row);
    });
}

// Create document row
function createDocumentRow(doc) {
    const tr = document.createElement('tr');
    
    const fileIcon = getFileIcon(doc.filename);
    const categoryColor = getCategoryColor(doc.category);
    const fileSize = formatFileSize(doc.file_size);
    const uploadDate = formatDate(doc.created_at);
    
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                ${fileIcon}
                <div>
                    <div class="text-sm font-medium text-[var(--color-text-primary)]">${doc.title}</div>
                    <div class="text-sm text-[var(--color-text-secondary)]">${doc.filename}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryColor}">
                ${getCategoryLabel(doc.category)}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">${fileSize}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">${uploadDate}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="downloadDocument(${doc.id})">
                <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                </svg>
            </button>
            <button class="text-green-600 hover:text-green-900 mr-3" onclick="viewDocument(${doc.id})">
                <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                </svg>
            </button>
            <button class="text-red-600 hover:text-red-900" onclick="deleteDocument(${doc.id})">
                <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
        </td>
    `;
    
    return tr;
}

// Get file icon based on extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    let color = 'text-gray-600';
    let icon = 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z';
    
    if (['pdf'].includes(ext)) {
        color = 'text-red-600';
    } else if (['doc', 'docx'].includes(ext)) {
        color = 'text-blue-600';
        icon = 'M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M17,11H7V13H17V11M17,15H7V17H17V15Z';
    } else if (['xls', 'xlsx'].includes(ext)) {
        color = 'text-green-600';
        icon = 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z';
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
        color = 'text-purple-600';
        icon = 'M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z';
    }
    
    return `<svg class="w-8 h-8 ${color} mr-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="${icon}"/>
    </svg>`;
}

// Get category color
function getCategoryColor(category) {
    const colors = {
        formulare: 'bg-blue-100 text-blue-800',
        richtlinien: 'bg-green-100 text-green-800',
        vorlagen: 'bg-purple-100 text-purple-800',
        berichte: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
}

// Get category label
function getCategoryLabel(category) {
    const labels = {
        formulare: 'Formulare',
        richtlinien: 'Richtlinien',
        vorlagen: 'Vorlagen',
        berichte: 'Berichte'
    };
    return labels[category] || category;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Gestern';
    } else {
        return date.toLocaleDateString('de-DE');
    }
}

// Update category statistics
function updateCategoryStats() {
    const categories = {
        formulare: 0,
        richtlinien: 0,
        vorlagen: 0,
        berichte: 0
    };
    
    documents.forEach(doc => {
        if (categories.hasOwnProperty(doc.category)) {
            categories[doc.category]++;
        }
    });
    
    // Update UI
    Object.keys(categories).forEach(cat => {
        const element = document.querySelector(`[data-category="${cat}"] .text-sm.text-\\[var\\(--color-text-secondary\\)\\]`);
        if (element) {
            element.textContent = `${categories[cat]} Dokumente`;
        }
    });
}

// Download document
async function downloadDocument(id) {
    try {
        const response = await apiRequest(`/api/documents/${id}/download`);
        
        if (response.ok) {
            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                : 'dokument';
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess('Download gestartet');
        } else {
            showError('Fehler beim Download');
        }
    } catch (error) {
        showError('Netzwerkfehler beim Download');
        console.error('Download error:', error);
    }
}

// View document
async function viewDocument(id) {
    try {
        const response = await apiRequest(`/api/documents/${id}/view`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
        } else {
            showError('Fehler beim Anzeigen des Dokuments');
        }
    } catch (error) {
        showError('Netzwerkfehler beim Anzeigen');
        console.error('View error:', error);
    }
}

// Delete document
async function deleteDocument(id) {
    const confirmed = await window.modalSystem.confirm({
        title: 'Dokument löschen',
        message: 'Möchten Sie dieses Dokument wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        confirmText: 'Löschen',
        cancelText: 'Abbrechen',
        danger: true
    });
    
    if (!confirmed) return;
    
    try {
        const response = await apiRequest(`/api/documents/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Dokument erfolgreich gelöscht');
            await loadDocuments();
        } else {
            const error = await response.json();
            showError(error.message || 'Fehler beim Löschen');
        }
    } catch (error) {
        showError('Netzwerkfehler beim Löschen');
        console.error('Delete error:', error);
    }
}

// Filter by category
window.filterByCategory = function(category) {
    currentFilter = category;
    renderDocuments();
    
    // Update UI to show active filter
    showInfo(`Filter: ${getCategoryLabel(category)}`);
};

// Search documents
function setupSearch() {
    const searchInput = document.querySelector('input[placeholder="Nach Dokumenten suchen..."]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderDocuments();
        });
    }
    
    // Category filter dropdown
    const categorySelect = document.querySelector('select');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            currentFilter = e.target.value === 'Alle Kategorien' ? 'all' : e.target.value.toLowerCase();
            renderDocuments();
        });
    }
}

// Make functions available globally
window.uploadDocument = uploadDocument;
window.downloadDocument = downloadDocument;
window.viewDocument = viewDocument;
window.deleteDocument = deleteDocument;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    setupSearch();
    await loadDocuments();
    
    // Add data attributes to category cards
    const categoryCards = document.querySelectorAll('.grid > div');
    const categoryMap = ['formulare', 'richtlinien', 'vorlagen', 'berichte'];
    categoryCards.forEach((card, index) => {
        if (categoryMap[index]) {
            card.setAttribute('data-category', categoryMap[index]);
        }
    });
});