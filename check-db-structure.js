/**
 * Check Database Structure
 */

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
});

console.log('📊 DATABASE STRUCTURE CHECK\n');

// Check users table structure
db.all("PRAGMA table_info(users)", [], (err, columns) => {
    if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
    }
    
    console.log('USERS TABLE COLUMNS:');
    console.log('-'.repeat(50));
    columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
    });
    
    console.log('\n📧 USERS IN DATABASE:');
    console.log('-'.repeat(50));
    
    // Get all users with correct column names
    db.all('SELECT * FROM users', [], (err, users) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            users.forEach(user => {
                console.log(`\nUser #${user.id}:`);
                Object.keys(user).forEach(key => {
                    if (key.includes('pass') || key.includes('hash')) {
                        console.log(`  ${key}: ${user[key] ? user[key].substring(0, 20) + '...' : 'NULL'}`);
                    } else {
                        console.log(`  ${key}: ${user[key]}`);
                    }
                });
            });
        }
        
        db.close();
    });
});