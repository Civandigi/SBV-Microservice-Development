// Script zum Prüfen der Rapport-Autoren
const { query } = require('../config/database');

async function checkRapportAuthors() {
    console.log('📊 Prüfe Rapporte und ihre Autoren...\n');
    
    try {
        // Hole alle Rapporte mit Author-Informationen
        const rapporte = await query(`
            SELECT 
                r.id as rapport_id,
                r.titel,
                r.status,
                r.author_id,
                r.created_at,
                u.id as user_id,
                u.name as author_name,
                u.email as author_email,
                u.role as author_role
            FROM rapporte r
            LEFT JOIN users u ON r.author_id = u.id
            ORDER BY r.created_at DESC
        `);
        
        const rapportList = Array.isArray(rapporte) ? rapporte : (rapporte.rows || []);
        
        console.log(`Anzahl Rapporte: ${rapportList.length}\n`);
        
        if (rapportList.length > 0) {
            console.log('Rapporte Details:');
            console.log('=================\n');
            
            rapportList.forEach((rapport, index) => {
                console.log(`Rapport #${index + 1}:`);
                console.log(`  ID: ${rapport.rapport_id}`);
                console.log(`  Titel: ${rapport.titel}`);
                console.log(`  Status: ${rapport.status}`);
                console.log(`  Erstellt am: ${rapport.created_at}`);
                console.log(`  \nAutor-Informationen:`);
                console.log(`  Author ID (in rapport): ${rapport.author_id}`);
                console.log(`  User ID (aus users tabelle): ${rapport.user_id}`);
                console.log(`  Name: ${rapport.author_name || 'KEIN USER GEFUNDEN!'}`);
                console.log(`  Email: ${rapport.author_email || 'KEINE EMAIL!'}`);
                console.log(`  Rolle: ${rapport.author_role || 'KEINE ROLLE!'}`);
                
                if (!rapport.author_name) {
                    console.log(`  ⚠️ WARNUNG: Kein User mit ID ${rapport.author_id} gefunden!`);
                }
                
                console.log('\n' + '-'.repeat(50) + '\n');
            });
        } else {
            console.log('Keine Rapporte in der Datenbank gefunden.');
        }
        
    } catch (error) {
        console.error('❌ Fehler:', error);
    }
}

// Führe Check aus
if (require.main === module) {
    checkRapportAuthors().then(() => {
        console.log('✅ Check abgeschlossen');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Fehler:', err);
        process.exit(1);
    });
}

module.exports = checkRapportAuthors;