// USER-BEREINIGUNG FÜR SBV PROFESSIONAL V2
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../config/database');

async function cleanupUsers() {
    console.log('🧹 STARTE USER-BEREINIGUNG...\n');
    
    try {
        // 1. Lösche Test/Demo User
        console.log('📌 SCHRITT 1: Lösche Test/Demo User');
        console.log('-'.repeat(40));
        
        const deleteEmails = [
            'admin@sbv-demo.ch',
            'user@sbv-demo.ch',
            'superadmin@sbv-demo.ch',
            'test-admin@sbv.ch',
            'test-user@sbv.ch',
            'test-superadmin@sbv.ch'
        ];
        
        for (const email of deleteEmails) {
            const result = await query('DELETE FROM users WHERE email = $1', [email]);
            console.log(`  ❌ Gelöscht: ${email}`);
        }
        
        // 2. Korrigiere falsche Rolle
        console.log('\n📌 SCHRITT 2: Korrigiere Rollen');
        console.log('-'.repeat(40));
        
        // Korrigiere digitale-rakete User
        await query(
            'UPDATE users SET role = $1, name = $2 WHERE email = $3',
            ['super_admin', 'Digitale Rakete Admin', 'superadmin@digitale-rakete.ch']
        );
        console.log('  ✅ superadmin@digitale-rakete.ch -> Rolle: super_admin');
        
        // 3. Verifiziere finale User-Liste
        console.log('\n📌 SCHRITT 3: Finale User-Liste');
        console.log('-'.repeat(40));
        
        const finalUsers = await query(`
            SELECT email, name, role 
            FROM users 
            ORDER BY 
                CASE role 
                    WHEN 'super_admin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'user' THEN 3
                END, email
        `);
        
        console.log('\n✅ BEREINIGTE USER-LISTE:\n');
        finalUsers.rows.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email}`);
            console.log(`     Name: ${user.name}`);
            console.log(`     Rolle: ${user.role}`);
            console.log(`     Passwort: Test1234!`);
            console.log('');
        });
        
        // 4. Statistik
        console.log('📊 STATISTIK:');
        console.log('-'.repeat(40));
        const stats = await query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);
        
        stats.rows.forEach(stat => {
            console.log(`  ${stat.role}: ${stat.count} User`);
        });
        
        console.log('\n✅ BEREINIGUNG ABGESCHLOSSEN!');
        
    } catch (error) {
        console.error('❌ FEHLER:', error.message);
    } finally {
        process.exit(0);
    }
}

cleanupUsers();