/**
 * Überprüft ob die Templates in der Datenbank sind
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function checkTemplates() {
  let client;
  
  try {
    console.log('🔍 Prüfe Templates in der Datenbank...\n');
    
    client = await pool.connect();
    
    // Prüfe ob Tabelle existiert
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'rapport_templates'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabelle rapport_templates existiert nicht!');
      console.log('Führe das Migrations-Script aus: node backend/src/scripts/migrate-templates-to-db.js');
      return;
    }
    
    // Zähle Templates
    const countResult = await client.query('SELECT COUNT(*) FROM rapport_templates WHERE aktiv = true');
    const count = parseInt(countResult.rows[0].count);
    
    console.log(`📊 Anzahl aktive Templates: ${count}`);
    
    if (count === 0) {
      console.log('❌ Keine Templates in der Datenbank!');
      console.log('Führe das Migrations-Script aus: node backend/src/scripts/migrate-templates-to-db.js');
      return;
    }
    
    // Liste alle Templates
    const templates = await client.query(`
      SELECT teilprojekt, template_name, 
             (template_data->>'gesamtbudget')::int as budget
      FROM rapport_templates 
      WHERE aktiv = true
      ORDER BY teilprojekt
    `);
    
    console.log('\n✅ Vorhandene Templates:');
    templates.rows.forEach(t => {
      const budget = new Intl.NumberFormat('de-CH').format(t.budget);
      console.log(`   - ${t.template_name}: CHF ${budget}`);
    });
    
    console.log('\n✨ Templates sind bereit für die API!');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

checkTemplates();