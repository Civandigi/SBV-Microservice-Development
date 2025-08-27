// SBV Professional V2 - Database Configuration
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const config = require('./index');

// WICHTIG: Verwende immer PostgreSQL in Produktion
// SQLite ist nur für lokale Tests ohne PostgreSQL-Zugang
if (process.env.USE_SQLITE === 'true' && process.env.NODE_ENV !== 'production') {
    console.log('✅ Using SQLite for development');
    // Use SQLite configuration
    module.exports = require('./database-sqlite');
} else {
    // Use PostgreSQL configuration
    const { Pool } = require('pg');
    
    // Create PostgreSQL connection pool
    const pool = new Pool({
        connectionString: config.database.url,
        ...config.database.pool,
        // Force SSL for Elestio
        ssl: config.database.url && config.database.url.includes('elestio')
            ? { rejectUnauthorized: false }
            : config.database.ssl
    });

    // Connection event handlers
    pool.on('connect', () => {
        if (config.server.isDevelopment) {
            console.log('✅ PostgreSQL database connected successfully!');
        }
    });

    pool.on('error', (err) => {
        console.error('❌ PostgreSQL connection error:', err);
        process.exit(1);
    });

    // Database connection test
    const testConnection = async () => {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            
            console.log('🗄️  Database connection test successful');
            console.log('📅 Database time:', result.rows[0].now);
            return true;
        } catch (error) {
            console.error('❌ Database connection test failed:', error.message);
            return false;
        }
    };

    // Initialize database tables
    const initializeTables = async () => {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    first_name VARCHAR(255),
                    last_name VARCHAR(255),
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT true,
                    last_login TIMESTAMP,
                    login_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP
                )
            `);
            
            // Add first_name and last_name columns if they don't exist (migration)
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
                ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)
            `);
            
            // Rapporte table
            await client.query(`
                CREATE TABLE IF NOT EXISTS rapporte (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(500) NOT NULL,
                    content TEXT,
                    status VARCHAR(50) DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'fertig', 'genehmigt', 'abgelehnt')),
                    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('niedrig', 'normal', 'hoch', 'kritisch')),
                    category VARCHAR(100),
                    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    submitted_at TIMESTAMP,
                    approved_at TIMESTAMP,
                    rejection_reason TEXT
                )
            `);
            
            // Documents table (for file attachments - stored in database)
            await client.query(`
                CREATE TABLE IF NOT EXISTS documents (
                    id SERIAL PRIMARY KEY,
                    rapport_id INTEGER REFERENCES rapporte(id) ON DELETE CASCADE,
                    filename VARCHAR(255) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    file_size INTEGER,
                    mime_type VARCHAR(100),
                    file_data BYTEA NOT NULL,
                    uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Migration: Update documents table if it exists with old schema
            await client.query(`
                DO $$ 
                BEGIN 
                    -- Check if file_path column exists (old schema)
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'documents' AND column_name = 'file_path'
                    ) THEN
                        -- Drop old file_path column
                        ALTER TABLE documents DROP COLUMN IF EXISTS file_path;
                        -- Add new file_data column if it doesn't exist
                        ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data BYTEA;
                        -- Make file_data NOT NULL for new entries (existing entries would need data migration)
                        -- For now, we'll recreate the table if needed
                        DROP TABLE documents CASCADE;
                        CREATE TABLE documents (
                            id SERIAL PRIMARY KEY,
                            rapport_id INTEGER REFERENCES rapporte(id) ON DELETE CASCADE,
                            filename VARCHAR(255) NOT NULL,
                            original_name VARCHAR(255) NOT NULL,
                            file_size INTEGER,
                            mime_type VARCHAR(100),
                            file_data BYTEA NOT NULL,
                            uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    END IF;
                END $$;
            `);
            
            // Comments table (for rapport workflow)
            await client.query(`
                CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    rapport_id INTEGER REFERENCES rapporte(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Activity log table (for Super Admin)
            await client.query(`
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    action VARCHAR(100) NOT NULL,
                    resource_type VARCHAR(50),
                    resource_id INTEGER,
                    details JSONB,
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Indexes for performance
            await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_rapporte_status ON rapporte(status)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_rapporte_author_id ON rapporte(author_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_rapporte_assigned_to ON rapporte(assigned_to)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_documents_rapport_id ON documents(rapport_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_comments_rapport_id ON comments(rapport_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)');
            
            await client.query('COMMIT');
            console.log('✅ Database tables initialized successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error initializing database tables:', error);
            throw error;
        } finally {
            client.release();
        }
    };

    // Helper function for queries with error handling
    const query = async (text, params) => {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            
            if (config.server.isDevelopment && duration > 1000) {
                console.log(`⚠️  Slow query (${duration}ms):`, text);
            }
            
            return res;
        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    };

    // Get database statistics
    const getStats = async () => {
        try {
            const result = await query(`
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes
                FROM pg_stat_user_tables 
                ORDER BY tablename
            `);
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error getting database stats:', error);
            return [];
        }
    };

    module.exports = {
        pool,
        query,
        testConnection,
        initializeTables,
        getStats
    };
}