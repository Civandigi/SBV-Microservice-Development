// Reset all user passwords to Test1234!
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function resetAllPasswords() {
    try {
        console.log('🔄 Resetting all user passwords...');
        
        // New password
        const newPassword = 'Test1234!';
        const newHash = await bcrypt.hash(newPassword, 10);
        
        // Update all users
        const result = await query(
            'UPDATE users SET password_hash = $1',
            [newHash]
        );
        
        console.log('✅ All passwords updated to: Test1234!');
        
        // List all users
        const users = await query('SELECT id, email, name, role FROM users');
        console.log('\nUsers in database:');
        users.rows.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - Password: Test1234!`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAllPasswords();