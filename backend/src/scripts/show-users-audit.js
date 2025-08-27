#!/usr/bin/env node

/**
 * User Access Audit Script
 * Zeigt alle Benutzer und deren Zugriffsrechte
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../../database.sqlite');

console.log('\n' + '='.repeat(80));
console.log(' 🔒 ZUGRIFFS-AUDIT - SBV PROFESSIONAL APP');
console.log('='.repeat(80));

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Datenbankverbindung fehlgeschlagen:', err);
        process.exit(1);
    }
});

// Hauptabfrage
db.serialize(() => {
    // 1. Zeige alle Benutzer
    console.log('\n📋 AKTUELLE BENUTZER:\n');
    console.log('ID  | Name                 | Email              | Rolle       | Aktiv | Letzter Login');
    console.log('-'.repeat(90));
    
    db.all(`
        SELECT 
            id, 
            COALESCE(name, '❌ KEIN NAME') as name,
            email, 
            role, 
            is_active,
            COALESCE(datetime(last_login), 'Nie eingeloggt') as last_login
        FROM users 
        ORDER BY 
            CASE role 
                WHEN 'super_admin' THEN 1 
                WHEN 'admin' THEN 2 
                WHEN 'user' THEN 3 
            END, id
    `, (err, users) => {
        if (err) {
            console.error('Fehler:', err);
            return;
        }
        
        users.forEach(u => {
            console.log(
                `${u.id.toString().padEnd(3)} | ` +
                `${u.name.padEnd(20)} | ` +
                `${u.email.padEnd(18)} | ` +
                `${u.role.padEnd(11)} | ` +
                `${u.is_active ? '✅' : '❌'}    | ` +
                `${u.last_login}`
            );
        });
        
        // 2. Statistiken
        console.log('\n📊 ROLLEN-VERTEILUNG:\n');
        const superAdmins = users.filter(u => u.role === 'super_admin');
        const admins = users.filter(u => u.role === 'admin');
        const normalUsers = users.filter(u => u.role === 'user');
        
        console.log(`🔴 Super Admin: ${superAdmins.length} User (${(superAdmins.length/users.length*100).toFixed(0)}%)`);
        superAdmins.forEach(u => console.log(`   - ${u.name} (${u.email}) ${u.is_active ? '✅' : '❌ INAKTIV'}`));
        
        console.log(`🟠 Admin:       ${admins.length} User (${(admins.length/users.length*100).toFixed(0)}%)`);
        admins.forEach(u => console.log(`   - ${u.name} (${u.email}) ${u.is_active ? '✅' : '❌ INAKTIV'}`));
        
        console.log(`🟢 User:        ${normalUsers.length} User (${(normalUsers.length/users.length*100).toFixed(0)}%)`);
        normalUsers.forEach(u => console.log(`   - ${u.name} (${u.email}) ${u.is_active ? '✅' : '❌ INAKTIV'}`));
        
        // 3. Warnungen
        console.log('\n⚠️  SICHERHEITS-WARNUNGEN:\n');
        let warnings = [];
        
        if (admins.length + superAdmins.length > users.length * 0.5) {
            warnings.push(`🔴 ${((admins.length + superAdmins.length)/users.length*100).toFixed(0)}% der User haben Admin-Rechte (zu hoch!)`);
        }
        
        const inactiveAdmins = [...superAdmins, ...admins].filter(u => !u.is_active);
        if (inactiveAdmins.length > 0) {
            warnings.push(`🔴 ${inactiveAdmins.length} Admin-Account(s) sind inaktiv`);
        }
        
        const noNameUsers = users.filter(u => u.name === '❌ KEIN NAME');
        if (noNameUsers.length > 0) {
            warnings.push(`🟠 ${noNameUsers.length} User ohne Namen gefunden`);
        }
        
        const neverLoggedIn = users.filter(u => u.last_login === 'Nie eingeloggt');
        if (neverLoggedIn.length > 0) {
            warnings.push(`🟡 ${neverLoggedIn.length} User haben sich nie eingeloggt`);
        }
        
        if (warnings.length === 0) {
            console.log('✅ Keine kritischen Probleme gefunden');
        } else {
            warnings.forEach(w => console.log(w));
        }
        
        // 4. Neue Multi-User Zuweisungen prüfen
        console.log('\n🔄 MULTI-USER SYSTEM STATUS:\n');
        
        db.all(`
            SELECT COUNT(*) as count FROM teilprojekt_zuweisungen
        `, (err, result) => {
            if (err || !result) {
                console.log('❌ Teilprojekt-Zuweisungen Tabelle nicht gefunden oder leer');
            } else {
                console.log(`✅ Teilprojekt-Zuweisungen: ${result[0].count} Einträge`);
            }
            
            // 5. Zugriffsmatrix
            console.log('\n📊 ZUGRIFFS-MATRIX:\n');
            console.log('Rolle        | Rapporte | User-Mgmt | Gesuch | System | Audit');
            console.log('-'.repeat(65));
            console.log('USER         | Eigene   | ❌        | ❌     | ❌     | ❌');
            console.log('ADMIN        | Alle     | ✅        | ✅     | Teil   | ❌');
            console.log('SUPER_ADMIN  | Alle     | ✅        | ✅     | ✅     | ✅');
            
            console.log('\n' + '='.repeat(80));
            console.log(' AUDIT ABGESCHLOSSEN - ' + new Date().toLocaleString('de-CH'));
            console.log('='.repeat(80) + '\n');
            
            db.close();
        });
    });
});