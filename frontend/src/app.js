// SBV Professional V2 - Main Application
// Clean modular architecture

import { AuthService } from './services/auth.service.js';
import { NavigationComponent } from './components/navigation.component.js';
import { DashboardPage } from './pages/dashboard.page.js';
import { RapportePage } from './pages/rapporte.page.js';

class SBVApp {
    constructor() {
        this.authService = new AuthService();
        this.navigation = new NavigationComponent();
        this.currentUser = null;
        this.currentPage = null;
        
        this.init();
    }
    
    async init() {
        // Check if user is already logged in
        const token = localStorage.getItem('sbv_token');
        if (token) {
            try {
                const user = await this.authService.validateToken(token);
                this.currentUser = user;
                this.showMainApp();
            } catch (error) {
                console.error('Token validation failed:', error);
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
        
        // Setup login form
        this.setupLoginForm();
    }
    
    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }
    
    async showMainApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        
        // Update user info in sidebar
        this.updateUserInfo();
        
        // Setup navigation
        await this.navigation.render(this.currentUser);
        
        // Show default page (dashboard)
        this.showPage('dashboard');
    }
    
    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('user-role').textContent = this.getRoleDisplayName(this.currentUser.role);
        }
    }
    
    getRoleDisplayName(role) {
        const roleNames = {
            'user': 'Benutzer',
            'admin': 'Administrator', 
            'super_admin': 'Super Administrator'
        };
        return roleNames[role] || role;
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        const loginBtn = document.getElementById('login-btn');
        const errorDiv = document.getElementById('login-error');
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Show loading state
            loginBtn.textContent = 'Anmeldung läuft...';
            loginBtn.disabled = true;
            errorDiv.classList.add('hidden');
            
            try {
                const response = await this.authService.login(email, password);
                
                if (response.success) {
                    this.currentUser = response.user;
                    localStorage.setItem('sbv_token', response.token);
                    await this.showMainApp();
                } else {
                    throw new Error(response.message || 'Anmeldung fehlgeschlagen');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                errorDiv.textContent = error.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
                errorDiv.classList.remove('hidden');
            } finally {
                loginBtn.textContent = 'Anmelden';
                loginBtn.disabled = false;
            }
        });
    }
    
    async showPage(pageName, params = {}) {
        const mainContent = document.getElementById('main-content');
        
        try {
            // Update navigation active state
            this.navigation.setActivePage(pageName);
            
            // Load and render page
            switch (pageName) {
                case 'dashboard':
                    this.currentPage = new DashboardPage(this.currentUser);
                    break;
                case 'rapporte':
                    this.currentPage = new RapportePage(this.currentUser);
                    break;
                default:
                    throw new Error(`Seite '${pageName}' nicht gefunden`);
            }
            
            // Render page content
            const content = await this.currentPage.render(params);
            mainContent.innerHTML = content;
            
            // Initialize page events
            if (this.currentPage.initEvents) {
                this.currentPage.initEvents();
            }
            
        } catch (error) {
            console.error('Error loading page:', error);
            mainContent.innerHTML = `
                <div class="p-8">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h2 class="text-lg font-semibold text-red-800 mb-2">Fehler beim Laden der Seite</h2>
                        <p class="text-red-600">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }
    
    // Global logout function
    async logout() {
        try {
            await this.authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('sbv_token');
            this.currentUser = null;
            this.showLogin();
        }
    }
    
    // Utility method to show loading
    showLoading() {
        document.getElementById('loading-spinner').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading-spinner').classList.add('hidden');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sbvApp = new SBVApp();
});

// Global logout function for HTML onclick
window.logout = () => {
    if (window.sbvApp) {
        window.sbvApp.logout();
    }
};

// Global navigation function
window.navigateTo = (pageName, params = {}) => {
    if (window.sbvApp) {
        window.sbvApp.showPage(pageName, params);
    }
};