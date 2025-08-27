// SBV Professional V2 - Rapporte Page
export class RapportePage {
    constructor(user) {
        this.user = user;
    }
    
    async render(params = {}) {
        return `
            <div class="p-8">
                <!-- Header -->
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                            Rapporte
                        </h1>
                        <p class="text-[var(--color-text-secondary)]">
                            ${this.getPageDescription()}
                        </p>
                    </div>
                    
                    ${this.canCreateRapport() ? `
                        <button onclick="this.createNewRapport()" 
                                class="button_primary">
                            <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            Neuer Rapport
                        </button>
                    ` : ''}
                </div>
                
                <!-- Filter Tabs -->
                <div class="flex space-x-4 mb-6">
                    <button class="px-4 py-2 bg-[var(--color-light-blue)] bg-opacity-30 text-[var(--color-black)] rounded-full font-semibold">
                        Alle
                    </button>
                    <button class="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-gray-100 rounded-full">
                        Meine
                    </button>
                    <button class="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-gray-100 rounded-full">
                        Eingereicht
                    </button>
                    <button class="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-gray-100 rounded-full">
                        Genehmigt
                    </button>
                </div>
                
                <!-- Rapporte Liste -->
                <div class="card">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Titel
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Erstellt von
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Datum
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aktionen
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${this.getRapporteList()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    getPageDescription() {
        switch (this.user.role) {
            case 'user':
                return 'Erstellen und verwalten Sie Ihre Rapporte';
            case 'admin':
                return 'Verwalten Sie alle Rapporte und Genehmigungen';
            case 'super_admin':
                return 'Vollständige Rapport-Verwaltung und System-Übersicht';
            default:
                return 'Rapport-Management';
        }
    }
    
    canCreateRapport() {
        // Alle Rollen können Rapporte erstellen (korrigierte Berechtigungsmatrix)
        return ['user', 'admin', 'super_admin'].includes(this.user.role);
    }
    
    getRapporteList() {
        // Mock data - wird später durch echte API-Daten ersetzt
        const mockRapporte = [
            {
                id: 1,
                title: 'Quartalsbericht Q1 2025',
                status: 'genehmigt',
                created_by: 'Max Mustermann',
                created_at: '2025-01-15',
                can_edit: this.user.role !== 'user'
            },
            {
                id: 2,
                title: 'Monatsrapport März 2025',
                status: 'eingereicht',
                created_by: 'Lisa Weber',
                created_at: '2025-03-01',
                can_edit: this.user.role !== 'user'
            },
            {
                id: 3,
                title: 'Jahresbericht 2024',
                status: 'in_bearbeitung',
                created_by: this.user.name,
                created_at: '2024-12-20',
                can_edit: true
            },
            {
                id: 4,
                title: 'Compliance Report Februar',
                status: 'entwurf',
                created_by: this.user.name,
                created_at: '2025-02-28',
                can_edit: true
            }
        ];
        
        return mockRapporte.map(rapport => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-[var(--color-text-primary)]">
                        ${rapport.title}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge status-${rapport.status}">
                        ${this.getStatusLabel(rapport.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                    ${rapport.created_by}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                    ${this.formatDate(rapport.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="this.viewRapport(${rapport.id})" 
                                class="text-blue-600 hover:text-blue-900">
                            Anzeigen
                        </button>
                        ${rapport.can_edit ? `
                            <button onclick="this.editRapport(${rapport.id})" 
                                    class="text-green-600 hover:text-green-900">
                                Bearbeiten
                            </button>
                        ` : ''}
                        ${this.canApprove(rapport.status) ? `
                            <button onclick="this.approveRapport(${rapport.id})" 
                                    class="text-purple-600 hover:text-purple-900">
                                Genehmigen
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    getStatusLabel(status) {
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
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    canApprove(status) {
        // Nur Admin und Super Admin können genehmigen, und nur bei "fertig" Status
        return ['admin', 'super_admin'].includes(this.user.role) && status === 'fertig';
    }
    
    initEvents() {
        // Event handlers für Rapport-Aktionen
        window.viewRapport = (id) => {
            console.log('View rapport:', id);
            // TODO: Navigate to rapport detail view
        };
        
        window.editRapport = (id) => {
            console.log('Edit rapport:', id);
            // TODO: Navigate to rapport edit view
        };
        
        window.approveRapport = (id) => {
            console.log('Approve rapport:', id);
            // TODO: Show approval dialog
        };
        
        window.createNewRapport = () => {
            console.log('Create new rapport');
            // TODO: Navigate to rapport creation form
        };
        
        console.log('Rapporte page events initialized');
    }
}