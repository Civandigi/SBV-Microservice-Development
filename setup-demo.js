// SBV Professional V2 - Demo Setup Script
const bcrypt = require('bcryptjs');
const { query, testConnection, initializeTables } = require('./backend/src/config/database');

async function setupDemo() {
    console.log('🚀 Setting up SBV Professional V2 Demo...\n');
    
    try {
        // Test database connection
        console.log('1. Testing database connection...');
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        
        // Initialize tables
        console.log('\n2. Initializing database tables...');
        await initializeTables();
        
        // Create demo users
        console.log('\n3. Creating demo users...');
        await createDemoUsers();
        
        // Create demo data
        console.log('\n4. Creating demo data...');
        await createDemoData();
        
        console.log('\n✅ Demo setup completed successfully!');
        console.log('\n📝 Demo Login Credentials:');
        console.log('👤 Admin User:');
        console.log('   Email: admin@sbv.ch');
        console.log('   Password: admin123');
        console.log('\n👤 Regular User:');
        console.log('   Email: user@sbv.ch');
        console.log('   Password: user123');
        console.log('\n🌐 Access the app at: http://localhost:3000');
        
    } catch (error) {
        console.error('❌ Demo setup failed:', error);
        process.exit(1);
    }
}

async function createDemoUsers() {
    // Admin User
    const adminHash = await bcrypt.hash('admin123', 12);
    try {
        await query(`
            INSERT INTO users (email, name, first_name, last_name, password_hash, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role
        `, ['admin@sbv.ch', 'Admin User', 'Admin', 'User', adminHash, 'admin']);
        console.log('   ✓ Admin user created');
    } catch (error) {
        // SQLite doesn't support ON CONFLICT, so try INSERT or UPDATE separately
        try {
            await query(`
                INSERT INTO users (email, name, first_name, last_name, password_hash, role)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['admin@sbv.ch', 'Admin User', 'Admin', 'User', adminHash, 'admin']);
            console.log('   ✓ Admin user created');
        } catch (insertError) {
            // User might already exist, try to update
            await query(`
                UPDATE users SET password_hash = ?, role = ? WHERE email = ?
            `, [adminHash, 'admin', 'admin@sbv.ch']);
            console.log('   ✓ Admin user updated');
        }
    }
    
    // Regular User
    const userHash = await bcrypt.hash('user123', 12);
    try {
        await query(`
            INSERT INTO users (email, name, first_name, last_name, password_hash, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash
        `, ['user@sbv.ch', 'Test User', 'Test', 'User', userHash, 'user']);
        console.log('   ✓ Regular user created');
    } catch (error) {
        // SQLite doesn't support ON CONFLICT, so try INSERT or UPDATE separately
        try {
            await query(`
                INSERT INTO users (email, name, first_name, last_name, password_hash, role)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['user@sbv.ch', 'Test User', 'Test', 'User', userHash, 'user']);
            console.log('   ✓ Regular user created');
        } catch (insertError) {
            // User might already exist, try to update
            await query(`
                UPDATE users SET password_hash = ? WHERE email = ?
            `, [userHash, 'user@sbv.ch']);
            console.log('   ✓ Regular user updated');
        }
    }
}

async function createDemoData() {
    try {
        // Get user IDs
        const adminResult = await query('SELECT id FROM users WHERE email = ?', ['admin@sbv.ch']);
        const userResult = await query('SELECT id FROM users WHERE email = ?', ['user@sbv.ch']);
        
        if (adminResult.rows.length === 0 || userResult.rows.length === 0) {
            console.log('   ⚠️  Users not found, skipping demo data creation');
            return;
        }
        
        const adminId = adminResult.rows[0].id;
        const userId = userResult.rows[0].id;
        
        // Create demo rapport (standalone, without gesuch/teilprojekt)
        try {
            await query(`
                INSERT INTO rapporte (datum, titel, beschreibung, arbeitszeit, abteilung, status, author_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                '2025-01-30',
                'Demo Rapport',
                'Dies ist ein Demo-Rapport für Testzwecke',
                8.0,
                'IT-Abteilung',
                'entwurf',
                userId
            ]);
            console.log('   ✓ Demo rapport created');
        } catch (error) {
            console.log('   ✓ Demo rapport already exists');
        }
        
    } catch (error) {
        console.error('   ❌ Error creating demo data:', error);
    }
}

// Run setup if called directly
if (require.main === module) {
    setupDemo().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = { setupDemo };