#!/usr/bin/env node

// SICHERER TEST: Was würde das Cleanup-Script machen?
// Keine Änderungen, nur Analyse!

const { Pool } = require('pg');

const pool = new Pool({
    host: 'postgresql-sbv-fg-app-u38422.vm.elestio.app',
    port: 25432,
    user: 'postgres',
    password: 'RvFb9djO-BpZC-JpFFB2su',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function dryRun() {
    let client;
    
    try {
        console.log('🔍 POSTGRESQL CLEANUP - DRY RUN (Nur Analyse!)');
        console.log('='.repeat(60));
        
        client = await pool.connect();
        console.log('\n✅ Verbunden mit PostgreSQL\n');
        
        // 1. User-Tabellen Analyse
        console.log('👥 USER-TABELLEN ANALYSE:');
        console.log('-'.repeat(40));
        
        const userTables = ['users', 'sbv_users', 'sbv_benutzer'];
        let totalUsers = 0;
        const emailsSeen = new Set();
        
        for (const table of userTables) {
            const result = await client.query(`
                SELECT COUNT(*) as count,
                       COUNT(DISTINCT email) as unique_emails
                FROM ${table}
            `);
            
            const emails = await client.query(`SELECT email FROM ${table}`);
            emails.rows.forEach(row => emailsSeen.add(row.email));
            
            console.log(`\n${table}:`);
            console.log(`  Total: ${result.rows[0].count} Einträge`);
            console.log(`  Unique Emails: ${result.rows[0].unique_emails}`);
            
            totalUsers += parseInt(result.rows[0].count);
        }
        
        console.log(`\n📊 GESAMT: ${totalUsers} User-Einträge`);
        console.log(`📧 UNIQUE: ${emailsSeen.size} verschiedene Email-Adressen`);
        
        // 2. Duplikate finden
        console.log('\n🔄 DUPLIKATE ZWISCHEN TABELLEN:');
        console.log('-'.repeat(40));
        
        const duplicates = await client.query(`
            SELECT u.email, 
                   EXISTS(SELECT 1 FROM sbv_users su WHERE su.email = u.email) as in_sbv_users,
                   EXISTS(SELECT 1 FROM sbv_benutzer sb WHERE sb.email = u.email) as in_sbv_benutzer
            FROM users u
        `);
        
        let dupCount = 0;
        duplicates.rows.forEach(row => {
            if (row.in_sbv_users || row.in_sbv_benutzer) {
                dupCount++;
            }
        });
        
        console.log(`  ${dupCount} User existieren in mehreren Tabellen`);
        
        // 3. Fehlende Tabellen
        console.log('\n📋 FEHLENDE TABELLEN (werden erstellt):');
        console.log('-'.repeat(40));
        
        const requiredTables = ['massnahmen', 'k_ziele', 'jahresvergleich'];
        for (const table of requiredTables) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `, [table]);
            
            if (!exists.rows[0].exists) {
                console.log(`  ❌ ${table} - WIRD ERSTELLT`);
            } else {
                console.log(`  ✅ ${table} - existiert bereits`);
            }
        }
        
        // 4. Zu archivierende Tabellen
        console.log('\n🗄️ TABELLEN DIE ARCHIVIERT WERDEN:');
        console.log('-'.repeat(40));
        
        const toArchive = [
            'sbv_users', 'sbv_benutzer', 'sbv_berichte',
            'sbv_reports', 'reports', 'sbv_dokumente',
            'sbv_gesuche', 'sbv_teilprojekte', 'subprojects'
        ];
        
        for (const table of toArchive) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `, [table]);
            
            if (exists.rows[0].exists) {
                const count = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`  📦 ${table} (${count.rows[0].count} Einträge)`);
            }
        }
        
        // 5. Datei-Speicherung
        console.log('\n💾 DATEI-SPEICHERUNG ANALYSE:');
        console.log('-'.repeat(40));
        
        const docStats = await client.query(`
            SELECT 
                COUNT(*) as total_docs,
                SUM(file_size) as total_size,
                AVG(file_size) as avg_size,
                MAX(file_size) as max_size
            FROM documents
        `);
        
        const stats = docStats.rows[0];
        console.log(`  Dokumente: ${stats.total_docs || 0}`);
        console.log(`  Gesamt-Größe: ${((stats.total_size || 0) / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Durchschnitt: ${((stats.avg_size || 0) / 1024).toFixed(2)} KB`);
        console.log(`  Größtes File: ${((stats.max_size || 0) / 1024 / 1024).toFixed(2)} MB`);
        
        // 6. Empfehlungen
        console.log('\n💡 EMPFEHLUNGEN:');
        console.log('='.repeat(60));
        
        console.log('\n1. BACKUP ERSTELLEN:');
        console.log('   pg_dump -h postgresql-sbv-fg-app-u38422.vm.elestio.app \\');
        console.log('           -p 25432 -U postgres -d postgres > backup_before_cleanup.sql');
        
        console.log('\n2. CLEANUP AUSFÜHREN:');
        console.log('   node backend/src/scripts/cleanup-postgres.js');
        
        console.log('\n3. NACH CLEANUP:');
        console.log('   - Alle User testen ob Login funktioniert');
        console.log('   - Rapporte prüfen ob alles angezeigt wird');
        console.log('   - Dokumente testen ob Download funktioniert');
        
        if ((stats.total_size || 0) > 100 * 1024 * 1024) {
            console.log('\n⚠️ WARNUNG: Dokumente nehmen viel Platz ein!');
            console.log('   Erwägen Sie File-Storage außerhalb der DB (S3, etc.)');
        }
        
    } catch (error) {
        console.error('\n❌ FEHLER:', error.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

// Script ausführen
dryRun().then(() => {
    console.log('\n✅ Dry-Run abgeschlossen (keine Änderungen)');
    process.exit(0);
}).catch(err => {
    console.error('❌ Fehler:', err);
    process.exit(1);
});