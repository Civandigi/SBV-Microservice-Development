/**
 * Check rapport table structure
 */

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', sqlite3.OPEN_READONLY);

console.log('📊 CHECKING DATABASE TABLES\n');

// Check rapport table columns
db.all("PRAGMA table_info(rapporte)", [], (err, columns) => {
    if (err) {
        console.error('Error:', err.message);
        return;
    }
    
    console.log('RAPPORTE TABLE COLUMNS:');
    console.log('-'.repeat(50));
    columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
    });
    
    // Check if standalone_documents table exists
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('Error:', err.message);
            return;
        }
        
        console.log('\n\nALL TABLES IN DATABASE:');
        console.log('-'.repeat(50));
        tables.forEach(table => {
            console.log(`- ${table.name}`);
        });
        
        // Check a sample rapport
        db.get('SELECT * FROM rapporte LIMIT 1', [], (err, rapport) => {
            if (err) {
                console.error('Error:', err.message);
            } else if (rapport) {
                console.log('\n\nSAMPLE RAPPORT:');
                console.log('-'.repeat(50));
                Object.keys(rapport).forEach(key => {
                    const value = rapport[key];
                    if (typeof value === 'string' && value.length > 50) {
                        console.log(`${key}: ${value.substring(0, 50)}...`);
                    } else {
                        console.log(`${key}: ${value}`);
                    }
                });
            }
            
            db.close();
        });
    });
});