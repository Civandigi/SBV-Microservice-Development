// SBV Professional V2 - Dashboard Module
// Dynamische Dashboard-Funktionalität

import { showSuccess, showError, showWarning, showInfo } from './notifications.js';
import './modal.js';
// config.js is already loaded in HTML

// Dashboard State
let dashboardData = {
    stats: {
        offeneRapporte: 0,
        archivierteRapporte: 0,
        hochgeladenePdfs: 0,
        berichteAnzahl: 0,
        dokumenteAnzahl: 0,
        gesucheAnzahl: 0
    },
    recentActivities: [],
    notifications: []
};

// API helper
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
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
        window.location.href = 'login.html';
        return;
    }

    return response;
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Show loading state
        showLoadingState();
        
        // Load data in parallel
        await Promise.all([
            loadDashboardStats(),
            loadRecentActivities(),
            loadNotifications()
        ]);
        
        // Update UI
        updateDashboardUI();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Fehler beim Laden des Dashboards');
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Load aggregated stats from dashboard API
        const statsResponse = await apiRequest('/api/dashboard/stats');
        if (statsResponse && statsResponse.ok) {
            const data = await statsResponse.json();
            const stats = data.stats;
            
            // Update dashboard stats
            dashboardData.stats.offeneRapporte = (stats.rapporte.eingereicht || 0) + (stats.rapporte.in_bearbeitung || 0);
            dashboardData.stats.archivierteRapporte = (stats.rapporte.genehmigt || 0) + (stats.rapporte.fertig || 0);
            dashboardData.stats.berichteAnzahl = stats.rapporte.total || 0;
            dashboardData.stats.dokumenteAnzahl = stats.documents.total || 0;
            dashboardData.stats.hochgeladenePdfs = stats.documents.total || 0;
            dashboardData.stats.gesucheAnzahl = (stats.gesuche.neu || 0) + (stats.gesuche.in_bearbeitung || 0);
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        // Load activities from dashboard API
        const activitiesResponse = await apiRequest('/api/dashboard/activities?limit=10');
        if (activitiesResponse && activitiesResponse.ok) {
            const data = await activitiesResponse.json();
            const activities = data.activities || [];
            
            dashboardData.recentActivities = activities.map(activity => ({
                date: activity.date,
                type: activity.type === 'rapport' ? 'Rapport' : 'Dokument',
                description: activity.description,
                status: activity.status,
                icon: activity.icon,
                user: activity.user,
                link: activity.type === 'rapport' 
                    ? `pages/rapport.html?id=${activity.id}`
                    : `pages/archiv.html`
            }));
        }
            
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Load notifications
async function loadNotifications() {
    try {
        // Load notifications from dashboard API
        const notificationsResponse = await apiRequest('/api/dashboard/notifications');
        if (notificationsResponse && notificationsResponse.ok) {
            const data = await notificationsResponse.json();
            dashboardData.notifications = data.notifications || [];
            
            // Add some static notifications for demo
            if (dashboardData.notifications.length < 3) {
                dashboardData.notifications.push({
                    id: 'demo-1',
                    type: 'info',
                    title: 'Willkommen im SBV Dashboard',
                    date: new Date(),
                    priority: 'low',
                    icon: 'info'
                });
            }
        }
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}


// Show loading state
function showLoadingState() {
    // Statistics cards
    ['offene-rapporte', 'archivierte-dokumente', 'hochgeladene-pdfs', 'berichte-anzahl'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<span class="animate-pulse">...</span>';
        }
    });
    
    // Activities table
    const tbody = document.getElementById('recent-activities');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-4 px-4 text-center text-gray-500">
                    <div class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Lade Dashboard-Daten...
                    </div>
                </td>
            </tr>
        `;
    }
}

// Update dashboard UI
function updateDashboardUI() {
    // Update statistics
    updateStatCard('offene-rapporte', dashboardData.stats.offeneRapporte);
    updateStatCard('archivierte-dokumente', dashboardData.stats.archivierteRapporte);
    updateStatCard('hochgeladene-pdfs', dashboardData.stats.hochgeladenePdfs);
    updateStatCard('berichte-anzahl', dashboardData.stats.berichteAnzahl);
    
    // Update activities
    updateActivitiesTable();
    
    // Update notifications
    updateNotifications();
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

// Update activities table
function updateActivitiesTable() {
    const tbody = document.getElementById('recent-activities');
    if (!tbody) return;
    
    if (dashboardData.recentActivities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-4 px-4 text-center text-gray-500">
                    Keine aktuellen Aktivitäten gefunden
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = dashboardData.recentActivities.map(activity => {
        const datum = formatDate(activity.date);
        const statusInfo = getStatusInfo(activity.status);
        
        return `
            <tr class="border-b border-[var(--color-border)] hover:bg-gray-50 cursor-pointer" 
                onclick="window.location.href='${activity.link}'">
                <td class="py-4 px-4 text-[var(--color-text-primary)]">${datum}</td>
                <td class="py-4 px-4 text-[var(--color-text-primary)]">
                    ${getActivityIcon(activity.icon)}
                    ${activity.type}
                </td>
                <td class="py-4 px-4 text-[var(--color-text-primary)]">${activity.description}</td>
                <td class="py-4 px-4 text-center">
                    <span class="inline-block px-3 py-1 text-sm font-medium ${statusInfo.class} rounded-full">
                        ${statusInfo.text}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Update notifications
function updateNotifications() {
    const container = document.querySelector('.space-y-4'); // Notifications container
    if (!container) return;
    
    container.innerHTML = dashboardData.notifications.map(notification => {
        const bgColor = getNotificationBgColor(notification.priority);
        const iconColor = getNotificationIconColor(notification.priority);
        
        return `
            <div class="flex items-start gap-4 p-4 rounded-lg ${bgColor} cursor-pointer hover:opacity-90"
                 onclick="handleNotificationClick(${notification.id})">
                <div class="flex-shrink-0 size-8 flex items-center justify-center rounded-full ${iconColor}">
                    ${getNotificationIcon(notification.icon)}
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-sm text-[var(--color-text-primary)]">${notification.title}</p>
                    <p class="text-xs text-[var(--color-text-secondary)]">${formatDate(notification.date)}</p>
                </div>
                <button onclick="dismissNotification(event, ${notification.id})" 
                        class="text-gray-400 hover:text-gray-600">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

// Helper functions
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
        return date.toLocaleDateString('de-CH');
    }
}

function getStatusInfo(status) {
    const statusMap = {
        'eingereicht': { class: 'text-yellow-800 bg-yellow-100', text: 'Eingereicht' },
        'genehmigt': { class: 'text-green-800 bg-green-100', text: 'Genehmigt' },
        'abgelehnt': { class: 'text-red-800 bg-red-100', text: 'Abgelehnt' },
        'entwurf': { class: 'text-gray-800 bg-gray-100', text: 'Entwurf' },
        'in_bearbeitung': { class: 'text-blue-800 bg-blue-100', text: 'In Bearbeitung' },
        'fertig': { class: 'text-green-800 bg-green-100', text: 'Fertig' },
        'hochgeladen': { class: 'text-blue-800 bg-blue-100', text: 'Hochgeladen' }
    };
    
    return statusMap[status] || { class: 'text-gray-800 bg-gray-100', text: status };
}

function getActivityIcon(type) {
    const icons = {
        'rapport': '<svg class="inline w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>',
        'document': '<svg class="inline w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'gesuch': '<svg class="inline w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
    };
    
    return icons[type] || '';
}

function getNotificationBgColor(priority) {
    const colors = {
        'critical': 'bg-red-50',
        'high': 'bg-orange-50',
        'medium': 'bg-blue-50',
        'low': 'bg-gray-50'
    };
    return colors[priority] || 'bg-gray-50';
}

function getNotificationIconColor(priority) {
    const colors = {
        'critical': 'bg-red-600 text-white',
        'high': 'bg-orange-600 text-white',
        'medium': 'bg-blue-600 text-white',
        'low': 'bg-gray-600 text-white'
    };
    return colors[priority] || 'bg-gray-600 text-white';
}

function getNotificationIcon(type) {
    const icons = {
        'clock': '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>',
        'bell': '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>',
        'info': '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>',
        'alert': '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>'
    };
    return icons[type] || icons['info'];
}

// Handle notification click
window.handleNotificationClick = function(notificationId) {
    const notification = dashboardData.notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    switch(notification.type) {
        case 'deadline':
            window.location.href = 'pages/rapport.html';
            break;
        case 'new':
            window.location.href = 'pages/gesuche.html';
            break;
        case 'urgent':
            window.location.href = 'pages/rapport.html?filter=urgent';
            break;
        default:
            showInfo(notification.title);
    }
};

// Dismiss notification
window.dismissNotification = function(event, notificationId) {
    event.stopPropagation();
    
    // Remove from data
    dashboardData.notifications = dashboardData.notifications.filter(n => n.id !== notificationId);
    
    // Update UI
    updateNotifications();
    
    showSuccess('Benachrichtigung entfernt');
};

// Quick actions
window.createNewRapport = function() {
    window.location.href = 'pages/rapport.html?action=new';
};

window.viewAllDocuments = function() {
    window.location.href = 'pages/archiv.html';
};

window.openSettings = function() {
    window.location.href = 'pages/einstellungen.html';
};

// Auto-refresh dashboard data
let refreshInterval;

function startAutoRefresh() {
    // Refresh every 30 seconds
    refreshInterval = setInterval(() => {
        loadDashboardData();
    }, 30000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Export functions for external use
window.dashboard = {
    loadDashboardData,
    startAutoRefresh,
    stopAutoRefresh
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Only initialize if we're on the dashboard page
    if (document.getElementById('dashboard-content')) {
        await loadDashboardData();
        startAutoRefresh();
        
        // Stop refresh when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                startAutoRefresh();
                loadDashboardData();
            }
        });
    }
});