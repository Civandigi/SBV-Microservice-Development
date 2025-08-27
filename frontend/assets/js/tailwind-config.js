/**
 * Tailwind CSS Configuration for Better Responsiveness
 * This configuration extends Tailwind with custom breakpoints and utilities
 */

// Add this script to your HTML pages after loading Tailwind
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                // Custom breakpoints for better responsiveness
                screens: {
                    'xs': '480px',      // Small phones
                    'sm': '640px',      // Large phones
                    'md': '768px',      // Tablets
                    'lg': '1024px',     // Desktop
                    'xl': '1280px',     // Large desktop
                    '2xl': '1536px',    // Extra large desktop
                    '3xl': '1920px',    // Full HD
                    '4xl': '2560px',    // 2K/4K displays
                },
                
                // Responsive font sizes
                fontSize: {
                    'responsive-xs': 'clamp(0.75rem, 1.5vw, 0.875rem)',
                    'responsive-sm': 'clamp(0.875rem, 2vw, 1rem)',
                    'responsive-base': 'clamp(1rem, 2.5vw, 1.125rem)',
                    'responsive-lg': 'clamp(1.125rem, 3vw, 1.25rem)',
                    'responsive-xl': 'clamp(1.25rem, 3.5vw, 1.5rem)',
                    'responsive-2xl': 'clamp(1.5rem, 4vw, 2rem)',
                    'responsive-3xl': 'clamp(1.875rem, 5vw, 2.5rem)',
                },
                
                // Custom container sizes
                container: {
                    center: true,
                    padding: {
                        DEFAULT: '1rem',
                        sm: '1.5rem',
                        lg: '2rem',
                        xl: '3rem',
                        '2xl': '4rem',
                    },
                    screens: {
                        sm: '640px',
                        md: '768px',
                        lg: '1024px',
                        xl: '1280px',
                        '2xl': '1536px',
                        '3xl': '1920px',
                        '4xl': '2560px',
                    }
                },
                
                // Custom spacing for responsive design
                spacing: {
                    'safe-top': 'env(safe-area-inset-top)',
                    'safe-bottom': 'env(safe-area-inset-bottom)',
                    'safe-left': 'env(safe-area-inset-left)',
                    'safe-right': 'env(safe-area-inset-right)',
                }
            }
        }
    };
}

// Helper function to apply responsive classes dynamically
function applyResponsiveClasses() {
    const width = window.innerWidth;
    const body = document.body;
    
    // Remove all screen size classes
    body.classList.remove('screen-xs', 'screen-sm', 'screen-md', 'screen-lg', 'screen-xl', 'screen-2xl', 'screen-3xl', 'screen-4xl');
    
    // Add appropriate screen size class
    if (width < 480) {
        body.classList.add('screen-mobile');
    } else if (width < 640) {
        body.classList.add('screen-xs');
    } else if (width < 768) {
        body.classList.add('screen-sm');
    } else if (width < 1024) {
        body.classList.add('screen-md');
    } else if (width < 1280) {
        body.classList.add('screen-lg');
    } else if (width < 1536) {
        body.classList.add('screen-xl');
    } else if (width < 1920) {
        body.classList.add('screen-2xl');
    } else if (width < 2560) {
        body.classList.add('screen-3xl');
    } else {
        body.classList.add('screen-4xl');
    }
    
    // Update container max-widths
    updateContainerWidths();
}

// Update container widths based on screen size
function updateContainerWidths() {
    const containers = document.querySelectorAll('.container, .responsive-container');
    const width = window.innerWidth;
    
    containers.forEach(container => {
        if (width < 640) {
            container.style.maxWidth = '100%';
            container.style.paddingLeft = '1rem';
            container.style.paddingRight = '1rem';
        } else if (width < 768) {
            container.style.maxWidth = '640px';
            container.style.paddingLeft = '1.5rem';
            container.style.paddingRight = '1.5rem';
        } else if (width < 1024) {
            container.style.maxWidth = '768px';
            container.style.paddingLeft = '2rem';
            container.style.paddingRight = '2rem';
        } else if (width < 1280) {
            container.style.maxWidth = '1024px';
        } else if (width < 1536) {
            container.style.maxWidth = '1280px';
        } else if (width < 1920) {
            container.style.maxWidth = '1536px';
        } else if (width < 2560) {
            container.style.maxWidth = '1920px';
            container.style.paddingLeft = '3rem';
            container.style.paddingRight = '3rem';
        } else {
            container.style.maxWidth = '2560px';
            container.style.paddingLeft = '4rem';
            container.style.paddingRight = '4rem';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    applyResponsiveClasses();
    
    // Update on window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyResponsiveClasses, 250);
    });
    
    // Add responsive table handling
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.closest('.table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive overflow-x-auto';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
    
    // Fix modal sizing
    const modals = document.querySelectorAll('.modal, [id*="modal"]');
    modals.forEach(modal => {
        modal.classList.add('modal-responsive');
    });
});

// Export for use in other scripts
window.responsiveHelpers = {
    applyResponsiveClasses,
    updateContainerWidths,
    getScreenSize: function() {
        const width = window.innerWidth;
        if (width < 480) return 'mobile';
        if (width < 640) return 'xs';
        if (width < 768) return 'sm';
        if (width < 1024) return 'md';
        if (width < 1280) return 'lg';
        if (width < 1536) return 'xl';
        if (width < 1920) return '2xl';
        if (width < 2560) return '3xl';
        return '4xl';
    }
};