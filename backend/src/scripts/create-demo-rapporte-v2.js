// Create Demo Rapporte with proper structure
const { query } = require('../config/database');

async function createDemoRapporte() {
    try {
        console.log('🔧 Creating demo rapporte...\n');
        
        // Check if rapporte table exists
        const tableCheck = await query(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='rapporte'
        `);
        
        if (!tableCheck || tableCheck.length === 0) {
            console.error('❌ Rapporte table does not exist!');
            return;
        }
        
        // Clear existing demo data
        await query('DELETE FROM rapporte WHERE titel LIKE "Demo%"');
        
        // Demo rapporte data
        const demoRapporte = [
            {
                titel: 'Demo: Marketing Q1 2024',
                beschreibung: JSON.stringify({
                    teilprojekt: 'marketing',
                    jahr: '2024',
                    periode: 'Q1',
                    budgetBrutto: 50000,
                    istBrutto: 48500,
                    aufwandsminderung: 4850,
                    wasLiefGut: 'Social Media Kampagne erfolgreich durchgeführt',
                    abweichungen: 'Leicht unter Budget dank effizienter Ressourcennutzung',
                    lessonsLearned: 'Frühere Planung ermöglicht bessere Preise'
                }),
                status: 'genehmigt',
                arbeitszeit: 160,
                abteilung: 'Marketing',
                datum: '2024-03-31',
                author_id: 1,
                category: 'marketing'
            },
            {
                titel: 'Demo: IT-Infrastruktur Februar 2024',
                beschreibung: JSON.stringify({
                    teilprojekt: 'it-infrastruktur',
                    jahr: '2024',
                    periode: 'Februar',
                    budgetBrutto: 75000,
                    istBrutto: 78000,
                    aufwandsminderung: 7800,
                    wasLiefGut: 'Server-Migration erfolgreich abgeschlossen',
                    abweichungen: 'Zusätzliche Sicherheitsmaßnahmen erforderlich',
                    lessonsLearned: 'Sicherheitspuffer für unvorhergesehene Anforderungen einplanen'
                }),
                status: 'eingereicht',
                arbeitszeit: 200,
                abteilung: 'IT',
                datum: '2024-02-28',
                author_id: 1,
                category: 'it-infrastruktur'
            },
            {
                titel: 'Demo: Personalentwicklung Q4 2023',
                beschreibung: JSON.stringify({
                    teilprojekt: 'personal',
                    jahr: '2023',
                    periode: 'Q4',
                    budgetBrutto: 30000,
                    istBrutto: 28500,
                    aufwandsminderung: 2850,
                    wasLiefGut: 'Schulungsprogramm für 50 Mitarbeiter durchgeführt',
                    abweichungen: 'Unter Budget geblieben',
                    lessonsLearned: 'Online-Schulungen sind kosteneffizient'
                }),
                status: 'genehmigt',
                arbeitszeit: 80,
                abteilung: 'HR',
                datum: '2023-12-31',
                author_id: 2,
                category: 'personal'
            },
            {
                titel: 'Demo: Vertrieb Januar 2024',
                beschreibung: JSON.stringify({
                    teilprojekt: 'vertrieb',
                    jahr: '2024',
                    periode: 'Januar',
                    budgetBrutto: 120000,
                    istBrutto: 0,
                    aufwandsminderung: 0,
                    wasLiefGut: 'Neue Vertriebspartnerschaft in Verhandlung',
                    abweichungen: 'Noch keine Ausgaben',
                    lessonsLearned: 'Virtuelle Meetings reduzieren Kosten'
                }),
                status: 'entwurf',
                arbeitszeit: 40,
                abteilung: 'Sales',
                datum: '2024-01-31',
                author_id: 1,
                category: 'vertrieb'
            },
            {
                titel: 'Demo: Compliance Q2 2024',
                beschreibung: JSON.stringify({
                    teilprojekt: 'compliance',
                    jahr: '2024',
                    periode: 'Q2',
                    budgetBrutto: 45000,
                    istBrutto: 0,
                    aufwandsminderung: 0,
                    wasLiefGut: 'Neue Richtlinien in Entwicklung',
                    abweichungen: 'Projekt läuft planmäßig',
                    lessonsLearned: 'Regelmäßige Updates wichtig'
                }),
                status: 'eingereicht',
                arbeitszeit: 120,
                abteilung: 'Legal',
                datum: '2024-06-30',
                author_id: 2,
                category: 'compliance'
            }
        ];
        
        // Insert demo rapporte
        for (const rapport of demoRapporte) {
            try {
                await query(`
                    INSERT INTO rapporte (
                        titel, beschreibung, status, arbeitszeit, abteilung,
                        datum, author_id, category, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `, [
                    rapport.titel,
                    rapport.beschreibung,
                    rapport.status,
                    rapport.arbeitszeit,
                    rapport.abteilung,
                    rapport.datum,
                    rapport.author_id,
                    rapport.category
                ]);
                
                console.log(`✅ Created rapport: ${rapport.titel}`);
            } catch (error) {
                console.error(`❌ Error creating rapport ${rapport.titel}:`, error.message);
            }
        }
        
        // Show statistics
        try {
            const count = await query('SELECT COUNT(*) as total FROM rapporte');
            const statusCount = await query(`
                SELECT status, COUNT(*) as count 
                FROM rapporte 
                GROUP BY status
            `);
            
            console.log('\n📊 Rapport Statistics:');
            if (count && count.length > 0) {
                console.log(`Total rapporte: ${count[0].total}`);
            }
            console.log('\nBy Status:');
            if (statusCount && statusCount.length > 0) {
                statusCount.forEach(s => {
                    console.log(`  - ${s.status}: ${s.count}`);
                });
            }
        } catch (statError) {
            console.log('\n⚠️ Could not get statistics:', statError.message);
        }
        
        console.log('\n✅ Demo rapporte created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating demo rapporte:', error);
    }
}

// Run if called directly
if (require.main === module) {
    createDemoRapporte().then(() => {
        process.exit(0);
    });
}

module.exports = { createDemoRapporte };