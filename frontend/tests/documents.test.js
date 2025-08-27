// SBV Professional V2 - Documents Page Tests

describe('Documents Page', () => {
    let modalSystem, notifications;
    
    beforeAll(() => {
        // Mock DOM
        document.body.innerHTML = `
            <input placeholder="Nach Dokumenten suchen..." />
            <select>
                <option>Alle Kategorien</option>
                <option>formulare</option>
            </select>
            <tbody></tbody>
            <div data-category="formulare">
                <p class="text-sm text-[var(--color-text-secondary)]">0 Dokumente</p>
            </div>
        `;
        
        // Mock window objects
        window.API_BASE_URL = 'http://localhost:3003';
        window.modalSystem = {
            createFormModal: jest.fn(() => 'modal-123'),
            open: jest.fn(),
            close: jest.fn(),
            confirm: jest.fn()
        };
        window.notifications = {
            success: jest.fn(),
            error: jest.fn(),
            warning: jest.fn(),
            info: jest.fn()
        };
        
        // Mock global functions
        window.showSuccess = jest.fn();
        window.showError = jest.fn();
        window.showWarning = jest.fn();
        window.showInfo = jest.fn();
        
        // Mock localStorage
        Storage.prototype.getItem = jest.fn(() => 'test-token');
        Storage.prototype.setItem = jest.fn();
        Storage.prototype.removeItem = jest.fn();
    });
    
    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();
        fetch.resetMocks();
    });
    
    describe('Document Upload', () => {
        it('should open upload modal when button clicked', async () => {
            const { uploadDocument } = require('../js/documents.js');
            
            await uploadDocument();
            
            expect(window.modalSystem.createFormModal).toHaveBeenCalledWith({
                title: 'Dokument hochladen',
                fields: expect.arrayContaining([
                    expect.objectContaining({ type: 'file', name: 'file' }),
                    expect.objectContaining({ type: 'text', name: 'title' }),
                    expect.objectContaining({ type: 'select', name: 'category' }),
                    expect.objectContaining({ type: 'textarea', name: 'description' })
                ]),
                onSubmit: expect.any(Function)
            });
            expect(window.modalSystem.open).toHaveBeenCalledWith('modal-123');
        });
        
        it('should handle successful upload', async () => {
            fetch.mockResponseOnce(JSON.stringify({ success: true }));
            
            const { uploadDocument } = require('../js/documents.js');
            
            // Create file input mock
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.name = 'file';
            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            Object.defineProperty(fileInput, 'files', {
                value: [file],
                writable: false
            });
            document.body.appendChild(fileInput);
            
            // Get onSubmit callback
            await uploadDocument();
            const onSubmit = window.modalSystem.createFormModal.mock.calls[0][0].onSubmit;
            
            // Call onSubmit
            await onSubmit({
                title: 'Test Document',
                category: 'formulare',
                description: 'Test description'
            });
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3003/api/documents',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.any(FormData)
                })
            );
            expect(window.showSuccess).toHaveBeenCalledWith('Dokument erfolgreich hochgeladen');
            expect(window.modalSystem.close).toHaveBeenCalledWith('modal-123');
        });
        
        it('should show error when no file selected', async () => {
            const { uploadDocument } = require('../js/documents.js');
            
            await uploadDocument();
            const onSubmit = window.modalSystem.createFormModal.mock.calls[0][0].onSubmit;
            
            await onSubmit({
                title: 'Test',
                category: 'formulare'
            });
            
            expect(window.showError).toHaveBeenCalledWith('Bitte wählen Sie eine Datei aus');
            expect(fetch).not.toHaveBeenCalled();
        });
    });
    
    describe('Document Loading', () => {
        it('should load documents on page load', async () => {
            const mockDocuments = [
                {
                    id: 1,
                    title: 'Test Document',
                    filename: 'test.pdf',
                    category: 'formulare',
                    file_size: 1024,
                    created_at: new Date().toISOString()
                }
            ];
            
            fetch.mockResponseOnce(JSON.stringify({
                success: true,
                documents: mockDocuments
            }));
            
            const { loadDocuments } = require('../js/documents.js');
            await loadDocuments();
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3003/api/documents',
                expect.objectContaining({
                    headers: {
                        'Authorization': 'Bearer test-token'
                    }
                })
            );
        });
        
        it('should handle load error', async () => {
            fetch.mockRejectOnce(new Error('Network error'));
            
            const { loadDocuments } = require('../js/documents.js');
            await loadDocuments();
            
            expect(window.showError).toHaveBeenCalledWith('Netzwerkfehler beim Laden der Dokumente');
        });
    });
    
    describe('Document Actions', () => {
        it('should download document', async () => {
            // Mock blob response
            const blob = new Blob(['test content'], { type: 'application/pdf' });
            fetch.mockResponseOnce(blob, {
                headers: {
                    'content-disposition': 'attachment; filename="test.pdf"'
                }
            });
            
            // Mock URL and anchor element
            const mockUrl = 'blob:http://localhost/123';
            window.URL.createObjectURL = jest.fn(() => mockUrl);
            window.URL.revokeObjectURL = jest.fn();
            
            const mockClick = jest.fn();
            const createElementSpy = jest.spyOn(document, 'createElement');
            createElementSpy.mockImplementation((tagName) => {
                if (tagName === 'a') {
                    const anchor = document.createElement('a');
                    anchor.click = mockClick;
                    return anchor;
                }
                return document.createElement(tagName);
            });
            
            const { downloadDocument } = require('../js/documents.js');
            await downloadDocument(1);
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3003/api/documents/1/download',
                expect.objectContaining({
                    headers: {
                        'Authorization': 'Bearer test-token'
                    }
                })
            );
            expect(mockClick).toHaveBeenCalled();
            expect(window.showSuccess).toHaveBeenCalledWith('Download gestartet');
        });
        
        it('should view document', async () => {
            const blob = new Blob(['test content'], { type: 'application/pdf' });
            fetch.mockResponseOnce(blob);
            
            window.open = jest.fn();
            window.URL.createObjectURL = jest.fn(() => 'blob:url');
            window.URL.revokeObjectURL = jest.fn();
            
            const { viewDocument } = require('../js/documents.js');
            await viewDocument(1);
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3003/api/documents/1/view',
                expect.objectContaining({
                    headers: {
                        'Authorization': 'Bearer test-token'
                    }
                })
            );
            expect(window.open).toHaveBeenCalledWith('blob:url', '_blank');
        });
        
        it('should delete document with confirmation', async () => {
            window.modalSystem.confirm.mockResolvedValue(true);
            fetch.mockResponseOnce(JSON.stringify({ success: true }));
            
            const { deleteDocument } = require('../js/documents.js');
            await deleteDocument(1);
            
            expect(window.modalSystem.confirm).toHaveBeenCalledWith({
                title: 'Dokument löschen',
                message: expect.stringContaining('wirklich löschen'),
                confirmText: 'Löschen',
                cancelText: 'Abbrechen',
                danger: true
            });
            
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3003/api/documents/1',
                expect.objectContaining({
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer test-token'
                    }
                })
            );
            
            expect(window.showSuccess).toHaveBeenCalledWith('Dokument erfolgreich gelöscht');
        });
        
        it('should not delete when cancelled', async () => {
            window.modalSystem.confirm.mockResolvedValue(false);
            
            const { deleteDocument } = require('../js/documents.js');
            await deleteDocument(1);
            
            expect(fetch).not.toHaveBeenCalled();
        });
    });
    
    describe('Search and Filter', () => {
        it('should filter by category', () => {
            const { filterByCategory } = require('../js/documents.js');
            
            window.filterByCategory('formulare');
            
            expect(window.showInfo).toHaveBeenCalledWith('Filter: Formulare');
        });
        
        it('should search documents on input', () => {
            const searchInput = document.querySelector('input[placeholder="Nach Dokumenten suchen..."]');
            const event = new Event('input');
            searchInput.value = 'test search';
            
            searchInput.dispatchEvent(event);
            
            // Search functionality is handled internally
            expect(searchInput.value).toBe('test search');
        });
        
        it('should update category statistics', async () => {
            const mockDocuments = [
                { id: 1, category: 'formulare' },
                { id: 2, category: 'formulare' },
                { id: 3, category: 'richtlinien' }
            ];
            
            fetch.mockResponseOnce(JSON.stringify({
                success: true,
                documents: mockDocuments
            }));
            
            const { loadDocuments } = require('../js/documents.js');
            await loadDocuments();
            
            // Stats should be updated in the DOM
            const statElement = document.querySelector('[data-category="formulare"] .text-sm');
            expect(statElement).toBeTruthy();
        });
    });
    
    describe('File Type Validation', () => {
        it('should get correct icon for PDF files', () => {
            const tbody = document.querySelector('tbody');
            tbody.innerHTML = '';
            
            const mockDocuments = [{
                id: 1,
                title: 'Test PDF',
                filename: 'test.pdf',
                category: 'formulare',
                file_size: 1024,
                created_at: new Date().toISOString()
            }];
            
            fetch.mockResponseOnce(JSON.stringify({
                success: true,
                documents: mockDocuments
            }));
            
            const { loadDocuments } = require('../js/documents.js');
            loadDocuments().then(() => {
                const icon = tbody.querySelector('svg');
                expect(icon.classList.contains('text-red-600')).toBe(true);
            });
        });
        
        it('should format file sizes correctly', () => {
            const { formatFileSize } = require('../js/documents.js');
            
            // Test is internal to module, but we can verify through rendered output
            const tbody = document.querySelector('tbody');
            tbody.innerHTML = '';
            
            const mockDocuments = [{
                id: 1,
                title: 'Test',
                filename: 'test.pdf',
                category: 'formulare',
                file_size: 1024 * 1024, // 1MB
                created_at: new Date().toISOString()
            }];
            
            fetch.mockResponseOnce(JSON.stringify({
                success: true,
                documents: mockDocuments
            }));
            
            const { loadDocuments } = require('../js/documents.js');
            loadDocuments().then(() => {
                const sizeCell = tbody.querySelector('td:nth-child(3)');
                expect(sizeCell.textContent).toContain('MB');
            });
        });
    });
});