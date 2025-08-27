/**
 * Fixt die rapport_templates Tabelle
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function fixTemplateTable() {
  let client;
  
  try {
    console.log('🔧 Fixe rapport_templates Tabelle...\n');
    
    client = await pool.connect();
    
    // Prüfe aktuelle Struktur
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rapport_templates'
      ORDER BY ordinal_position
    `);
    
    console.log('Aktuelle Spalten:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Füge fehlende Spalte hinzu wenn nötig
    const hasAktiv = columns.rows.some(c => c.column_name === 'aktiv');
    
    if (!hasAktiv) {
      console.log('\n➕ Füge "aktiv" Spalte hinzu...');
      await client.query(`
        ALTER TABLE rapport_templates 
        ADD COLUMN IF NOT EXISTS aktiv BOOLEAN DEFAULT true
      `);
      console.log('✅ Spalte hinzugefügt');
    }
    
    // Füge auch andere fehlende Spalten hinzu
    const hasId = columns.rows.some(c => c.column_name === 'id');
    if (!hasId) {
      console.log('\n➕ Füge "id" Spalte hinzu...');
      await client.query(`
        ALTER TABLE rapport_templates 
        ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY
      `);
    }
    
    const hasAktualisiert = columns.rows.some(c => c.column_name === 'aktualisiert_am');
    if (!hasAktualisiert) {
      console.log('\n➕ Füge Zeitstempel hinzu...');
      await client.query(`
        ALTER TABLE rapport_templates 
        ADD COLUMN IF NOT EXISTS aktualisiert_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
    }
    
    // Zähle Templates
    const count = await client.query('SELECT COUNT(*) FROM rapport_templates');
    console.log(`\n📊 Templates in Tabelle: ${count.rows[0].count}`);
    
    if (count.rows[0].count === '0') {
      console.log('❌ Keine Templates vorhanden!');
      console.log('Führe aus: node backend/src/scripts/migrate-templates-to-db.js');
    } else {
      // Liste Templates
      const templates = await client.query(`
        SELECT teilprojekt, template_name,
               (template_data->>'gesamtbudget')::int as budget
        FROM rapport_templates
      `);
      
      console.log('\n✅ Vorhandene Templates:');
      templates.rows.forEach(t => {
        const budget = t.budget ? new Intl.NumberFormat('de-CH').format(t.budget) : '0';
        console.log(`   - ${t.template_name}: CHF ${budget}`);
      });
    }
    
    console.log('\n✨ Tabelle ist bereit!');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

fixTemplateTable();