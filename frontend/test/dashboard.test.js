// SBV Professional V2 - Dashboard Frontend Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock notifications
vi.mock('../js/notifications.js', () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn()
}));

// Mock config
vi.mock('../js/config.js', () => ({}));
vi.mock('../js/modal.js', () => ({}));

// Set up DOM
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>Dashboard Test</title></head>
<body>
    <div id="dashboard-content">
        <div id="offene-rapporte">0</div>
        <div id="archivierte-dokumente">0</div>
        <div id="hochgeladene-pdfs">0</div>
        <div id="berichte-anzahl">0</div>
        <table>
            <tbody id="recent-activities"></tbody>
        </table>
        <div class="space-y-4"></div>
    </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.window.API_BASE_URL = 'http://localhost:3000';

// Mock window functions
global.window.location = {
    href: '',
    assign: vi.fn()
};

describe('Dashboard Module', () => {
    let dashboardModule;
    
    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Reset localStorage
        localStorageMock.getItem.mockReturnValue('mock-token');
        
        // Reset DOM
        document.getElementById('offene-rapporte').textContent = '0';
        document.getElementById('archivierte-dokumente').textContent = '0';
        document.getElementById('hochgeladene-pdfs').textContent = '0';
        document.getElementById('berichte-anzahl').textContent = '0';
        document.getElementById('recent-activities').innerHTML = '';
        document.querySelector('.space-y-4').innerHTML = '';
        
        // Mock successful API responses
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                success: true,
                stats: {
                    rapporte: {
                        total: 10,
                        eingereicht: 3,
                        in_bearbeitung: 2,
                        genehmigt: 4,
                        fertig: 1
                    },
                    documents: { total: 15 },
                    gesuche: {
                        neu: 2,
                        in_bearbeitung: 1
                    }
                },
                activities: [
                    {
                        type: 'rapport',
                        id: 1,
                        description: 'Test Rapport',
                        status: 'eingereicht',
                        date: '2025-01-20T10:00:00Z',
                        user: 'Test User',
                        icon: 'rapport'
                    }
                ],
                notifications: [
                    {
                        id: 'test-1',
                        type: 'info',
                        title: 'Test Notification',
                        date: new Date(),
                        priority: 'low',
                        icon: 'info'
                    }
                ]
            })
        });
    });
    
    afterEach(() => {
        // Clean up any intervals
        if (global.window.dashboard && global.window.dashboard.stopAutoRefresh) {
            global.window.dashboard.stopAutoRefresh();
        }
    });
    
    describe('API Request Helper', () => {
        it('should include authorization header', async () => {
            // Import dashboard module to trigger initialization
            await import('../js/dashboard.js');
            
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/dashboard/stats'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-token',
                        'Content-Type': 'application/json'
                    })
                })
            );
        });
        
        it('should redirect to login if no token', async () => {
            localStorageMock.getItem.mockReturnValue(null);
            
            await import('../js/dashboard.js');
            
            expect(global.window.location.href).toBe('login.html');
        });
        
        it('should handle 401 responses', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 401
            });
            
            await import('../js/dashboard.js');
            
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
            expect(global.window.location.href).toBe('login.html');
        });
    });
    
    describe('Dashboard Data Loading', () => {
        it('should load and display statistics', async () => {
            await import('../js/dashboard.js');
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(document.getElementById('offene-rapporte').textContent).toBe('5'); // eingereicht + in_bearbeitung
            expect(document.getElementById('archivierte-dokumente').textContent).toBe('5'); // genehmigt + fertig
            expect(document.getElementById('hochgeladene-pdfs').textContent).toBe('15');
            expect(document.getElementById('berichte-anzahl').textContent).toBe('10');
        });
        
        it('should handle API errors gracefully', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            const { showError } = await import('../js/notifications.js');
            await import('../js/dashboard.js');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(showError).toHaveBeenCalledWith('Fehler beim Laden des Dashboards');
        });
    });
    
    describe('Recent Activities', () => {
        it('should display recent activities', async () => {
            await import('../js/dashboard.js');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const tbody = document.getElementById('recent-activities');
            expect(tbody.innerHTML).toContain('Test Rapport');
            expect(tbody.innerHTML).toContain('eingereicht');
        });
        
        it('should show empty state when no activities', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    success: true,
                    stats: { rapporte: {}, documents: {}, gesuche: {} },
                    activities: [],
                    notifications: []
                })
            });
            
            await import('../js/dashboard.js');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const tbody = document.getElementById('recent-activities');
            expect(tbody.innerHTML).toContain('Keine aktuellen Aktivitäten gefunden');
        });
    });
    
    describe('Notifications', () => {
        it('should display notifications', async () => {
            await import('../js/dashboard.js');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const container = document.querySelector('.space-y-4');
            expect(container.innerHTML).toContain('Test Notification');
        });
        
        it('should handle notification dismissal', async () => {
            await import('../js/dashboard.js');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Test dismiss function
            expect(global.window.dismissNotification).toBeInstanceOf(Function);
            
            const mockEvent = { stopPropagation: vi.fn() };
            global.window.dismissNotification(mockEvent, 'test-1');
            
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
        });
    });
    
    describe('Helper Functions', () => {
        it('should format dates correctly', async () => {
            await import('../js/dashboard.js');
            
            // Test date formatting - we can't directly test the formatDate function
            // but we can test its output in the activities
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const tbody = document.getElementById('recent-activities');
            // Should contain formatted date (today, yesterday, or formatted date)
            expect(tbody.innerHTML).toMatch(/(Heute|Gestern|\d{1,2}\.\d{1,2}\.\d{4})/);
        });
        
        it('should provide correct status information', async () => {
            await import('../js/dashboard.js');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const tbody = document.getElementById('recent-activities');
            expect(tbody.innerHTML).toContain('Eingereicht');
            expect(tbody.innerHTML).toContain('text-yellow-800 bg-yellow-100');
        });
    });
    
    describe('Auto Refresh', () => {
        it('should provide auto refresh functions', async () => {
            await import('../js/dashboard.js');
            
            expect(global.window.dashboard).toBeDefined();
            expect(global.window.dashboard.startAutoRefresh).toBeInstanceOf(Function);
            expect(global.window.dashboard.stopAutoRefresh).toBeInstanceOf(Function);
        });
    });
    
    describe('Quick Actions', () => {
        it('should provide navigation functions', async () => {
            await import('../js/dashboard.js');
            
            expect(global.window.createNewRapport).toBeInstanceOf(Function);
            expect(global.window.viewAllDocuments).toBeInstanceOf(Function);
            expect(global.window.openSettings).toBeInstanceOf(Function);
            
            // Test navigation
            global.window.createNewRapport();
            expect(global.window.location.href).toBe('pages/rapport.html?action=new');
            
            global.window.viewAllDocuments();
            expect(global.window.location.href).toBe('pages/dokumente.html');
            
            global.window.openSettings();
            expect(global.window.location.href).toBe('pages/einstellungen.html');
        });
    });
    
    describe('Loading States', () => {
        it('should show loading indicators', async () => {
            // Mock slow API response
            global.fetch.mockImplementation(() => 
                new Promise(resolve => 
                    setTimeout(() => resolve({
                        ok: true,
                        json: () => Promise.resolve({ 
                            success: true, 
                            stats: {}, 
                            activities: [], 
                            notifications: [] 
                        })
                    }), 100)
                )
            );
            
            await import('../js/dashboard.js');
            
            // Should show loading state initially
            const tbody = document.getElementById('recent-activities');
            expect(tbody.innerHTML).toContain('Lade Dashboard-Daten');
            expect(tbody.innerHTML).toContain('animate-spin');
        });
    });
});