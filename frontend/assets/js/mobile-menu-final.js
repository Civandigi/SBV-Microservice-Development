/**
 * Mobile Menu Final Solution
 * Einzige Quelle für Mobile Menu Funktionalität
 */

// Global singleton to prevent multiple initializations
if (!window.mobileMenuInitialized) {
    window.mobileMenuInitialized = false;
    window.mobileMenuHandler = null;
    window.overlayHandler = null;
}

function setupMobileMenuFinal() {
    // Prevent multiple initializations
    if (window.mobileMenuInitialized) {
        console.log('Mobile menu already initialized globally');
        return;
    }
    
    console.log('Setting up mobile menu final...');
    
    const button = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    if (!button || !sidebar || !overlay) {
        console.warn('Mobile menu elements not found, retrying...');
        setTimeout(setupMobileMenuFinal, 200);
        return;
    }
    
    // Clean up any existing handlers
    if (window.mobileMenuHandler) {
        button.removeEventListener('click', window.mobileMenuHandler);
    }
    if (window.overlayHandler) {
        overlay.removeEventListener('click', window.overlayHandler);
    }
    
    // Create handlers
    window.mobileMenuHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Stop all propagation
        
        const isActive = sidebar.classList.contains('active');
        
        if (isActive) {
            // Close menu
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            console.log('Mobile menu closed');
        } else {
            // Open menu
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
            console.log('Mobile menu opened');
        }
    };
    
    window.overlayHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        console.log('Menu closed via overlay');
    };
    
    // Add event listeners
    button.addEventListener('click', window.mobileMenuHandler);
    overlay.addEventListener('click', window.overlayHandler);
    
    // Mark as initialized
    window.mobileMenuInitialized = true;
    console.log('✅ Mobile menu setup complete');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileMenuFinal);
} else {
    // DOM already loaded
    setupMobileMenuFinal();
}

// Export for manual calls
window.setupMobileMenuFinal = setupMobileMenuFinal;