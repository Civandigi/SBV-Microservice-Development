// SBV Professional V2 - SQLite Database Configuration (Development)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./index');

// SQLite database file path
const dbPath = path.join(__dirname, '../../..', 'database.sqlite');

// Create SQLite connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ SQLite connection error:', err.message);
        process.exit(1);
    } else {
        console.log('✅ SQLite database connected successfully!');
        console.log('📂 Database file:', dbPath);
    }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Database connection test
const testConnection = async () => {
    return new Promise((resolve, reject) => {
        db.get("SELECT datetime('now') as now", (err, row) => {
            if (err) {
                console.error('❌ Database connection test failed:', err.message);
                resolve(false);
            } else {
                console.log('🗄️  Database connection test successful');
                console.log('📅 Database time:', row.now);
                resolve(true);
            }
        });
    });
};

// Initialize database tables
const initializeTables = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    first_name VARCHAR(255),
                    last_name VARCHAR(255),
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    last_login DATETIME,
                    login_attempts INTEGER DEFAULT 0,
                    locked_until DATETIME
                )
            `);

            // Rapporte table
            db.run(`
                CREATE TABLE IF NOT EXISTS rapporte (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    datum DATE,
                    titel VARCHAR(500) NOT NULL,
                    beschreibung TEXT,
                    arbeitszeit DECIMAL(5,2),
                    abteilung VARCHAR(100),
                    k_ziele_beitraege TEXT,
                    herausforderungen TEXT,
                    status VARCHAR(50) DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'fertig', 'genehmigt', 'abgelehnt')),
                    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('niedrig', 'normal', 'hoch', 'kritisch')),
                    category VARCHAR(100),
                    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    teilprojekt_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    submitted_at DATETIME,
                    approved_at DATETIME,
                    rejection_reason TEXT
                )
            `);


            // Documents table
            db.run(`
                CREATE TABLE IF NOT EXISTS documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rapport_id INTEGER REFERENCES rapporte(id) ON DELETE CASCADE,
                    filename VARCHAR(255) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    file_size INTEGER,
                    mime_type VARCHAR(100),
                    file_data BLOB NOT NULL,
                    uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Comments table
            db.run(`
                CREATE TABLE IF NOT EXISTS comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rapport_id INTEGER REFERENCES rapporte(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Activity log table
            db.run(`
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    action VARCHAR(100) NOT NULL,
                    resource_type VARCHAR(50),
                    resource_id INTEGER,
                    details TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error initializing database tables:', err);
                    reject(err);
                } else {
                    console.log('✅ Database tables initialized successfully');
                    resolve();
                }
            });
        });
    });
};

// Helper function for queries with Promise wrapper
const query = async (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sql, params, (err, rows) => {
                const duration = Date.now() - start;
                if (config.server.isDevelopment && duration > 1000) {
                    console.log(`⚠️  Slow query (${duration}ms):`, sql);
                }
                
                if (err) {
                    console.error('❌ Database query error:', err);
                    reject(err);
                } else {
                    resolve({ rows });
                }
            });
        } else {
            db.run(sql, params, function(err) {
                const duration = Date.now() - start;
                if (config.server.isDevelopment && duration > 1000) {
                    console.log(`⚠️  Slow query (${duration}ms):`, sql);
                }
                
                if (err) {
                    console.error('❌ Database query error:', err);
                    reject(err);
                } else {
                    // For INSERT statements, return the inserted row
                    if (sql.trim().toUpperCase().startsWith('INSERT')) {
                        resolve({ 
                            rows: [{ id: this.lastID }],
                            lastID: this.lastID,
                            changes: this.changes
                        });
                    } else {
                        resolve({ 
                            rows: [],
                            changes: this.changes
                        });
                    }
                }
            });
        }
    });
};

// Get database statistics
const getStats = async () => {
    try {
        const result = await query(`
            SELECT 
                name as tablename,
                type
            FROM sqlite_master 
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);
        
        return result.rows;
    } catch (error) {
        console.error('❌ Error getting database stats:', error);
        return [];
    }
};

module.exports = {
    db,
    query,
    testConnection,
    initializeTables,
    getStats
};