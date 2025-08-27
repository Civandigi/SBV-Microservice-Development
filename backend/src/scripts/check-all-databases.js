// Check ALL database files in the project
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDatabase(dbPath, label) {
    return new Promise((resolve, reject) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📁 ${label}: ${dbPath}`);
        console.log('='.repeat(60));
        
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error(`❌ Fehler beim Öffnen: ${err.message}`);
                resolve();
                return;
            }
            
            db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
                if (err) {
                    console.error(`❌ Fehler beim Lesen: ${err.message}`);
                    db.close();
                    resolve();
                    return;
                }
                
                console.log(`\nAnzahl Tabellen: ${tables.length}`);
                console.log('\nTabellen-Liste:');
                
                const userTables = [];
                tables.forEach(table => {
                    console.log(`  - ${table.name}`);
                    if (table.name.toLowerCase().includes('user') || 
                        table.name.toLowerCase().includes('benutzer')) {
                        userTables.push(table.name);
                    }
                });
                
                if (userTables.length > 0) {
                    console.log(`\n⚠️ User-bezogene Tabellen (${userTables.length}):`);
                    userTables.forEach(t => console.log(`  - ${t}`));
                }
                
                // Check for SBV_benutzer specifically
                const checkPromises = tables.map(table => {
                    return new Promise((resolveTable) => {
                        if (table.name.toLowerCase().includes('benutzer')) {
                            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                                if (!err && columns) {
                                    console.log(`\n📋 Schema von ${table.name}:`);
                                    columns.forEach(col => {
                                        console.log(`    - ${col.name} (${col.type})`);
                                    });
                                    
                                    // Check for duplicate columns
                                    const colNames = columns.map(c => c.name.toLowerCase());
                                    const duplicates = colNames.filter((item, index) => 
                                        colNames.indexOf(item) !== index);
                                    
                                    if (duplicates.length > 0) {
                                        console.log(`    ⚠️ DOPPELTE SPALTEN: ${duplicates.join(', ')}`);
                                    }
                                }
                                resolveTable();
                            });
                        } else {
                            resolveTable();
                        }
                    });
                });
                
                Promise.all(checkPromises).then(() => {
                    db.close();
                    resolve();
                });
            });
        });
    });
}

async function main() {
    console.log('🔍 SBV Professional V2 - Multi-Database Check');
    console.log('='.repeat(60));
    
    const databases = [
        {
            path: 'C:\\Users\\Ivan\\Desktop\\SBV APP Definitiv\\SBV-app-definitiv-neu\\database.sqlite',
            label: 'HAUPT-DATENBANK (root)'
        },
        {
            path: 'C:\\Users\\Ivan\\Desktop\\SBV APP Definitiv\\SBV-app-definitiv-neu\\backend\\src\\database.sqlite',
            label: 'BACKEND-DATENBANK (src)'
        }
    ];
    
    for (const db of databases) {
        await checkDatabase(db.path, db.label);
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 ZUSAMMENFASSUNG');
    console.log('='.repeat(60));
    console.log('\n⚠️ PROBLEM: Es existieren 2 Datenbank-Dateien!');
    console.log('Dies kann zu Verwirrung führen, wenn verschiedene Teile');
    console.log('der Anwendung unterschiedliche Datenbanken verwenden.');
    console.log('\n✅ EMPFEHLUNG: Verwenden Sie NUR EINE Datenbank-Datei.');
}

main().then(() => {
    console.log('\n✅ Check abgeschlossen');
    process.exit(0);
}).catch(err => {
    console.error('❌ Fehler:', err);
    process.exit(1);
});