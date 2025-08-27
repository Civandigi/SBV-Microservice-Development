/**
 * Audit Login Credentials
 * Prüft welche Benutzer in der Datenbank existieren
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Öffne Datenbank
const db = new sqlite3.Database('./database.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

console.log('🔍 AUDIT DER LOGIN-DATEN\n');
console.log('=' .repeat(70));

// Teste die Demo-Zugangsdaten aus dem Frontend
const demoCredentials = [
    { email: 'admin@sbv.ch', password: 'Test1234!', expectedRole: 'admin' },
    { email: 'user@sbv.ch', password: 'Test1234!', expectedRole: 'user' },
    { email: 'super@sbv.ch', password: 'Test1234!', expectedRole: 'super_admin' },
    // Teste auch die alten Passwörter
    { email: 'admin@sbv.ch', password: 'admin123', expectedRole: 'admin' },
    { email: 'user@sbv.ch', password: 'user123', expectedRole: 'user' },
    { email: 'super@sbv.ch', password: 'super123', expectedRole: 'super_admin' }
];

console.log('\n📊 BENUTZER IN DER DATENBANK:\n');

// Hole alle Benutzer
db.all('SELECT id, email, name, role, password, is_active, created_at FROM users', [], (err, users) => {
    if (err) {
        console.error('Error fetching users:', err.message);
        db.close();
        return;
    }
    
    // Zeige alle Benutzer
    users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Name: ${user.name}`);
        console.log(`🎭 Role: ${user.role}`);
        console.log(`✅ Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`📅 Created: ${user.created_at}`);
        console.log(`🔐 Password Hash: ${user.password.substring(0, 20)}...`);
        console.log('-'.repeat(40));
    });
    
    console.log(`\n📈 TOTAL: ${users.length} Benutzer gefunden\n`);
    console.log('=' .repeat(70));
    
    // Teste die Demo-Credentials
    console.log('\n🔑 TESTE DEMO-ZUGANGSDATEN:\n');
    
    let testCount = 0;
    const totalTests = demoCredentials.length;
    
    demoCredentials.forEach(cred => {
        const user = users.find(u => u.email === cred.email);
        
        if (!user) {
            console.log(`❌ ${cred.email} - NICHT GEFUNDEN in Datenbank`);
            testCount++;
            if (testCount === totalTests) finishAudit();
            return;
        }
        
        // Teste Passwort
        bcrypt.compare(cred.password, user.password, (err, isValid) => {
            if (err) {
                console.log(`⚠️  ${cred.email} - Fehler beim Passwort-Test: ${err.message}`);
            } else if (isValid) {
                console.log(`✅ ${cred.email} + "${cred.password}" = FUNKTIONIERT! (Role: ${user.role})`);
            } else {
                console.log(`❌ ${cred.email} + "${cred.password}" = FALSCHES PASSWORT`);
            }
            
            testCount++;
            if (testCount === totalTests) finishAudit();
        });
    });
    
    function finishAudit() {
        console.log('\n' + '=' .repeat(70));
        console.log('\n📋 ZUSAMMENFASSUNG:\n');
        
        // Finde funktionierende Kombinationen
        const workingCreds = [];
        let checkCount = 0;
        
        users.forEach(user => {
            // Teste Standard-Passwörter
            const standardPasswords = ['admin123', 'user123', 'super123', 'Test1234!', 'test123'];
            
            standardPasswords.forEach(pwd => {
                bcrypt.compare(pwd, user.password, (err, isValid) => {
                    if (!err && isValid) {
                        workingCreds.push({
                            email: user.email,
                            password: pwd,
                            role: user.role
                        });
                    }
                    
                    checkCount++;
                    if (checkCount === users.length * standardPasswords.length) {
                        console.log('FUNKTIONIERENDE LOGIN-DATEN:');
                        console.log('-'.repeat(40));
                        
                        if (workingCreds.length === 0) {
                            console.log('⚠️  Keine Standard-Passwörter funktionieren!');
                        } else {
                            workingCreds.forEach(cred => {
                                console.log(`📧 ${cred.email}`);
                                console.log(`🔑 ${cred.password}`);
                                console.log(`🎭 ${cred.role}`);
                                console.log('-'.repeat(20));
                            });
                        }
                        
                        console.log('\n💡 EMPFEHLUNG:');
                        console.log('Die Demo-Zugangsdaten im Frontend sollten aktualisiert werden!');
                        
                        db.close();
                    }
                });
            });
        });
    }
});