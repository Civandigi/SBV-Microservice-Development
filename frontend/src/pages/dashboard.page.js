// SBV Professional V2 - Dashboard Page
export class DashboardPage {
    constructor(user) {
        this.user = user;
    }
    
    async render(params = {}) {
        return `
            <div class="p-8">
                <!-- Header -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                        Dashboard
                    </h1>
                    <p class="text-[var(--color-text-secondary)]">
                        Willkommen zurück, ${this.user.name}!
                    </p>
                </div>
                
                <!-- Role-specific Content -->
                ${this.getRoleSpecificContent()}
                
                <!-- Quick Actions -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    ${this.getQuickActions()}
                </div>
                
                <!-- Recent Activity -->
                <div class="card">
                    <h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                        Letzte Aktivitäten
                    </h2>
                    <div class="space-y-4">
                        ${this.getRecentActivity()}
                    </div>
                </div>
            </div>
        `;
    }
    
    getRoleSpecificContent() {
        switch (this.user.role) {
            case 'user':
                return this.getUserDashboard();
            case 'admin':
                return this.getAdminDashboard();
            case 'super_admin':
                return this.getSuperAdminDashboard();
            default:
                return this.getUserDashboard();
        }
    }
    
    getUserDashboard() {
        return `
            <!-- User Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100">
                            <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Meine Rapporte</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">12</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100">
                            <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Genehmigt</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">8</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100">
                            <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">In Bearbeitung</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">4</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getAdminDashboard() {
        return `
            <!-- Admin Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100">
                            <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Alle Rapporte</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">47</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100">
                            <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Zur Genehmigung</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">7</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100">
                            <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Genehmigt</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">32</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-purple-100">
                            <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 7c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM12 14c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Aktive Benutzer</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">15</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getSuperAdminDashboard() {
        return `
            <!-- Super Admin Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-indigo-100">
                            <svg class="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">System Status</p>
                            <p class="text-2xl font-semibold text-green-600">Aktiv</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-red-100">
                            <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">API Calls (24h)</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">1,247</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-orange-100">
                            <svg class="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Uptime</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">99.9%</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-teal-100">
                            <svg class="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-[var(--color-text-secondary)]">Logs (24h)</p>
                            <p class="text-2xl font-semibold text-[var(--color-text-primary)]">543</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getQuickActions() {
        const baseActions = [
            {
                title: 'Neuer Rapport',
                description: 'Erstellen Sie einen neuen Rapport',
                icon: '📝',
                action: 'navigateTo("rapporte", {action: "new"})',
                roles: ['user', 'admin', 'super_admin']
            },
            {
                title: 'Meine Rapporte',
                description: 'Alle Ihre Rapporte anzeigen',
                icon: '📄',
                action: 'navigateTo("rapporte")',
                roles: ['user', 'admin', 'super_admin']
            }
        ];
        
        const adminActions = [
            {
                title: 'Benutzer verwalten',
                description: 'Benutzer-Accounts verwalten',
                icon: '👥',
                action: 'navigateTo("benutzer")',
                roles: ['admin', 'super_admin']
            }
        ];
        
        const superAdminActions = [
            {
                title: 'System-Logs',
                description: 'System-Aktivitäten einsehen',
                icon: '📊',
                action: 'navigateTo("logs")',
                roles: ['super_admin']
            }
        ];
        
        const allActions = [...baseActions, ...adminActions, ...superAdminActions];
        const userActions = allActions.filter(action => action.roles.includes(this.user.role));
        
        return userActions.map(action => `
            <div class="card hover:shadow-lg transition-shadow cursor-pointer" onclick="${action.action}">
                <div class="text-center">
                    <div class="text-4xl mb-4">${action.icon}</div>
                    <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                        ${action.title}
                    </h3>
                    <p class="text-[var(--color-text-secondary)] text-sm">
                        ${action.description}
                    </p>
                </div>
            </div>
        `).join('');
    }
    
    getRecentActivity() {
        // Mock data - will be replaced with real API call
        const activities = [
            {
                action: 'Rapport erstellt',
                item: 'Quartalsbericht Q1 2025',
                time: 'vor 2 Stunden',
                type: 'create'
            },
            {
                action: 'Rapport genehmigt',
                item: 'Monatsrapport März 2025',
                time: 'vor 4 Stunden',
                type: 'approve'
            },
            {
                action: 'Kommentar hinzugefügt',
                item: 'Jahresbericht 2024',
                time: 'vor 1 Tag',
                type: 'comment'
            }
        ];
        
        return activities.map(activity => `
            <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="ml-4 flex-1">
                    <p class="text-sm font-medium text-[var(--color-text-primary)]">
                        ${activity.action}
                    </p>
                    <p class="text-sm text-[var(--color-text-secondary)]">
                        ${activity.item}
                    </p>
                </div>
                <div class="text-sm text-[var(--color-text-secondary)]">
                    ${activity.time}
                </div>
            </div>
        `).join('');
    }
    
    getActivityIcon(type) {
        const icons = {
            create: '<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><span class="text-blue-600 text-sm">+</span></div>',
            approve: '<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><span class="text-green-600 text-sm">✓</span></div>',
            comment: '<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><span class="text-gray-600 text-sm">💬</span></div>'
        };
        
        return icons[type] || icons.create;
    }
    
    initEvents() {
        // Dashboard-specific event handlers can be added here
        console.log('Dashboard events initialized');
    }
}