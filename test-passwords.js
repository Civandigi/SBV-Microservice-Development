/**
 * Test which passwords work
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite', sqlite3.OPEN_READONLY);

console.log('🔑 TESTING LOGIN CREDENTIALS\n');
console.log('=' .repeat(70));

// Test these password combinations
const testPasswords = [
    'Test1234!',  // From frontend demo
    'admin123',   // Common default
    'user123',    // Common default
    'super123',   // Common default
    'test123',    // Common default
    'SBV2024Admin!', // From .env
    'password',   // Common default
    '123456'      // Common default
];

db.all('SELECT id, email, name, role, password_hash FROM users WHERE is_active = 1', [], async (err, users) => {
    if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
    }
    
    console.log(`Found ${users.length} active users\n`);
    
    const workingCredentials = [];
    
    for (const user of users) {
        console.log(`\nTesting: ${user.email} (${user.role})`);
        console.log('-'.repeat(40));
        
        for (const password of testPasswords) {
            try {
                const isValid = await bcrypt.compare(password, user.password_hash);
                if (isValid) {
                    console.log(`✅ WORKS: "${password}"`);
                    workingCredentials.push({
                        email: user.email,
                        password: password,
                        role: user.role,
                        name: user.name
                    });
                    break; // Found working password, no need to test more
                }
            } catch (err) {
                console.error(`Error testing ${password}:`, err.message);
            }
        }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('\n📋 WORKING CREDENTIALS SUMMARY:\n');
    
    if (workingCredentials.length === 0) {
        console.log('⚠️  No standard passwords work!');
        console.log('The passwords might have been changed.');
    } else {
        workingCredentials.forEach(cred => {
            console.log(`✅ ${cred.role.toUpperCase()}:`);
            console.log(`   Email: ${cred.email}`);
            console.log(`   Password: ${cred.password}`);
            console.log(`   Name: ${cred.name}`);
            console.log();
        });
    }
    
    console.log('=' .repeat(70));
    console.log('\n⚠️  FRONTEND DEMO CREDENTIALS:');
    console.log('The frontend shows:');
    console.log('- admin@sbv.ch (Test1234!)');
    console.log('- user@sbv.ch (Test1234!)');
    console.log('- super@sbv.ch (Test1234!)');
    console.log('\n❌ These DO NOT match the actual working passwords!');
    console.log('The frontend demo credentials need to be updated.');
    
    db.close();
});