// SBV Professional V2 - Notification System
// Toast-Benachrichtigungen für Erfolg, Fehler, Info und Warnungen

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Container für Notifications erstellen
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-4 pointer-events-none';
        document.body.appendChild(this.container);
    }

    show(options = {}) {
        const {
            type = 'info', // success, error, warning, info
            title = '',
            message = '',
            duration = 5000, // Auto-close nach 5 Sekunden
            closable = true,
            action = null // { text: 'Action', onClick: function }
        } = options;

        const id = 'notification-' + Date.now();
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = 'pointer-events-auto max-w-sm w-full bg-white shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 ease-in-out translate-x-full';

        const colors = {
            success: {
                bg: 'bg-green-50',
                border: 'border-green-400',
                icon: 'text-green-400',
                iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            },
            error: {
                bg: 'bg-red-50',
                border: 'border-red-400',
                icon: 'text-red-400',
                iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
            },
            warning: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-400',
                icon: 'text-yellow-400',
                iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            },
            info: {
                bg: 'bg-blue-50',
                border: 'border-blue-400',
                icon: 'text-blue-400',
                iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            }
        };

        const color = colors[type];

        notification.innerHTML = `
            <div class="p-4 ${color.bg} border-l-4 ${color.border}">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 ${color.icon}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${color.iconPath}" />
                        </svg>
                    </div>
                    <div class="ml-3 flex-1">
                        ${title ? `<p class="text-sm font-medium text-gray-900">${title}</p>` : ''}
                        ${message ? `<p class="text-sm text-gray-500 ${title ? 'mt-1' : ''}">${message}</p>` : ''}
                        ${action ? `
                            <button class="mt-2 text-sm font-medium ${color.icon.replace('text-', 'text-')} hover:underline notification-action">
                                ${action.text}
                            </button>
                        ` : ''}
                    </div>
                    ${closable ? `
                        <div class="ml-4 flex-shrink-0 flex">
                            <button class="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 notification-close">
                                <span class="sr-only">Schliessen</span>
                                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Event Listeners
        if (closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => this.remove(id));
        }

        if (action && action.onClick) {
            const actionBtn = notification.querySelector('.notification-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', action.onClick);
            }
        }

        // Zum Container hinzufügen
        this.container.appendChild(notification);

        // Animation
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        }, 10);

        // Auto-close
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        return id;
    }

    // Spezifische Methoden für verschiedene Typen
    success(message, title = 'Erfolg', options = {}) {
        return this.show({
            ...options,
            type: 'success',
            title,
            message
        });
    }

    error(message, title = 'Fehler', options = {}) {
        return this.show({
            ...options,
            type: 'error',
            title,
            message,
            duration: 0 // Fehler sollten manuell geschlossen werden
        });
    }

    warning(message, title = 'Warnung', options = {}) {
        return this.show({
            ...options,
            type: 'warning',
            title,
            message
        });
    }

    info(message, title = 'Information', options = {}) {
        return this.show({
            ...options,
            type: 'info',
            title,
            message
        });
    }

    // Notification entfernen
    remove(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.add('translate-x-full');
            notification.classList.remove('translate-x-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }

    // Alle Notifications entfernen
    clear() {
        const notifications = this.container.querySelectorAll('[id^="notification-"]');
        notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }
}

// Globale Instanz erstellen
// Create global instance
const notifications = new NotificationSystem();
window.notifications = notifications;

// Convenience Functions
const showSuccess = (message, title) => notifications.success(message, title);
const showError = (message, title) => notifications.error(message, title);
const showWarning = (message, title) => notifications.warning(message, title);
const showInfo = (message, title) => notifications.info(message, title);

// Export for ES6 modules
export { showSuccess, showError, showWarning, showInfo };

// Also make available globally for non-module scripts
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;