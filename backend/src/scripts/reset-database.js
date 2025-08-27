// SBV Professional V2 - Database Reset Script
const { query, testConnection } = require('../config/database');

const resetDatabase = async () => {
    try {
        console.log('🗄️  Resetting SBV Professional V2 database...\n');
        
        // Test connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error('❌ Database connection failed!');
            process.exit(1);
        }

        // Drop all tables in reverse order (due to foreign keys)
        const dropQueries = [
            'DROP TABLE IF EXISTS activity_logs CASCADE',
            'DROP TABLE IF EXISTS comments CASCADE', 
            'DROP TABLE IF EXISTS documents CASCADE',
            'DROP TABLE IF EXISTS rapporte CASCADE',
            'DROP TABLE IF EXISTS users CASCADE'
        ];

        console.log('🗑️  Dropping existing tables...');
        for (const sql of dropQueries) {
            await query(sql);
        }

        // Drop indexes  
        const dropIndexes = [
            'DROP INDEX IF EXISTS idx_users_email',
            'DROP INDEX IF EXISTS idx_users_role',
            'DROP INDEX IF EXISTS idx_rapporte_status',
            'DROP INDEX IF EXISTS idx_rapporte_author_id',
            'DROP INDEX IF EXISTS idx_rapporte_assigned_to',
            'DROP INDEX IF EXISTS idx_documents_rapport_id',
            'DROP INDEX IF EXISTS idx_comments_rapport_id',
            'DROP INDEX IF EXISTS idx_activity_logs_user_id'
        ];

        console.log('🗑️  Dropping existing indexes...');
        for (const sql of dropIndexes) {
            await query(sql);
        }

        console.log('✅ Database reset completed!');
        console.log('\n🚀 Now run: npm run dev');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
};

resetDatabase();