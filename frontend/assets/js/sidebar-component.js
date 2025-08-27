/**
 * Einheitliche Sidebar-Komponente für alle Seiten
 * Garantiert konsistente Darstellung auf allen Seiten
 */

// Sidebar HTML Template
function getSidebarHTML(currentPage = '') {
    // Always get fresh user info from localStorage
    let userInfo = {};
    let userRole = 'admin'; // Default to admin when logged in
    let userName = 'Admin User';
    
    try {
        // Try to get user info from localStorage
        const storedInfo = localStorage.getItem('userInfo');
        if (storedInfo) {
            userInfo = JSON.parse(storedInfo);
            userRole = userInfo.role || 'admin';
            userName = userInfo.name || userInfo.firstName || 'Admin User';
        }
        
        // If we have a token, ensure we're showing as admin
        const token = localStorage.getItem('token');
        if (token) {
            // Force admin role if logged in with token
            userRole = 'admin';
            if (!userName || userName === 'Benutzer') {
                userName = 'Admin User';
            }
        }
    } catch (e) {
        console.warn('Could not parse user info:', e);
    }
    
    // Role-based display name
    const roleDisplay = {
        'user': 'Nutzer',
        'admin': 'Administrator', 
        'super_admin': 'Super Admin'
    }[userRole] || 'Nutzer';
    
    // Navigation items based on role
    const navItems = getNavigationItems(userRole);
    
    return `
        <!-- SBV Logo - IMMER gleiche Größe h-20 -->
        <div class="flex items-center justify-center mb-10">
            <img src="${getAssetPath()}assets/images/logo.png" 
                 alt="SBV Logo" 
                 class="h-20 w-auto object-contain"
                 style="height: 5rem !important;"
                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'text-center\\'><h2 class=\\'text-xl font-bold text-blue-600\\'>SBV Professional</h2></div>'" />
        </div>

        <!-- User Profile Section - IMMER gleiche Größe -->
        <div class="mb-6 p-4 bg-[var(--color-light-blue)] bg-opacity-20 rounded-lg">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-[var(--color-light-blue)] rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-[var(--color-black)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"></path>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[var(--color-text-primary)]" id="user-name">${userName}</p>
                    <p class="text-xs text-[var(--color-text-secondary)]" id="user-role">${roleDisplay}</p>
                </div>
            </div>
        </div>

        <!-- Navigation Menu - IMMER gleiche Struktur -->
        <nav class="flex flex-col gap-2 flex-grow" id="nav-menu">
            ${navItems.map(item => createNavLink(item, currentPage)).join('')}
        </nav>

        <!-- Help & Logout Links - IMMER gleiche Position -->
        <div class="mt-auto">
            <a class="flex items-center gap-3 px-4 py-2.5 rounded-full nav-link-inactive" href="#help">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"></path>
                </svg>
                <span>Hilfe</span>
            </a>
            
            <button onclick="logout()" class="flex items-center gap-3 px-4 py-2.5 rounded-full nav-link-inactive w-full text-left mt-2 hover:text-[var(--color-red)]">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path>
                </svg>
                <span>Abmelden</span>
            </button>
        </div>
    `;
}

// Navigation items configuration
function getNavigationItems(role) {
    const allItems = [
        {
            id: 'dashboard',
            href: 'index.html',
            label: 'Dashboard',
            icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
            roles: ['user', 'admin', 'super_admin']
        },
        {
            id: 'rapport',
            href: 'rapport.html',
            label: 'Rapport',
            icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2 2H5V5h14v14H19zm0-16H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
            roles: ['user', 'admin', 'super_admin']
        },
        {
            id: 'archiv',
            href: 'archiv.html',
            label: 'Archiv',
            icon: 'M3,3H21V7H3V3M4,8H20V21H4V8M9.5,11A0.5,0.5 0 0,0 9,11.5V13H15V11.5A0.5,0.5 0 0,0 14.5,11H9.5Z',
            roles: ['user', 'admin', 'super_admin']
        },
        {
            id: 'einstellungen',
            href: 'einstellungen.html',
            label: 'Einstellungen',
            icon: 'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
            roles: ['user', 'admin', 'super_admin']
        }
    ];
    
    return allItems.filter(item => item.roles.includes(role));
}

// Create navigation link
function createNavLink(item, currentPage) {
    const isActive = currentPage === item.id;
    
    // Determine correct path based on current location
    let href = item.href;
    const currentPath = window.location.pathname;
    
    // If we're in pages folder, adjust paths
    if (currentPath.includes('/pages/')) {
        // We're in a subfolder - links should be relative to pages folder
        if (item.id === 'dashboard') {
            href = '../index.html';
        } else {
            // Just use the filename directly since we're already in pages/
            href = item.href;
        }
    } else {
        // We're at root (dashboard)
        if (item.id === 'dashboard') {
            href = 'index.html';
        } else {
            // Add pages/ prefix to navigate from root to pages folder
            href = 'pages/' + item.href;
        }
    }
    
    const linkClass = isActive 
        ? 'nav-link nav-link-active' 
        : 'flex items-center gap-3 px-4 py-2.5 rounded-full text-[var(--color-text-secondary)] hover:bg-gray-100 font-medium transition-colors';
    
    return `
        <a class="${linkClass}" href="${href}">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="${item.icon}"></path>
            </svg>
            <span>${item.label}</span>
        </a>
    `;
}

// Helper functions
function getAssetPath() {
    // Determine if we're in a subfolder or root
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
        return '../';
    }
    return '';
}

function getBasePath() {
    // Determine base path for navigation links
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
        return '';
    }
    return 'pages/';
}

// Ensure consistent user info across all pages
function ensureConsistentUserInfo() {
    // Check if we have a token but no user info
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && !userInfo) {
        // Set default admin user if we have a token
        const defaultUser = {
            name: 'Admin User',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User'
        };
        localStorage.setItem('userInfo', JSON.stringify(defaultUser));
    }
}

// Initialize sidebar with smooth transition
function initializeSidebar(currentPage = '') {
    // Ensure user info is consistent
    ensureConsistentUserInfo();
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Add loading state
        sidebar.classList.remove('loaded');
        
        // Use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
            // Clear existing content
            sidebar.innerHTML = '';
            
            // Add the unified sidebar HTML
            sidebar.innerHTML = getSidebarHTML(currentPage);
            
            // Trigger smooth transition
            requestAnimationFrame(() => {
                sidebar.classList.add('loaded');
            });
            
            // Mobile menu setup is handled by mobile-menu-fix.js
            
            // Preload images to prevent flicker
            preloadSidebarImages();
        });
    }
}

// Preload images to prevent flicker on navigation
function preloadSidebarImages() {
    const logo = new Image();
    logo.src = getAssetPath() + 'assets/images/logo.png';
}

// Mobile menu setup removed - handled by mobile-menu-fix.js

// Logout function
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    
    // Navigate to login page with correct path
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
        window.location.href = '../login.html';
    } else {
        window.location.href = 'login.html';
    }
}

// Export for use
window.initializeSidebar = initializeSidebar;
window.logout = logout;

// Mobile menu setup is now handled by mobile-menu-fix.js
// Removed duplicate setup to prevent conflicts