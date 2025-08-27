// KOMPLETTES USER-AUDIT SCRIPT
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../config/database');

async function userAudit() {
    console.log('='.repeat(80));
    console.log('    USER-AUDIT FÜR SBV PROFESSIONAL V2');
    console.log('='.repeat(80));
    console.log(`Zeitpunkt: ${new Date().toLocaleString('de-CH')}`);
    console.log('');

    try {
        // 1. DATENBANK-INFO
        console.log('📊 DATENBANK-VERBINDUNG:');
        console.log('-'.repeat(40));
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
            const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
            if (urlParts) {
                console.log(`Host: ${urlParts[3]}`);
                console.log(`Port: ${urlParts[4]}`);
                console.log(`Database: ${urlParts[5]}`);
                console.log(`User: ${urlParts[1]}`);
            }
        }
        console.log('');

        // 2. ALLE TABELLEN ANZEIGEN
        console.log('📋 ALLE TABELLEN IN DER DATENBANK:');
        console.log('-'.repeat(40));
        const tables = await query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);
        tables.rows.forEach(table => {
            console.log(`  - ${table.tablename}`);
        });
        console.log('');

        // 3. USER-TABELLE STRUKTUR
        console.log('🔍 USER-TABELLE STRUKTUR:');
        console.log('-'.repeat(40));
        const columns = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        columns.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
        console.log('');

        // 4. ALLE USER AUFLISTEN
        console.log('👥 ALLE USER IN DER DATENBANK:');
        console.log('-'.repeat(40));
        const users = await query(`
            SELECT 
                id, 
                email, 
                name, 
                role, 
                is_active,
                created_at,
                last_login,
                login_attempts,
                locked_until
            FROM users 
            ORDER BY role, email
        `);
        
        console.log(`GESAMT: ${users.rows.length} User\n`);
        
        // Nach Rolle gruppieren
        const byRole = {};
        users.rows.forEach(user => {
            if (!byRole[user.role]) byRole[user.role] = [];
            byRole[user.role].push(user);
        });
        
        // Ausgabe nach Rolle
        for (const [role, roleUsers] of Object.entries(byRole)) {
            console.log(`\n📌 ${role.toUpperCase()} (${roleUsers.length} User):`);
            console.log('  ' + '='.repeat(60));
            roleUsers.forEach(user => {
                console.log(`  ID: ${user.id}`);
                console.log(`  Email: ${user.email}`);
                console.log(`  Name: ${user.name}`);
                console.log(`  Aktiv: ${user.is_active ? '✅' : '❌'}`);
                console.log(`  Erstellt: ${new Date(user.created_at).toLocaleDateString('de-CH')}`);
                console.log(`  Letzter Login: ${user.last_login ? new Date(user.last_login).toLocaleString('de-CH') : 'Noch nie'}`);
                console.log(`  Login-Versuche: ${user.login_attempts || 0}`);
                console.log(`  Gesperrt bis: ${user.locked_until || '-'}`);
                console.log('  ' + '-'.repeat(60));
            });
        }
        
        // 5. DUPLIKATE PRÜFEN
        console.log('\n🔍 DUPLIKATE-CHECK:');
        console.log('-'.repeat(40));
        const duplicates = await query(`
            SELECT email, COUNT(*) as count 
            FROM users 
            GROUP BY email 
            HAVING COUNT(*) > 1
        `);
        if (duplicates.rows.length > 0) {
            console.log('⚠️  DUPLIKATE GEFUNDEN:');
            duplicates.rows.forEach(dup => {
                console.log(`  - ${dup.email}: ${dup.count} mal`);
            });
        } else {
            console.log('✅ Keine Duplikate gefunden');
        }
        
        // 6. ANDERE USER-BEZOGENE TABELLEN
        console.log('\n📊 ANDERE USER-BEZOGENE TABELLEN:');
        console.log('-'.repeat(40));
        
        // Activity Logs
        const activityCount = await query('SELECT COUNT(*) as count FROM activity_logs');
        console.log(`  activity_logs: ${activityCount.rows[0].count} Einträge`);
        
        // Rapporte
        const rapportCount = await query('SELECT COUNT(*) as count FROM rapporte');
        console.log(`  rapporte: ${rapportCount.rows[0].count} Einträge`);
        
        // Sessions (falls vorhanden)
        try {
            const sessionCount = await query('SELECT COUNT(*) as count FROM sessions');
            console.log(`  sessions: ${sessionCount.rows[0].count} Einträge`);
        } catch (e) {
            console.log(`  sessions: Tabelle existiert nicht`);
        }
        
        // 7. SICHERHEITS-CHECK
        console.log('\n🔒 SICHERHEITS-CHECK:');
        console.log('-'.repeat(40));
        
        // Gesperrte User
        const lockedUsers = await query(`
            SELECT email, locked_until 
            FROM users 
            WHERE locked_until IS NOT NULL AND locked_until > NOW()
        `);
        if (lockedUsers.rows.length > 0) {
            console.log('⚠️  Gesperrte User:');
            lockedUsers.rows.forEach(user => {
                console.log(`  - ${user.email} bis ${new Date(user.locked_until).toLocaleString('de-CH')}`);
            });
        } else {
            console.log('✅ Keine gesperrten User');
        }
        
        // Inaktive User
        const inactiveUsers = await query(`
            SELECT email FROM users WHERE is_active = false
        `);
        if (inactiveUsers.rows.length > 0) {
            console.log('⚠️  Inaktive User:');
            inactiveUsers.rows.forEach(user => {
                console.log(`  - ${user.email}`);
            });
        } else {
            console.log('✅ Alle User sind aktiv');
        }
        
        // 8. EMPFEHLUNGEN
        console.log('\n💡 EMPFEHLUNGEN:');
        console.log('-'.repeat(40));
        
        const recommendations = [];
        
        // Check für zu viele Admins
        if (byRole['admin'] && byRole['admin'].length > 3) {
            recommendations.push('⚠️  Zu viele Admin-User (' + byRole['admin'].length + '). Maximal 3 empfohlen.');
        }
        
        // Check für fehlende Super-Admins
        if (!byRole['super_admin'] || byRole['super_admin'].length === 0) {
            recommendations.push('⚠️  Kein Super-Admin vorhanden! Mindestens 1 benötigt.');
        }
        
        // Check für Test-User
        const testUsers = users.rows.filter(u => 
            u.email.includes('test') || 
            u.email.includes('demo') || 
            u.email.includes('@example.com')
        );
        if (testUsers.length > 0) {
            recommendations.push('⚠️  Test/Demo-User gefunden: ' + testUsers.map(u => u.email).join(', '));
        }
        
        if (recommendations.length > 0) {
            recommendations.forEach(rec => console.log(rec));
        } else {
            console.log('✅ Keine kritischen Probleme gefunden');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('AUDIT ABGESCHLOSSEN');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('❌ FEHLER:', error.message);
    } finally {
        process.exit(0);
    }
}

userAudit();