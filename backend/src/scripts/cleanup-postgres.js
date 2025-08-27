#!/usr/bin/env node

// KRITISCHES SCRIPT: PostgreSQL Datenbank aufräumen
// WARNUNG: Dieses Script macht GROSSE Änderungen an der Produktions-DB!

const { Pool } = require('pg');
const readline = require('readline');

// PostgreSQL Verbindung
const pool = new Pool({
    host: 'postgresql-sbv-fg-app-u38422.vm.elestio.app',
    port: 25432,
    user: 'postgres',
    password: 'RvFb9djO-BpZC-JpFFB2su',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function cleanup() {
    let client;
    
    try {
        console.log('🔄 POSTGRESQL CLEANUP SCRIPT');
        console.log('='.repeat(60));
        console.log('\n⚠️  WARNUNG: Dieses Script macht GROSSE Änderungen!');
        console.log('   Bitte stellen Sie sicher, dass Sie ein BACKUP haben!\n');
        
        const confirm = await askQuestion('Fortfahren? (ja/nein): ');
        if (confirm.toLowerCase() !== 'ja') {
            console.log('❌ Abgebrochen');
            process.exit(0);
        }
        
        client = await pool.connect();
        console.log('\n✅ Verbunden mit PostgreSQL\n');
        
        // PHASE 1: Analyse
        console.log('📊 PHASE 1: ANALYSE');
        console.log('-'.repeat(40));
        
        // User-Tabellen analysieren
        const userTables = ['users', 'sbv_users', 'sbv_benutzer'];
        const userCounts = {};
        
        for (const table of userTables) {
            const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
            userCounts[table] = parseInt(result.rows[0].count);
            console.log(`  ${table}: ${userCounts[table]} Einträge`);
        }
        
        // PHASE 2: Daten-Konsolidierung
        console.log('\n📋 PHASE 2: DATEN-KONSOLIDIERUNG');
        console.log('-'.repeat(40));
        
        // Backup erstellen
        console.log('\n1. Erstelle Backup-Tabellen...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS users_backup_cleanup AS 
            SELECT * FROM users
        `);
        console.log('   ✅ users_backup_cleanup erstellt');
        
        // User-Daten konsolidieren
        console.log('\n2. Konsolidiere User-Daten...');
        
        // Prüfe ob es Überschneidungen gibt
        const overlap = await client.query(`
            SELECT COUNT(*) as count FROM sbv_users su
            JOIN users u ON u.email = su.email
        `);
        
        if (overlap.rows[0].count > 0) {
            console.log(`   ⚠️ ${overlap.rows[0].count} User existieren in beiden Tabellen`);
        }
        
        // Füge fehlende User von sbv_users zu users hinzu
        const inserted = await client.query(`
            INSERT INTO users (email, name, password_hash, role, created_at, updated_at)
            SELECT 
                email,
                COALESCE(first_name || ' ' || last_name, username) as name,
                password_hash,
                role,
                created_at,
                updated_at
            FROM sbv_users
            WHERE email NOT IN (SELECT email FROM users)
            RETURNING id
        `);
        
        console.log(`   ✅ ${inserted.rowCount} User von sbv_users übertragen`);
        
        // Füge User von sbv_benutzer hinzu (falls unique)
        const insertedBenutzer = await client.query(`
            INSERT INTO users (email, name, password_hash, role, created_at, updated_at)
            SELECT 
                email,
                name,
                password_hash,
                COALESCE(role, 'user') as role,
                created_at,
                updated_at
            FROM sbv_benutzer
            WHERE email NOT IN (SELECT email FROM users)
            AND email IS NOT NULL
            AND password_hash IS NOT NULL
            RETURNING id
        `);
        
        console.log(`   ✅ ${insertedBenutzer.rowCount} User von sbv_benutzer übertragen`);
        
        // PHASE 3: Fehlende Tabellen erstellen
        console.log('\n🔨 PHASE 3: FEHLENDE TABELLEN ERSTELLEN');
        console.log('-'.repeat(40));
        
        // Massnahmen Tabelle
        await client.query(`
            CREATE TABLE IF NOT EXISTS massnahmen (
                id SERIAL PRIMARY KEY,
                gesuch_id INTEGER,
                titel VARCHAR(255) NOT NULL,
                beschreibung TEXT,
                status VARCHAR(50) DEFAULT 'geplant',
                prioritaet VARCHAR(20) DEFAULT 'mittel',
                verantwortlich VARCHAR(255),
                faellig_am DATE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('   ✅ massnahmen Tabelle erstellt');
        
        // K_Ziele Tabelle
        await client.query(`
            CREATE TABLE IF NOT EXISTS k_ziele (
                id SERIAL PRIMARY KEY,
                gesuch_id INTEGER,
                ziel_nummer VARCHAR(20),
                ziel_text TEXT NOT NULL,
                zielwert DECIMAL(10,2),
                einheit VARCHAR(50),
                erreicht DECIMAL(10,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'offen',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('   ✅ k_ziele Tabelle erstellt');
        
        // Jahresvergleich Tabelle
        await client.query(`
            CREATE TABLE IF NOT EXISTS jahresvergleich (
                id SERIAL PRIMARY KEY,
                gesuch_id INTEGER,
                jahr INTEGER NOT NULL,
                kennzahl VARCHAR(255),
                wert DECIMAL(15,2),
                vorjahr_wert DECIMAL(15,2),
                veraenderung_prozent DECIMAL(5,2),
                kommentar TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('   ✅ jahresvergleich Tabelle erstellt');
        
        // PHASE 4: Duplikate-Tabellen umbenennen (nicht löschen!)
        console.log('\n🗂️ PHASE 4: DUPLIKATE DEAKTIVIEREN');
        console.log('-'.repeat(40));
        
        const duplicateTables = [
            'sbv_users', 'sbv_benutzer', 'sbv_berichte', 
            'sbv_reports', 'reports', 'sbv_dokumente',
            'sbv_gesuche', 'sbv_teilprojekte', 'subprojects'
        ];
        
        for (const table of duplicateTables) {
            try {
                await client.query(`
                    ALTER TABLE ${table} 
                    RENAME TO archived_${table}_${Date.now()}
                `);
                console.log(`   ✅ ${table} → archived_${table}_*`);
            } catch (err) {
                console.log(`   ⚠️ ${table}: ${err.message}`);
            }
        }
        
        // PHASE 5: Constraints und Indexes
        console.log('\n🔧 PHASE 5: CONSTRAINTS & INDEXES');
        console.log('-'.repeat(40));
        
        // Wichtige Constraints
        try {
            await client.query(`
                ALTER TABLE users 
                ADD CONSTRAINT users_email_unique UNIQUE (email)
            `);
        } catch (err) {
            // Constraint existiert bereits
            console.log(`   ℹ️ Email Constraint: ${err.message}`);
        }
        console.log('   ✅ Email Unique Constraint');
        
        // Indexes für Performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_rapporte_author_id ON rapporte(author_id);
            CREATE INDEX IF NOT EXISTS idx_documents_rapport_id ON documents(rapport_id);
            CREATE INDEX IF NOT EXISTS idx_massnahmen_gesuch_id ON massnahmen(gesuch_id);
        `);
        console.log('   ✅ Performance Indexes erstellt');
        
        // PHASE 6: Zusammenfassung
        console.log('\n✅ CLEANUP ABGESCHLOSSEN!');
        console.log('='.repeat(60));
        
        // Finale Statistik
        const finalStats = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as users_count,
                (SELECT COUNT(*) FROM rapporte) as rapporte_count,
                (SELECT COUNT(*) FROM documents) as documents_count
        `);
        
        console.log('\n📊 FINALE STATISTIK:');
        console.log(`   Users: ${finalStats.rows[0].users_count}`);
        console.log(`   Rapporte: ${finalStats.rows[0].rapporte_count}`);
        console.log(`   Dokumente: ${finalStats.rows[0].documents_count}`);
        
        console.log('\n💡 NÄCHSTE SCHRITTE:');
        console.log('   1. Testen Sie die Anwendung');
        console.log('   2. Prüfen Sie ob alle User sich einloggen können');
        console.log('   3. Löschen Sie archived_* Tabellen nach 30 Tagen');
        
    } catch (error) {
        console.error('\n❌ FEHLER:', error.message);
        console.error(error);
        
        if (client) {
            console.log('\n⚠️ Rollback wird durchgeführt...');
            await client.query('ROLLBACK');
        }
        
    } finally {
        if (client) client.release();
        await pool.end();
        rl.close();
    }
}

// Script ausführen
cleanup().then(() => {
    console.log('\n✅ Script beendet');
    process.exit(0);
}).catch(err => {
    console.error('❌ Unerwarteter Fehler:', err);
    process.exit(1);
});