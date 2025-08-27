#!/usr/bin/env node

// Cleanup der VERBLEIBENDEN Duplikat-Tabellen

const { Pool } = require('pg');

const pool = new Pool({
    host: 'postgresql-sbv-fg-app-u38422.vm.elestio.app',
    port: 25432,
    user: 'postgres',
    password: 'RvFb9djO-BpZC-JpFFB2su',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function cleanupRemaining() {
    let client;
    
    try {
        console.log('🧹 CLEANUP VERBLEIBENDE TABELLEN');
        console.log('='.repeat(60));
        
        client = await pool.connect();
        console.log('✅ Verbunden mit PostgreSQL\n');
        
        // Liste der noch zu archivierenden Tabellen
        const remainingTables = [
            'sbv_assignments',
            'sbv_benutzer_backup', 
            'sbv_permissions',
            'sbv_role_permissions',
            'sbv_zuweisungen'
        ];
        
        console.log('📋 Zu archivierende Tabellen:');
        for (const table of remainingTables) {
            console.log(`   - ${table}`);
        }
        
        console.log('\n🗄️ Archiviere Tabellen...\n');
        
        for (const table of remainingTables) {
            try {
                // Prüfe ob Tabelle existiert
                const exists = await client.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = $1
                    )
                `, [table]);
                
                if (exists.rows[0].exists) {
                    // Zähle Einträge
                    const count = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                    
                    // Archiviere Tabelle
                    const newName = `archived_${table}_${Date.now()}`;
                    await client.query(`ALTER TABLE ${table} RENAME TO ${newName}`);
                    
                    console.log(`   ✅ ${table} → ${newName} (${count.rows[0].count} Einträge)`);
                } else {
                    console.log(`   ⚠️ ${table} existiert nicht`);
                }
            } catch (err) {
                console.log(`   ❌ ${table}: ${err.message}`);
            }
        }
        
        // Zusätzlich: Prüfe auf weitere potenzielle Duplikate
        console.log('\n🔍 Prüfe auf weitere Duplikate...\n');
        
        const checkResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (
                table_name LIKE 'sbv_%' 
                OR table_name LIKE '%_backup%'
                OR table_name IN ('reports', 'subprojects')
            )
            AND table_name NOT LIKE 'archived_%'
            ORDER BY table_name
        `);
        
        if (checkResult.rows.length === 0) {
            console.log('   ✅ Keine weiteren Duplikate gefunden!');
        } else {
            console.log('   ⚠️ Noch vorhandene potenzielle Duplikate:');
            checkResult.rows.forEach(row => {
                console.log(`      - ${row.table_name}`);
            });
        }
        
        // Finale Statistik
        console.log('\n📊 FINALE TABELLEN-ÜBERSICHT:');
        console.log('='.repeat(60));
        
        const finalTables = await client.query(`
            SELECT 
                CASE 
                    WHEN table_name LIKE 'archived_%' THEN 'Archiviert'
                    WHEN table_name IN ('users', 'rapporte', 'documents', 'gesuche', 
                                       'teilprojekte', 'comments', 'activity_logs',
                                       'massnahmen', 'k_ziele', 'jahresvergleich') THEN 'Haupt-Tabellen'
                    ELSE 'Andere'
                END as category,
                COUNT(*) as count
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            GROUP BY category
            ORDER BY category
        `);
        
        finalTables.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.count} Tabellen`);
        });
        
        console.log('\n✅ CLEANUP ABGESCHLOSSEN!');
        
    } catch (error) {
        console.error('\n❌ FEHLER:', error.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

// Script ausführen
cleanupRemaining().then(() => {
    console.log('\n✅ Script beendet');
    process.exit(0);
}).catch(err => {
    console.error('❌ Fehler:', err);
    process.exit(1);
});