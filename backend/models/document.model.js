// SBV Professional V2 - Document Model
// Datenbankmodell für Dokumente

const db = require('../src/config/database');

class Document {
    // Create document table
    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS standalone_documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                description TEXT,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_standalone_documents_user_id ON standalone_documents(user_id);
            CREATE INDEX IF NOT EXISTS idx_standalone_documents_category ON standalone_documents(category);
            CREATE INDEX IF NOT EXISTS idx_standalone_documents_created_at ON standalone_documents(created_at DESC);
        `;

        try {
            await db.query(query);
            console.log('Documents table created successfully');
        } catch (error) {
            console.error('Error creating documents table:', error);
            throw error;
        }
    }

    // Create new document
    static async create(documentData) {
        const {
            user_id,
            title,
            filename,
            original_filename,
            category,
            description,
            file_path,
            file_size,
            mime_type
        } = documentData;

        const query = `
            INSERT INTO standalone_documents (
                user_id, title, filename, original_filename, 
                category, description, file_path, file_size, mime_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const values = [
            user_id,
            title,
            filename,
            original_filename,
            category,
            description || null,
            file_path,
            file_size,
            mime_type
        ];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    // Get all documents with optional filters
    static async findAll(userId, role, filters = {}) {
        let query = `
            SELECT 
                d.*,
                u.name as user_name,
                u.email as user_email
            FROM standalone_documents d
            JOIN users u ON d.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 0;

        // User can only see their own documents
        if (role === 'user') {
            query += ` AND d.user_id = $${++paramCount}`;
            values.push(userId);
        }

        // Filter by category if provided
        if (filters.category && filters.category !== 'all') {
            query += ` AND d.category = $${++paramCount}`;
            values.push(filters.category);
        }

        // Search filter
        if (filters.search) {
            query += ` AND (d.title ILIKE $${++paramCount} OR d.description ILIKE $${paramCount})`;
            values.push(`%${filters.search}%`);
        }

        query += ' ORDER BY d.created_at DESC';

        try {
            const result = await db.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }
    }

    // Get document by ID
    static async findById(id, userId, role) {
        let query = `
            SELECT 
                d.*,
                u.name as user_name,
                u.email as user_email
            FROM standalone_documents d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = $1
        `;
        const values = [id];

        // User can only access their own documents
        if (role === 'user') {
            query += ' AND d.user_id = $2';
            values.push(userId);
        }

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching document by ID:', error);
            throw error;
        }
    }

    // Update document
    static async update(id, userId, role, updateData) {
        const { title, category, description } = updateData;
        
        let query = `
            UPDATE standalone_documents
            SET title = $1, category = $2, description = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `;
        const values = [title, category, description, id];

        // User can only update their own documents
        if (role === 'user') {
            query += ' AND user_id = $5';
            values.push(userId);
        }

        query += ' RETURNING *';

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    // Delete document
    static async delete(id, userId, role) {
        let query = 'DELETE FROM standalone_documents WHERE id = $1';
        const values = [id];

        // User can only delete their own documents
        if (role === 'user') {
            query += ' AND user_id = $2';
            values.push(userId);
        }

        query += ' RETURNING *';

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    // Get document statistics
    static async getStats(userId, role) {
        let query = `
            SELECT 
                category,
                COUNT(*) as count
            FROM standalone_documents
            WHERE 1=1
        `;
        const values = [];

        if (role === 'user') {
            query += ' AND user_id = $1';
            values.push(userId);
        }

        query += ' GROUP BY category';

        try {
            const result = await db.query(query, values);
            
            // Convert to object
            const stats = {
                total: 0,
                formulare: 0,
                richtlinien: 0,
                vorlagen: 0,
                berichte: 0
            };

            result.rows.forEach(row => {
                stats[row.category] = parseInt(row.count);
                stats.total += parseInt(row.count);
            });

            return stats;
        } catch (error) {
            console.error('Error fetching document stats:', error);
            throw error;
        }
    }

    // Get recent documents
    static async getRecent(userId, role, limit = 10) {
        let query = `
            SELECT 
                d.*,
                u.name as user_name
            FROM standalone_documents d
            JOIN users u ON d.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 0;

        if (role === 'user') {
            query += ` AND d.user_id = $${++paramCount}`;
            values.push(userId);
        }

        query += ` ORDER BY d.created_at DESC LIMIT $${++paramCount}`;
        values.push(limit);

        try {
            const result = await db.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error fetching recent documents:', error);
            throw error;
        }
    }
}

module.exports = Document;