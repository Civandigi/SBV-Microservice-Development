#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    host: 'postgresql-sbv-fg-app-u38422.vm.elestio.app',
    port: 25432,
    user: 'postgres',
    password: 'RvFb9djO-BpZC-JpFFB2su',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function showStatus() {
    let client;
    
    try {
        console.log('📊 FINALER DATENBANK-STATUS');
        console.log('='.repeat(60));
        
        client = await pool.connect();
        
        // Alle Tabellen abrufen
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        const tables = {
            hauptTabellen: [],
            archiviert: [],
            backup: [],
            andere: []
        };
        
        const hauptTabellenList = [
            'users', 'rapporte', 'documents', 'gesuche', 
            'teilprojekte', 'comments', 'activity_logs',
            'massnahmen', 'k_ziele', 'jahresvergleich'
        ];
        
        result.rows.forEach(row => {
            const name = row.table_name;
            
            if (name.startsWith('archived_')) {
                tables.archiviert.push(name);
            } else if (name.includes('backup')) {
                tables.backup.push(name);
            } else if (hauptTabellenList.includes(name)) {
                tables.hauptTabellen.push(name);
            } else {
                tables.andere.push(name);
            }
        });
        
        console.log('\n✅ HAUPT-TABELLEN (Diese bleiben):');
        console.log('-'.repeat(40));
        tables.hauptTabellen.forEach(t => console.log(`   - ${t}`));
        console.log(`   Gesamt: ${tables.hauptTabellen.length} Tabellen`);
        
        console.log('\n📦 ARCHIVIERTE TABELLEN (Duplikate):');
        console.log('-'.repeat(40));
        if (tables.archiviert.length > 0) {
            tables.archiviert.forEach(t => console.log(`   - ${t}`));
            console.log(`   Gesamt: ${tables.archiviert.length} Tabellen`);
        } else {
            console.log('   Keine gefunden');
        }
        
        console.log('\n💾 BACKUP TABELLEN:');
        console.log('-'.repeat(40));
        if (tables.backup.length > 0) {
            tables.backup.forEach(t => console.log(`   - ${t}`));
            console.log(`   Gesamt: ${tables.backup.length} Tabellen`);
        } else {
            console.log('   Keine gefunden');
        }
        
        console.log('\n📋 ANDERE TABELLEN:');
        console.log('-'.repeat(40));
        if (tables.andere.length > 0) {
            tables.andere.forEach(t => console.log(`   - ${t}`));
            console.log(`   Gesamt: ${tables.andere.length} Tabellen`);
        } else {
            console.log('   Keine gefunden');
        }
        
        // Prüfe auf verbleibende Duplikate
        console.log('\n🔍 DUPLIKAT-CHECK:');
        console.log('-'.repeat(40));
        
        const duplikate = result.rows.filter(r => {
            const name = r.table_name;
            return !name.startsWith('archived_') && 
                   (name.startsWith('sbv_') || 
                    name === 'reports' || 
                    name === 'subprojects' ||
                    (name.includes('benutzer') && name !== 'users'));
        });
        
        if (duplikate.length === 0) {
            console.log('   ✅ KEINE Duplikate mehr vorhanden!');
        } else {
            console.log('   ⚠️ Mögliche Duplikate:');
            duplikate.forEach(d => console.log(`      - ${d.table_name}`));
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('ZUSAMMENFASSUNG:');
        console.log(`  Haupt-Tabellen: ${tables.hauptTabellen.length}`);
        console.log(`  Archiviert: ${tables.archiviert.length}`);
        console.log(`  Backups: ${tables.backup.length}`);
        console.log(`  Andere: ${tables.andere.length}`);
        console.log(`  GESAMT: ${result.rows.length} Tabellen`);
        
    } catch (error) {
        console.error('❌ Fehler:', error.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

showStatus().then(() => {
    console.log('\n✅ Status-Check abgeschlossen');
    process.exit(0);
}).catch(err => {
    console.error('❌ Fehler:', err);
    process.exit(1);
});