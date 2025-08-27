// SBV Professional V2 - Rapport Module
// Comprehensive rapport management functionality

import { showSuccess, showError, showWarning, showInfo } from './notifications.js';
import './modal.js';
import './config.js';

// Rapport State
let rapportData = {
    rapports: [],
    currentFilter: 'all',
    currentPage: 1,
    totalPages: 1,
    loading: false,
    stats: {
        total: 0,
        entwurf: 0,
        eingereicht: 0,
        in_bearbeitung: 0,
        fertig: 0,
        genehmigt: 0,
        abgelehnt: 0
    }
};

// Current user info (will be set by auth system)
let currentUser = {
    id: null,
    role: 'user',
    name: 'Unknown User'
};

// API helper
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No auth token found in rapport.js');
        // Don't redirect here - let the main page handle auth
        throw new Error('No authentication token');
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
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

// Load user info
async function loadUserInfo() {
    try {
        const response = await apiRequest('/api/auth/me');
        if (response && response.ok) {
            const data = await response.json();
            currentUser = data.user;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load all rapport data
async function loadRapportData() {
    try {
        rapportData.loading = true;
        showLoadingState();
        
        // Load rapports and stats in parallel
        await Promise.all([
            loadRapports(),
            loadRapportStats()
        ]);
        
        updateRapportUI();
        
    } catch (error) {
        console.error('Error loading rapport data:', error);
        showError('Fehler beim Laden der Rapport-Daten');
    } finally {
        rapportData.loading = false;
    }
}

// Load rapports with current filter and pagination
async function loadRapports() {
    try {
        const params = new URLSearchParams({
            filter: rapportData.currentFilter,
            page: rapportData.currentPage,
            limit: 20
        });
        
        const response = await apiRequest(`/api/rapporte?${params}`);
        if (response && response.ok) {
            const data = await response.json();
            rapportData.rapports = data.rapports;
            
            if (data.pagination) {
                rapportData.currentPage = data.pagination.page;
                rapportData.totalPages = data.pagination.totalPages;
            }
        }
        
    } catch (error) {
        console.error('Error loading rapports:', error);
        throw error;
    }
}

// Load rapport statistics
async function loadRapportStats() {
    try {
        const response = await apiRequest('/api/rapporte/stats');
        if (response && response.ok) {
            const data = await response.json();
            rapportData.stats = data.stats;
        }
        
    } catch (error) {
        console.error('Error loading rapport stats:', error);
    }
}

// Show loading state
function showLoadingState() {
    const tableBody = document.getElementById('rapports-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 px-4 text-center text-gray-500">
                    <div class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Lade Rapporte...
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Update stats with loading indicators
    ['total-rapports', 'eingereichte-rapports', 'genehmigte-rapporte', 'entwurf-rapporte'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<span class="animate-pulse">...</span>';
        }
    });
}

// Update rapport UI
function updateRapportUI() {
    updateRapportStats();
    updateRapportTable();
    updateFilterTabs();
    updatePagination();
}

// Update rapport statistics
function updateRapportStats() {
    const stats = rapportData.stats;
    
    updateStatCard('total-rapports', stats.total);
    updateStatCard('eingereichte-rapports', stats.eingereicht);
    updateStatCard('genehmigte-rapporte', stats.genehmigt);
    updateStatCard('entwurf-rapporte', stats.entwurf);
}

// Update statistic card
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        // Add animation
        element.classList.add('animate-fade-in');
        setTimeout(() => {
            element.classList.remove('animate-fade-in');
        }, 500);
    }
}

// Update rapport table
function updateRapportTable() {
    const tableBody = document.getElementById('rapports-table-body');
    if (!tableBody) return;
    
    if (rapportData.rapports.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 px-4 text-center text-gray-500">
                    <div class="text-sm">
                        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Keine Rapporte gefunden
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = rapportData.rapports.map(rapport => {
        const canEdit = canEditRapport(rapport);
        const canApprove = canApproveRapport(rapport);
        const canDelete = canDeleteRapport(rapport);
        
        return `
            <tr class="border-b border-[var(--color-border)] hover:bg-gray-50" data-rapport-id="${rapport.id}">
                <td class="py-4 px-4">
                    <div class="text-sm font-medium text-[var(--color-text-primary)]">
                        ${escapeHtml(rapport.title)}
                    </div>
                    <div class="text-xs text-[var(--color-text-secondary)]">
                        ${rapport.category || 'Kategorie nicht angegeben'}
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="status-badge status-${rapport.status}">
                        ${getStatusLabel(rapport.status)}
                    </span>
                    ${rapport.priority === 'kritisch' ? '<span class="ml-2 text-red-600 text-xs font-bold">KRITISCH</span>' : ''}
                </td>
                <td class="py-4 px-4 text-sm text-[var(--color-text-secondary)]">
                    ${escapeHtml(rapport.author_name || 'Unbekannt')}
                </td>
                <td class="py-4 px-4 text-sm text-[var(--color-text-secondary)]">
                    ${formatDate(rapport.created_at)}
                </td>
                <td class="py-4 px-4 text-sm text-[var(--color-text-secondary)]">
                    ${rapport.teilprojekt_name || 'Kein Teilprojekt'}
                </td>
                <td class="py-4 px-4 text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="viewRapport(${rapport.id})" 
                                class="text-blue-600 hover:text-blue-900 text-sm">
                            Anzeigen
                        </button>
                        ${canEdit ? `
                            <button onclick="editRapport(${rapport.id})" 
                                    class="text-green-600 hover:text-green-900 text-sm">
                                Bearbeiten
                            </button>
                        ` : ''}
                        ${canApprove ? `
                            <button onclick="approveRapport(${rapport.id})" 
                                    class="text-purple-600 hover:text-purple-900 text-sm">
                                Genehmigen
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button onclick="deleteRapport(${rapport.id})" 
                                    class="text-red-600 hover:text-red-900 text-sm">
                                Löschen
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update filter tabs
function updateFilterTabs() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        const filter = button.getAttribute('data-filter');
        if (filter === rapportData.currentFilter) {
            button.classList.add('active');
            button.classList.remove('text-[var(--color-text-secondary)]');
            button.classList.add('text-[var(--color-black)]', 'font-semibold');
        } else {
            button.classList.remove('active');
            button.classList.add('text-[var(--color-text-secondary)]');
            button.classList.remove('text-[var(--color-black)]', 'font-semibold');
        }
    });
}

// Update pagination
function updatePagination() {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;
    
    if (rapportData.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="flex justify-center space-x-2 mt-6">';
    
    // Previous button
    if (rapportData.currentPage > 1) {
        paginationHTML += `
            <button onclick="changePage(${rapportData.currentPage - 1})" 
                    class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
                « Zurück
            </button>
        `;
    }
    
    // Page numbers
    const startPage = Math.max(1, rapportData.currentPage - 2);
    const endPage = Math.min(rapportData.totalPages, rapportData.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === rapportData.currentPage;
        paginationHTML += `
            <button onclick="changePage(${i})" 
                    class="px-3 py-1 text-sm border rounded ${
                        isActive 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'border-gray-300 hover:bg-gray-100'
                    }">
                ${i}
            </button>
        `;
    }
    
    // Next button
    if (rapportData.currentPage < rapportData.totalPages) {
        paginationHTML += `
            <button onclick="changePage(${rapportData.currentPage + 1})" 
                    class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
                Weiter »
            </button>
        `;
    }
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

// Permission helper functions
function canEditRapport(rapport) {
    // Users can edit their own drafts and submitted reports
    // Admins can edit any rapport
    if (['admin', 'super_admin'].includes(currentUser.role)) {
        return true;
    }
    
    return rapport.author_id === currentUser.id && 
           ['entwurf', 'eingereicht'].includes(rapport.status);
}

function canApproveRapport(rapport) {
    // Only admins can approve, and only submitted or finished reports
    return ['admin', 'super_admin'].includes(currentUser.role) && 
           ['eingereicht', 'fertig'].includes(rapport.status);
}

function canDeleteRapport(rapport) {
    // Only admins can delete
    return ['admin', 'super_admin'].includes(currentUser.role);
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusLabel(status) {
    const labels = {
        'entwurf': 'Entwurf',
        'eingereicht': 'Eingereicht',
        'in_bearbeitung': 'In Bearbeitung',
        'fertig': 'Fertig',
        'genehmigt': 'Genehmigt',
        'abgelehnt': 'Abgelehnt'
    };
    return labels[status] || status;
}

// Event handlers
window.setFilter = async function(filter) {
    rapportData.currentFilter = filter;
    rapportData.currentPage = 1;
    await loadRapports();
    updateRapportUI();
};

window.changePage = async function(page) {
    rapportData.currentPage = page;
    await loadRapports();
    updateRapportUI();
};

window.viewRapport = function(id) {
    // Navigate to rapport detail view
    window.location.href = `rapport-detail.html?id=${id}`;
};

window.editRapport = function(id) {
    // Navigate to rapport edit view
    window.location.href = `rapport-edit.html?id=${id}`;
};

window.createNewRapport = function() {
    // Navigate to rapport creation form
    window.location.href = 'rapport-create.html';
};

window.approveRapport = async function(id) {
    const rapport = rapportData.rapports.find(r => r.id === id);
    if (!rapport) return;
    
    const result = await window.showModal({
        title: 'Rapport genehmigen',
        message: `Möchten Sie den Rapport "${rapport.title}" genehmigen oder ablehnen?`,
        type: 'choice',
        choices: [
            { value: 'approve', text: 'Genehmigen', class: 'btn-success' },
            { value: 'reject', text: 'Ablehnen', class: 'btn-danger' },
            { value: 'cancel', text: 'Abbrechen', class: 'btn-secondary' }
        ]
    });
    
    if (result === 'cancel') return;
    
    try {
        const response = await apiRequest(`/api/rapporte/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ action: result })
        });
        
        if (response && response.ok) {
            const data = await response.json();
            showSuccess(data.message || 'Rapport-Status erfolgreich geändert');
            await loadRapportData();
        } else {
            const error = await response.json();
            showError(error.message || 'Fehler bei der Rapport-Genehmigung');
        }
    } catch (error) {
        console.error('Approve rapport error:', error);
        showError('Fehler bei der Rapport-Genehmigung');
    }
};

window.deleteRapport = async function(id) {
    const rapport = rapportData.rapports.find(r => r.id === id);
    if (!rapport) return;
    
    const confirmed = await window.showModal({
        title: 'Rapport löschen',
        message: `Möchten Sie den Rapport "${rapport.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        type: 'confirm',
        confirmText: 'Löschen',
        cancelText: 'Abbrechen',
        danger: true
    });
    
    if (!confirmed) return;
    
    try {
        const response = await apiRequest(`/api/rapporte/${id}`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            const data = await response.json();
            showSuccess(data.message || 'Rapport erfolgreich gelöscht');
            await loadRapportData();
        } else {
            const error = await response.json();
            showError(error.message || 'Fehler beim Löschen des Rapports');
        }
    } catch (error) {
        console.error('Delete rapport error:', error);
        showError('Fehler beim Löschen des Rapports');
    }
};

// Auto-refresh functionality
let refreshInterval;

function startAutoRefresh() {
    // Refresh every 2 minutes
    refreshInterval = setInterval(() => {
        if (!rapportData.loading) {
            loadRapportData();
        }
    }, 120000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Load rapport data
async function loadRapportData() {
    if (rapportData.loading) return;
    
    try {
        rapportData.loading = true;
        console.log('Loading rapport data...');
        
        const response = await apiRequest('/api/rapporte');
        if (response.ok) {
            const data = await response.json();
            rapportData.rapports = data.rapports || [];
            updateRapportUI();
        }
    } catch (error) {
        console.error('Error loading rapport data:', error);
    } finally {
        rapportData.loading = false;
    }
}

// Update UI with rapport data
function updateRapportUI() {
    console.log('Updating rapport UI with', rapportData.rapports.length, 'rapports');
    // UI update logic would go here
}

// Export functions for external use
window.rapport = {
    loadRapportData,
    startAutoRefresh,
    stopAutoRefresh
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Only initialize if we're on the rapport page
    if (document.getElementById('rapport-content')) {
        try {
            // Check if functions exist before calling
            if (typeof loadUserInfo === 'function') {
                await loadUserInfo();
            }
            await loadRapportData();
            startAutoRefresh();
        
        // Stop refresh when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                startAutoRefresh();
                if (!rapportData.loading) {
                    loadRapportData();
                }
            }
        });
        
        // Setup filter event listeners
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = button.getAttribute('data-filter');
                setFilter(filter);
            });
        });
        } catch (error) {
            console.error('Error initializing rapport page:', error);
            // Don't redirect on error - let user stay on page
        }
    }
});