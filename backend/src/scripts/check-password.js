// Check password hash
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function checkPassword() {
    try {
        console.log('🔍 Checking password hashes...');
        
        // Get user
        const users = await query('SELECT id, email, password_hash FROM users WHERE email = $1', ['admin@sbv.ch']);
        
        if (users.rows && users.rows.length > 0) {
            const user = users.rows[0];
            console.log('Found user:', user.email);
            console.log('Password hash:', user.password_hash);
            
            // Test password
            const testPassword = 'Test1234!';
            const isValid = await bcrypt.compare(testPassword, user.password_hash);
            console.log('Password Test1234! is valid:', isValid);
            
            // Create new hash
            const newHash = await bcrypt.hash(testPassword, 10);
            console.log('New hash would be:', newHash);
            
            // Update if needed
            if (!isValid) {
                console.log('Updating password hash...');
                await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
                console.log('✅ Password updated!');
            }
        } else {
            console.log('User not found!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPassword();