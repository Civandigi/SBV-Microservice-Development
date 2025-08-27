// SBV Professional V2 - Document Service
// Business Logic für Dokumentenverwaltung

const Document = require('../models/document.model');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class DocumentService {
    // Upload directory
    static UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');
    
    // Allowed file types
    static ALLOWED_TYPES = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg'
    };

    // Maximum file size (10MB)
    static MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Initialize upload directory
    static async initializeUploadDir() {
        try {
            await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
        } catch (error) {
            console.error('Error creating upload directory:', error);
            throw error;
        }
    }

    // Create new document
    static async createDocument(userId, fileData, metadata) {
        try {
            // Validate file type
            if (!this.ALLOWED_TYPES[fileData.mimetype]) {
                throw new Error('Dateityp nicht erlaubt');
            }

            // Validate file size
            if (fileData.size > this.MAX_FILE_SIZE) {
                throw new Error('Datei ist zu groß (max. 10MB)');
            }

            // Generate unique filename
            const fileExt = path.extname(fileData.originalname);
            const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${fileExt}`;
            const filePath = path.join(this.UPLOAD_DIR, uniqueName);

            // Ensure upload directory exists
            await this.initializeUploadDir();

            // Save file to disk
            await fs.writeFile(filePath, fileData.buffer);

            // Create document record
            const document = await Document.create({
                user_id: userId,
                title: metadata.title,
                filename: uniqueName,
                original_filename: fileData.originalname,
                category: metadata.category,
                description: metadata.description,
                file_path: filePath,
                file_size: fileData.size,
                mime_type: fileData.mimetype
            });

            return document;
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    // Get all documents
    static async getDocuments(userId, role, filters = {}) {
        try {
            const documents = await Document.findAll(userId, role, filters);
            
            // Remove file paths from response for security
            return documents.map(doc => {
                const { file_path, ...safeDoc } = doc;
                return safeDoc;
            });
        } catch (error) {
            console.error('Error getting documents:', error);
            throw error;
        }
    }

    // Get document by ID
    static async getDocumentById(id, userId, role) {
        try {
            const document = await Document.findById(id, userId, role);
            
            if (!document) {
                throw new Error('Dokument nicht gefunden');
            }

            // Remove file path for security
            const { file_path, ...safeDoc } = document;
            return safeDoc;
        } catch (error) {
            console.error('Error getting document by ID:', error);
            throw error;
        }
    }

    // Get document file for download/view
    static async getDocumentFile(id, userId, role) {
        try {
            const document = await Document.findById(id, userId, role);
            
            if (!document) {
                throw new Error('Dokument nicht gefunden');
            }

            // Check if file exists
            try {
                await fs.access(document.file_path);
            } catch {
                throw new Error('Datei nicht gefunden');
            }

            return {
                path: document.file_path,
                filename: document.original_filename,
                mimeType: document.mime_type
            };
        } catch (error) {
            console.error('Error getting document file:', error);
            throw error;
        }
    }

    // Update document
    static async updateDocument(id, userId, role, updateData) {
        try {
            const document = await Document.update(id, userId, role, updateData);
            
            if (!document) {
                throw new Error('Dokument nicht gefunden oder keine Berechtigung');
            }

            // Remove file path for security
            const { file_path, ...safeDoc } = document;
            return safeDoc;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    // Delete document
    static async deleteDocument(id, userId, role) {
        try {
            const document = await Document.delete(id, userId, role);
            
            if (!document) {
                throw new Error('Dokument nicht gefunden oder keine Berechtigung');
            }

            // Delete file from disk
            try {
                await fs.unlink(document.file_path);
            } catch (error) {
                console.error('Error deleting file:', error);
                // Continue even if file deletion fails
            }

            return { message: 'Dokument erfolgreich gelöscht' };
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    // Get document statistics
    static async getDocumentStats(userId, role) {
        try {
            const stats = await Document.getStats(userId, role);
            return stats;
        } catch (error) {
            console.error('Error getting document stats:', error);
            throw error;
        }
    }

    // Get recent documents
    static async getRecentDocuments(userId, role, limit = 10) {
        try {
            const documents = await Document.getRecent(userId, role, limit);
            
            // Remove file paths
            return documents.map(doc => {
                const { file_path, ...safeDoc } = doc;
                return safeDoc;
            });
        } catch (error) {
            console.error('Error getting recent documents:', error);
            throw error;
        }
    }

    // Validate document metadata
    static validateMetadata(metadata) {
        const errors = [];

        if (!metadata.title || metadata.title.trim().length === 0) {
            errors.push('Titel ist erforderlich');
        }

        if (!metadata.category || !['formulare', 'richtlinien', 'vorlagen', 'berichte'].includes(metadata.category)) {
            errors.push('Ungültige Kategorie');
        }

        if (metadata.title && metadata.title.length > 255) {
            errors.push('Titel ist zu lang (max. 255 Zeichen)');
        }

        if (metadata.description && metadata.description.length > 1000) {
            errors.push('Beschreibung ist zu lang (max. 1000 Zeichen)');
        }

        return errors;
    }
}

module.exports = DocumentService;