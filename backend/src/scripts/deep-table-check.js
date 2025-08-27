// Deep check for all tables including potential hidden or system tables
const { query } = require('../config/database');

async function deepTableCheck() {
    console.log('🔍 TIEFER DATENBANK-CHECK\n');
    console.log('='.repeat(60));
    
    try {
        // 1. Check mit verschiedenen Methoden
        console.log('\n1. ALLE TABELLEN (sqlite_master):');
        const tables1 = await query(`
            SELECT type, name, tbl_name, sql 
            FROM sqlite_master 
            WHERE type IN ('table', 'view')
            ORDER BY type, name
        `);
        
        const tableList = Array.isArray(tables1) ? tables1 : (tables1.rows || []);
        
        console.log(`Gefunden: ${tableList.length} Objekte\n`);
        
        tableList.forEach(obj => {
            console.log(`  ${obj.type.toUpperCase()}: ${obj.name}`);
            if (obj.name.toLowerCase().includes('benutzer') || 
                obj.name.toLowerCase().includes('user')) {
                console.log(`    ⚠️ USER-BEZOGEN!`);
                console.log(`    SQL: ${obj.sql?.substring(0, 100)}...`);
            }
        });
        
        // 2. Suche speziell nach sbv_benutzer
        console.log('\n2. SUCHE NACH "sbv_benutzer":');
        try {
            const sbvCheck = await query(`SELECT COUNT(*) as count FROM sbv_benutzer`);
            console.log(`  ✓ Tabelle sbv_benutzer existiert! Einträge: ${sbvCheck[0].count}`);
            
            // Get schema
            const sbvSchema = await query(`PRAGMA table_info(sbv_benutzer)`);
            console.log('\n  Schema von sbv_benutzer:');
            const schemaList = Array.isArray(sbvSchema) ? sbvSchema : (sbvSchema.rows || []);
            
            const columnNames = [];
            schemaList.forEach(col => {
                console.log(`    - ${col.name} (${col.type})`);
                columnNames.push(col.name.toLowerCase());
            });
            
            // Check for duplicate columns
            const duplicates = columnNames.filter((item, index) => 
                columnNames.indexOf(item) !== index);
            
            if (duplicates.length > 0) {
                console.log(`\n  ⚠️ DOPPELTE SPALTEN GEFUNDEN:`);
                duplicates.forEach(dup => {
                    console.log(`    - "${dup}" kommt mehrmals vor!`);
                });
            }
            
            // Sample data
            const sample = await query(`SELECT * FROM sbv_benutzer LIMIT 2`);
            const sampleList = Array.isArray(sample) ? sample : (sample.rows || []);
            
            if (sampleList.length > 0) {
                console.log('\n  Sample-Daten:');
                sampleList.forEach((row, idx) => {
                    console.log(`    Eintrag ${idx + 1}:`);
                    Object.keys(row).slice(0, 5).forEach(key => {
                        if (key !== 'password' && key !== 'passwort') {
                            console.log(`      ${key}: ${row[key]}`);
                        }
                    });
                });
            }
            
        } catch (err) {
            console.log(`  ✗ Tabelle sbv_benutzer nicht gefunden oder Fehler: ${err.message}`);
        }
        
        // 3. Suche nach anderen User-Tabellen-Varianten
        console.log('\n3. SUCHE NACH ANDEREN USER-TABELLEN:');
        const variants = ['SBV_benutzer', 'sbv_users', 'SBV_users', 'benutzer', 'Benutzer'];
        
        for (const variant of variants) {
            try {
                const check = await query(`SELECT COUNT(*) as count FROM ${variant}`);
                console.log(`  ✓ ${variant}: ${check[0].count} Einträge`);
            } catch (err) {
                // Silent fail - table doesn't exist
            }
        }
        
        // 4. Check welche Datenbank tatsächlich verwendet wird
        console.log('\n4. AKTUELLE DATENBANK-VERBINDUNG:');
        const dbInfo = await query(`PRAGMA database_list`);
        const dbList = Array.isArray(dbInfo) ? dbInfo : (dbInfo.rows || []);
        
        dbList.forEach(db => {
            console.log(`  - ${db.name}: ${db.file}`);
        });
        
    } catch (error) {
        console.error('❌ Fehler:', error);
    }
}

// Run check
if (require.main === module) {
    deepTableCheck().then(() => {
        console.log('\n✅ Deep Check abgeschlossen');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Fehler:', err);
        process.exit(1);
    });
}

module.exports = deepTableCheck;