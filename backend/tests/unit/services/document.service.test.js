// SBV Professional V2 - Document Service Tests

const DocumentService = require('../../../services/document.service');
const Document = require('../../../models/document.model');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('../../../models/document.model');
jest.mock('fs').promises;

describe('DocumentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createDocument', () => {
        const mockFile = {
            originalname: 'test.pdf',
            mimetype: 'application/pdf',
            size: 1024 * 1024, // 1MB
            buffer: Buffer.from('test file content')
        };

        const mockMetadata = {
            title: 'Test Document',
            category: 'formulare',
            description: 'Test description'
        };

        it('should create document successfully', async () => {
            const mockDocument = {
                id: 1,
                user_id: 1,
                title: 'Test Document',
                filename: '123456-abcdef.pdf',
                original_filename: 'test.pdf',
                category: 'formulare',
                description: 'Test description',
                file_path: '/uploads/documents/123456-abcdef.pdf',
                file_size: 1024 * 1024,
                mime_type: 'application/pdf'
            };

            Document.create.mockResolvedValue(mockDocument);
            fs.mkdir = jest.fn().mockResolvedValue();
            fs.writeFile = jest.fn().mockResolvedValue();

            const result = await DocumentService.createDocument(1, mockFile, mockMetadata);

            expect(Document.create).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 1,
                title: 'Test Document',
                original_filename: 'test.pdf',
                category: 'formulare',
                description: 'Test description',
                file_size: 1024 * 1024,
                mime_type: 'application/pdf'
            }));
            expect(result).toEqual(mockDocument);
        });

        it('should reject unsupported file types', async () => {
            const invalidFile = {
                ...mockFile,
                mimetype: 'application/x-executable'
            };

            await expect(DocumentService.createDocument(1, invalidFile, mockMetadata))
                .rejects.toThrow('Dateityp nicht erlaubt');
        });

        it('should reject files over size limit', async () => {
            const largeFile = {
                ...mockFile,
                size: 11 * 1024 * 1024 // 11MB
            };

            await expect(DocumentService.createDocument(1, largeFile, mockMetadata))
                .rejects.toThrow('Datei ist zu groß (max. 10MB)');
        });
    });

    describe('getDocuments', () => {
        it('should return documents without file paths', async () => {
            const mockDocuments = [
                {
                    id: 1,
                    title: 'Document 1',
                    file_path: '/uploads/doc1.pdf',
                    category: 'formulare'
                },
                {
                    id: 2,
                    title: 'Document 2',
                    file_path: '/uploads/doc2.pdf',
                    category: 'richtlinien'
                }
            ];

            Document.findAll.mockResolvedValue(mockDocuments);

            const result = await DocumentService.getDocuments(1, 'user');

            expect(Document.findAll).toHaveBeenCalledWith(1, 'user', {});
            expect(result).toHaveLength(2);
            expect(result[0]).not.toHaveProperty('file_path');
            expect(result[1]).not.toHaveProperty('file_path');
        });

        it('should pass filters to Document.findAll', async () => {
            const filters = { category: 'formulare', search: 'test' };
            Document.findAll.mockResolvedValue([]);

            await DocumentService.getDocuments(1, 'admin', filters);

            expect(Document.findAll).toHaveBeenCalledWith(1, 'admin', filters);
        });
    });

    describe('getDocumentFile', () => {
        it('should return file information when document exists', async () => {
            const mockDocument = {
                id: 1,
                file_path: '/uploads/test.pdf',
                original_filename: 'test.pdf',
                mime_type: 'application/pdf'
            };

            Document.findById.mockResolvedValue(mockDocument);
            fs.access = jest.fn().mockResolvedValue();

            const result = await DocumentService.getDocumentFile(1, 1, 'user');

            expect(result).toEqual({
                path: '/uploads/test.pdf',
                filename: 'test.pdf',
                mimeType: 'application/pdf'
            });
        });

        it('should throw error when document not found', async () => {
            Document.findById.mockResolvedValue(null);

            await expect(DocumentService.getDocumentFile(1, 1, 'user'))
                .rejects.toThrow('Dokument nicht gefunden');
        });

        it('should throw error when file does not exist', async () => {
            const mockDocument = {
                id: 1,
                file_path: '/uploads/missing.pdf',
                original_filename: 'missing.pdf',
                mime_type: 'application/pdf'
            };

            Document.findById.mockResolvedValue(mockDocument);
            fs.access = jest.fn().mockRejectedValue(new Error('File not found'));

            await expect(DocumentService.getDocumentFile(1, 1, 'user'))
                .rejects.toThrow('Datei nicht gefunden');
        });
    });

    describe('deleteDocument', () => {
        it('should delete document and file successfully', async () => {
            const mockDocument = {
                id: 1,
                file_path: '/uploads/test.pdf'
            };

            Document.delete.mockResolvedValue(mockDocument);
            fs.unlink = jest.fn().mockResolvedValue();

            const result = await DocumentService.deleteDocument(1, 1, 'user');

            expect(Document.delete).toHaveBeenCalledWith(1, 1, 'user');
            expect(fs.unlink).toHaveBeenCalledWith('/uploads/test.pdf');
            expect(result).toEqual({ message: 'Dokument erfolgreich gelöscht' });
        });

        it('should continue even if file deletion fails', async () => {
            const mockDocument = {
                id: 1,
                file_path: '/uploads/test.pdf'
            };

            Document.delete.mockResolvedValue(mockDocument);
            fs.unlink = jest.fn().mockRejectedValue(new Error('File not found'));

            const result = await DocumentService.deleteDocument(1, 1, 'user');

            expect(result).toEqual({ message: 'Dokument erfolgreich gelöscht' });
        });

        it('should throw error when document not found', async () => {
            Document.delete.mockResolvedValue(null);

            await expect(DocumentService.deleteDocument(1, 1, 'user'))
                .rejects.toThrow('Dokument nicht gefunden oder keine Berechtigung');
        });
    });

    describe('validateMetadata', () => {
        it('should return no errors for valid metadata', () => {
            const metadata = {
                title: 'Valid Title',
                category: 'formulare',
                description: 'Valid description'
            };

            const errors = DocumentService.validateMetadata(metadata);
            expect(errors).toHaveLength(0);
        });

        it('should validate required title', () => {
            const metadata = {
                title: '',
                category: 'formulare'
            };

            const errors = DocumentService.validateMetadata(metadata);
            expect(errors).toContain('Titel ist erforderlich');
        });

        it('should validate category', () => {
            const metadata = {
                title: 'Test',
                category: 'invalid'
            };

            const errors = DocumentService.validateMetadata(metadata);
            expect(errors).toContain('Ungültige Kategorie');
        });

        it('should validate title length', () => {
            const metadata = {
                title: 'A'.repeat(256),
                category: 'formulare'
            };

            const errors = DocumentService.validateMetadata(metadata);
            expect(errors).toContain('Titel ist zu lang (max. 255 Zeichen)');
        });

        it('should validate description length', () => {
            const metadata = {
                title: 'Test',
                category: 'formulare',
                description: 'A'.repeat(1001)
            };

            const errors = DocumentService.validateMetadata(metadata);
            expect(errors).toContain('Beschreibung ist zu lang (max. 1000 Zeichen)');
        });
    });

    describe('getDocumentStats', () => {
        it('should return document statistics', async () => {
            const mockStats = {
                total: 10,
                formulare: 3,
                richtlinien: 2,
                vorlagen: 4,
                berichte: 1
            };

            Document.getStats.mockResolvedValue(mockStats);

            const result = await DocumentService.getDocumentStats(1, 'user');

            expect(Document.getStats).toHaveBeenCalledWith(1, 'user');
            expect(result).toEqual(mockStats);
        });
    });

    describe('getRecentDocuments', () => {
        it('should return recent documents without file paths', async () => {
            const mockDocuments = [
                {
                    id: 1,
                    title: 'Recent 1',
                    file_path: '/uploads/recent1.pdf'
                },
                {
                    id: 2,
                    title: 'Recent 2',
                    file_path: '/uploads/recent2.pdf'
                }
            ];

            Document.getRecent.mockResolvedValue(mockDocuments);

            const result = await DocumentService.getRecentDocuments(1, 'admin', 5);

            expect(Document.getRecent).toHaveBeenCalledWith(1, 'admin', 5);
            expect(result).toHaveLength(2);
            expect(result[0]).not.toHaveProperty('file_path');
            expect(result[1]).not.toHaveProperty('file_path');
        });
    });
});