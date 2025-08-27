// Create Demo Users for PostgreSQL
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function createDemoUsers() {
    try {
        console.log('🔄 Creating demo users...');
        
        // Password hash for all demo users
        const passwordHash = await bcrypt.hash('Test1234!', 10);
        
        const users = [
            {
                email: 'admin@sbv.ch',
                name: 'Admin User',
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin',
                password_hash: passwordHash
            },
            {
                email: 'user@sbv.ch',
                name: 'Normal User',
                first_name: 'Normal',
                last_name: 'User',
                role: 'user',
                password_hash: passwordHash
            },
            {
                email: 'super@sbv.ch',
                name: 'Super Admin',
                first_name: 'Super',
                last_name: 'Admin',
                role: 'super_admin',
                password_hash: passwordHash
            }
        ];
        
        for (const user of users) {
            // Check if user exists
            const existing = await query(
                'SELECT id FROM users WHERE email = $1',
                [user.email]
            );
            
            if (existing.rows && existing.rows.length > 0) {
                console.log(`✅ User ${user.email} already exists`);
                continue;
            }
            
            // Create user
            await query(
                `INSERT INTO users (email, name, first_name, last_name, password_hash, role, is_active) 
                 VALUES ($1, $2, $3, $4, $5, $6, true)`,
                [user.email, user.name, user.first_name, user.last_name, user.password_hash, user.role]
            );
            
            console.log(`✅ Created user: ${user.email} (Password: Test1234!)`);
        }
        
        console.log('\\n✅ Demo users created successfully!');
        console.log('\\nLogin credentials:');
        console.log('  Admin: admin@sbv.ch / Test1234!');
        console.log('  User: user@sbv.ch / Test1234!');
        console.log('  Super Admin: super@sbv.ch / Test1234!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating demo users:', error);
        process.exit(1);
    }
}

createDemoUsers();