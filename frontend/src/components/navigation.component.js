// SBV Professional V2 - Navigation Component
export class NavigationComponent {
    constructor() {
        this.currentUser = null;
        this.activePage = 'dashboard';
    }
    
    async render(user) {
        this.currentUser = user;
        const navMenu = document.getElementById('nav-menu');
        
        if (!navMenu) {
            console.error('Navigation menu element not found');
            return;
        }
        
        const menuItems = this.getMenuItemsForRole(user.role);
        
        navMenu.innerHTML = menuItems.map(item => `
            <a href="#" 
               onclick="navigateTo('${item.page}')" 
               class="nav-link ${this.activePage === item.page ? 'nav-link-active' : 'nav-link-inactive'}"
               data-page="${item.page}">
                ${item.icon}
                <span>${item.label}</span>
            </a>
        `).join('');
    }
    
    getMenuItemsForRole(role) {
        const baseItems = [
            {
                page: 'dashboard',
                label: 'Dashboard',
                icon: this.getIcon('dashboard'),
                roles: ['user', 'admin', 'super_admin']
            },
            {
                page: 'rapporte',
                label: 'Rapporte',
                icon: this.getIcon('rapporte'),
                roles: ['user', 'admin', 'super_admin']
            }
        ];
        
        const adminItems = [
            {
                page: 'benutzer',
                label: 'Benutzer-Verwaltung',
                icon: this.getIcon('benutzer'),
                roles: ['admin', 'super_admin']
            }
        ];
        
        const superAdminItems = [
            {
                page: 'system',
                label: 'System-Einstellungen',
                icon: this.getIcon('system'),
                roles: ['super_admin']
            },
            {
                page: 'logs',
                label: 'Activity Logs',
                icon: this.getIcon('logs'),
                roles: ['super_admin']
            }
        ];
        
        const allItems = [...baseItems, ...adminItems, ...superAdminItems];
        
        return allItems.filter(item => item.roles.includes(role));
    }
    
    getIcon(type) {
        const icons = {
            dashboard: `
                <svg fill="currentColor" height="20px" viewBox="0 0 24 24" width="20px">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
            `,
            rapporte: `
                <svg fill="currentColor" height="20px" viewBox="0 0 24 24" width="20px">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
            `,
            dokumente: `
                <svg fill="currentColor" height="20px" viewBox="0 0 24 24" width="20px">
                    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
            `,
            benutzer: `
                <svg fill="currentColor" height="20px" viewBox="0 0 24 24" width="20px">
                    <path d="M16 7c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zM12 14c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                </svg>
            `,
            system: `
                <svg fill="currentColor" height="20px" viewBox="0 0 24 24" width="20px">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
            `,
            logs: `
                <svg fill="currentColor" height="20px" viewBox="0 0 24 24" width="20px">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
            `
        };
        
        return icons[type] || icons.dashboard;
    }
    
    setActivePage(pageName) {
        this.activePage = pageName;
        
        // Update active states
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (page === pageName) {
                link.className = 'nav-link nav-link-active';
            } else {
                link.className = 'nav-link nav-link-inactive';
            }
        });
    }
}