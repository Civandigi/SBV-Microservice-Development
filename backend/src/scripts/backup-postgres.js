#!/usr/bin/env node

// PostgreSQL Backup Script - Erstellt ein Backup der wichtigsten Daten

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'postgresql-sbv-fg-app-u38422.vm.elestio.app',
    port: 25432,
    user: 'postgres',
    password: 'RvFb9djO-BpZC-JpFFB2su',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function backup() {
    let client;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(__dirname, `../../../backup_${timestamp}.json`);
    
    try {
        console.log('🔄 PostgreSQL Backup wird erstellt...');
        console.log('='.repeat(60));
        
        client = await pool.connect();
        console.log('✅ Verbunden mit PostgreSQL\n');
        
        const backup = {
            timestamp: new Date().toISOString(),
            database: 'postgres',
            host: 'postgresql-sbv-fg-app-u38422.vm.elestio.app',
            tables: {}
        };
        
        // Wichtige Tabellen für Backup
        const importantTables = [
            'users', 'sbv_users', 'sbv_benutzer',
            'rapporte', 'documents', 'gesuche',
            'teilprojekte', 'comments', 'activity_logs'
        ];
        
        console.log('📊 Exportiere Tabellen:');
        
        for (const table of importantTables) {
            try {
                const result = await client.query(`SELECT * FROM ${table}`);
                backup.tables[table] = result.rows;
                console.log(`   ✅ ${table}: ${result.rows.length} Einträge`);
            } catch (err) {
                console.log(`   ⚠️ ${table}: ${err.message}`);
                backup.tables[table] = { error: err.message };
            }
        }
        
        // Backup speichern
        console.log('\n💾 Speichere Backup...');
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        
        const stats = fs.statSync(backupFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        console.log(`\n✅ BACKUP ERFOLGREICH ERSTELLT!`);
        console.log('='.repeat(60));
        console.log(`📁 Datei: ${backupFile}`);
        console.log(`📊 Größe: ${sizeMB} MB`);
        console.log(`📅 Zeit: ${backup.timestamp}`);
        
        // Zusammenfassung
        console.log('\n📋 Gesicherte Daten:');
        Object.keys(backup.tables).forEach(table => {
            if (!backup.tables[table].error) {
                console.log(`   - ${table}: ${backup.tables[table].length} Einträge`);
            }
        });
        
        console.log('\n💡 Dieses Backup enthält alle wichtigen Daten.');
        console.log('   Bei Problemen können Sie die Daten wiederherstellen.');
        
        return backupFile;
        
    } catch (error) {
        console.error('\n❌ FEHLER beim Backup:', error.message);
        throw error;
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

// Script ausführen
if (require.main === module) {
    backup().then((file) => {
        console.log('\n✅ Backup abgeschlossen');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Backup fehlgeschlagen:', err);
        process.exit(1);
    });
}

module.exports = backup;