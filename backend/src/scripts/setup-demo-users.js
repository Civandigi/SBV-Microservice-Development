// SBV Professional V2 - Demo Users Setup
const bcrypt = require('bcryptjs');
const { query, testConnection } = require('../config/database');
const config = require('../config');

const createDemoUsers = async () => {
    try {
        console.log('🔧 Setting up demo users for SBV Professional V2...\n');
        
        // Test database connection
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Database connection failed');
            process.exit(1);
        }
        
        // Demo users to create
        const demoUsers = [
            {
                email: 'user@sbv-demo.ch',
                name: 'Max Mustermann',
                password: 'test123',
                role: 'user'
            },
            {
                email: 'admin@sbv-demo.ch', 
                name: 'Admin User',
                password: 'test123',
                role: 'admin'
            },
            {
                email: 'superadmin@sbv-demo.ch',
                name: 'Super Administrator',
                password: 'test123', 
                role: 'super_admin'
            }
        ];
        
        for (const user of demoUsers) {
            console.log(`Creating user: ${user.email} (${user.role})`);
            
            // Check if user already exists
            const existingUser = await query(
                'SELECT id FROM users WHERE email = $1',
                [user.email]
            );
            
            if (existingUser.rows.length > 0) {
                console.log(`   ⚠️  User ${user.email} already exists, skipping...`);
                continue;
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(user.password, config.security.bcryptRounds);
            
            // Create user
            await query(`
                INSERT INTO users (email, name, password_hash, role, is_active)
                VALUES ($1, $2, $3, $4, true)
            `, [user.email, user.name, passwordHash, user.role]);
            
            console.log(`   ✅ User ${user.email} created successfully`);
        }
        
        console.log('\n🎉 Demo users setup completed!\n');
        console.log('Login credentials:');
        console.log('👤 User:        user@sbv-demo.ch (test123)');
        console.log('👨‍💼 Admin:       admin@sbv-demo.ch (test123)');
        console.log('👑 Super Admin: superadmin@sbv-demo.ch (test123)');
        
    } catch (error) {
        console.error('❌ Error setting up demo users:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    createDemoUsers().then(() => {
        process.exit(0);
    });
}

module.exports = { createDemoUsers };