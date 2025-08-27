// Check table structure
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('../config/database');

async function checkTableStructure() {
    try {
        console.log('🔍 Checking table structure...');
        
        // Get column information for rapporte table
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rapporte'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📊 RAPPORTE TABLE COLUMNS:');
        console.log('=' .repeat(50));
        const columns = Array.isArray(result) ? result : (result.rows || []);
        columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        // Check if table has any data
        const countResult = await query('SELECT COUNT(*) as count FROM rapporte');
        console.log(`\n📝 Total rapports in database: ${countResult[0].count}`);
        
        // Get sample data
        const sampleResult = await query('SELECT * FROM rapporte LIMIT 1');
        if (sampleResult.length > 0) {
            console.log('\n🔍 Sample rapport columns:');
            console.log(Object.keys(sampleResult[0]));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit();
    }
}

checkTableStructure();