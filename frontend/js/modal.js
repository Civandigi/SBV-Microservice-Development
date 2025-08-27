// SBV Professional V2 - Modal System
// Wiederverwendbares Modal-System für alle Seiten

class ModalSystem {
    constructor() {
        this.activeModals = [];
        this.init();
    }

    init() {
        // ESC-Taste zum Schliessen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                const lastModal = this.activeModals[this.activeModals.length - 1];
                this.close(lastModal);
            }
        });
    }

    // Modal erstellen
    create(options = {}) {
        const {
            id = 'modal-' + Date.now(),
            title = '',
            content = '',
            size = 'medium', // small, medium, large, full
            buttons = [],
            onClose = null,
            closeOnOverlay = true,
            showCloseButton = true
        } = options;

        // Modal Container
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'fixed inset-0 z-50 overflow-y-auto hidden';
        modal.setAttribute('aria-labelledby', id + '-title');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        // Size classes
        const sizeClasses = {
            small: 'max-w-md',
            medium: 'max-w-2xl',
            large: 'max-w-4xl',
            full: 'max-w-7xl'
        };

        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <!-- Background overlay -->
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity modal-overlay" aria-hidden="true"></div>

                <!-- Center modal -->
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} w-full">
                    <!-- Modal header -->
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex items-start justify-between mb-4">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="${id}-title">
                                ${title}
                            </h3>
                            ${showCloseButton ? `
                                <button type="button" class="ml-auto bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 modal-close">
                                    <span class="sr-only">Schliessen</span>
                                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                        <!-- Modal content -->
                        <div class="modal-content">
                            ${content}
                        </div>
                    </div>
                    <!-- Modal footer with buttons -->
                    ${buttons.length > 0 ? `
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                            ${buttons.map(btn => this.createButton(btn)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Event listeners
        if (closeOnOverlay) {
            modal.querySelector('.modal-overlay').addEventListener('click', () => {
                this.close(id);
            });
        }

        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close(id);
            });
        }

        // Custom close handler
        if (onClose) {
            modal.addEventListener('modal-close', onClose);
        }

        document.body.appendChild(modal);
        return id;
    }

    // Button erstellen
    createButton(btnOptions) {
        const {
            text = 'Button',
            type = 'secondary', // primary, secondary, danger
            onClick = null,
            closeModal = false,
            className = ''
        } = btnOptions;

        const typeClasses = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
            secondary: 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
            success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
        };

        const btnId = 'btn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        const button = `
            <button type="button" 
                    id="${btnId}"
                    class="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${typeClasses[type]} ${className}">
                ${text}
            </button>
        `;

        // Event listener wird nach dem Einfügen hinzugefügt
        setTimeout(() => {
            const btnElement = document.getElementById(btnId);
            if (btnElement && onClick) {
                btnElement.addEventListener('click', (e) => {
                    onClick(e);
                    if (closeModal) {
                        const modal = btnElement.closest('[role="dialog"]');
                        if (modal) {
                            this.close(modal.id);
                        }
                    }
                });
            }
        }, 0);

        return button;
    }

    // Modal öffnen
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.activeModals.push(modalId);
            document.body.classList.add('overflow-hidden');
            
            // Focus management
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    // Modal schliessen
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            this.activeModals = this.activeModals.filter(id => id !== modalId);
            
            if (this.activeModals.length === 0) {
                document.body.classList.remove('overflow-hidden');
            }

            // Custom close event
            modal.dispatchEvent(new CustomEvent('modal-close'));
        }
    }

    // Modal zerstören
    destroy(modalId) {
        this.close(modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    // Confirm Dialog
    confirm(options = {}) {
        const {
            title = 'Bestätigung',
            message = 'Sind Sie sicher?',
            confirmText = 'Bestätigen',
            cancelText = 'Abbrechen',
            onConfirm = null,
            onCancel = null,
            danger = false
        } = options;

        return new Promise((resolve) => {
            const modalId = this.create({
                title,
                content: `<p class="text-sm text-gray-500">${message}</p>`,
                size: 'small',
                buttons: [
                    {
                        text: cancelText,
                        type: 'secondary',
                        onClick: () => {
                            if (onCancel) onCancel();
                            resolve(false);
                        },
                        closeModal: true
                    },
                    {
                        text: confirmText,
                        type: danger ? 'danger' : 'primary',
                        onClick: () => {
                            if (onConfirm) onConfirm();
                            resolve(true);
                        },
                        closeModal: true
                    }
                ]
            });

            this.open(modalId);
        });
    }

    // Alert Dialog
    alert(options = {}) {
        const {
            title = 'Hinweis',
            message = '',
            buttonText = 'OK',
            type = 'info' // info, success, warning, error
        } = options;

        const icons = {
            info: '<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
            success: '<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
            warning: '<svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
            error: '<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
        };

        return new Promise((resolve) => {
            const modalId = this.create({
                title,
                content: `
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            ${icons[type]}
                        </div>
                        <p class="text-sm text-gray-500">${message}</p>
                    </div>
                `,
                size: 'small',
                buttons: [
                    {
                        text: buttonText,
                        type: 'primary',
                        onClick: () => resolve(true),
                        closeModal: true
                    }
                ]
            });

            this.open(modalId);
        });
    }

    // Form Modal Helper
    createFormModal(options = {}) {
        const {
            title = 'Formular',
            fields = [],
            onSubmit = null,
            submitText = 'Speichern',
            cancelText = 'Abbrechen',
            size = 'medium'
        } = options;

        let formHtml = '<form id="modal-form" class="space-y-4">';
        
        fields.forEach(field => {
            formHtml += this.createFormField(field);
        });
        
        formHtml += '</form>';

        const modalId = this.create({
            title,
            content: formHtml,
            size,
            buttons: [
                {
                    text: cancelText,
                    type: 'secondary',
                    closeModal: true
                },
                {
                    text: submitText,
                    type: 'primary',
                    onClick: () => {
                        const form = document.getElementById('modal-form');
                        if (form.checkValidity()) {
                            const formData = new FormData(form);
                            const data = Object.fromEntries(formData);
                            if (onSubmit) {
                                onSubmit(data);
                            }
                        } else {
                            form.reportValidity();
                        }
                    }
                }
            ]
        });

        return modalId;
    }

    // Form Field Helper
    createFormField(field) {
        const {
            type = 'text',
            name,
            label,
            value = '',
            required = false,
            placeholder = '',
            options = []
        } = field;

        let fieldHtml = `
            <div>
                <label for="${name}" class="block text-sm font-medium text-gray-700 mb-1">
                    ${label} ${required ? '<span class="text-red-500">*</span>' : ''}
                </label>
        `;

        switch (type) {
            case 'select':
                fieldHtml += `
                    <select name="${name}" id="${name}" 
                            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            ${required ? 'required' : ''}>
                        <option value="">Bitte wählen...</option>
                        ${options.map(opt => `
                            <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                                ${opt.label}
                            </option>
                        `).join('')}
                    </select>
                `;
                break;
            case 'textarea':
                fieldHtml += `
                    <textarea name="${name}" id="${name}" rows="3"
                              class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="${placeholder}"
                              ${required ? 'required' : ''}>${value}</textarea>
                `;
                break;
            case 'checkbox':
                fieldHtml = `
                    <div class="flex items-center">
                        <input type="checkbox" name="${name}" id="${name}"
                               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                               ${value ? 'checked' : ''}>
                        <label for="${name}" class="ml-2 block text-sm text-gray-900">
                            ${label}
                        </label>
                    </div>
                `;
                break;
            default:
                fieldHtml += `
                    <input type="${type}" name="${name}" id="${name}" 
                           value="${value}"
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                           placeholder="${placeholder}"
                           ${required ? 'required' : ''}>
                `;
        }

        fieldHtml += '</div>';
        return fieldHtml;
    }
}

// Globale Instanz erstellen
window.modalSystem = new ModalSystem();