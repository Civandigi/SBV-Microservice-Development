/**
 * Migration Script: Rapport-Templates in Datenbank
 * Verschiebt alle hardcodierten Templates aus Frontend in PostgreSQL
 * Für produktionsreife, dynamische Datenverwaltung
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

// Die 6 Rapport-Templates für Schweizer Bauernverband
const rapportTemplates = [
  {
    teilprojekt: 'tp1-leitmedien',
    template_name: 'TP1 - Leitmedien',
    template_data: {
      beschreibung: 'Nationale Medienkampagne zur Stärkung der öffentlichen Wahrnehmung',
      gesamtbudget: 1590000,
      massnahmen: [
        {
          id: 'tp1-m1',
          name: 'Print-Kampagne Leitmedien',
          budget: 450000,
          beschreibung: 'Anzeigen in nationalen Tageszeitungen'
        },
        {
          id: 'tp1-m2',
          name: 'TV-Spots SRF',
          budget: 680000,
          beschreibung: 'Werbeblöcke im Schweizer Fernsehen'
        },
        {
          id: 'tp1-m3',
          name: 'Radio-Kampagne',
          budget: 230000,
          beschreibung: 'Radiospots auf SRF und Privatradios'
        },
        {
          id: 'tp1-m4',
          name: 'Online-Banner Leitmedien',
          budget: 230000,
          beschreibung: 'Digitale Werbung auf Newsportalen'
        }
      ],
      kpis: [
        {
          name: 'Medienreichweite',
          zielwert: '2.5 Mio',
          einheit: 'Kontakte'
        },
        {
          name: 'Markenbekanntheit',
          zielwert: '45%',
          einheit: 'Prozent'
        },
        {
          name: 'Positive Berichterstattung',
          zielwert: '120',
          einheit: 'Artikel'
        }
      ]
    }
  },
  {
    teilprojekt: 'tp2-digitale-medien',
    template_name: 'TP2 - Digitale Medien',
    template_data: {
      beschreibung: 'Förderung der Wissensplattform und Dialog in sozialen Netzwerken',
      gesamtbudget: 490000,
      massnahmen: [
        {
          id: 'tp2-m1',
          name: 'Social Media Kampagne',
          budget: 180000,
          beschreibung: 'Facebook, Instagram, LinkedIn Content'
        },
        {
          id: 'tp2-m2',
          name: 'Google Ads',
          budget: 150000,
          beschreibung: 'Search und Display Advertising'
        },
        {
          id: 'tp2-m3',
          name: 'Influencer Marketing',
          budget: 90000,
          beschreibung: 'Kooperationen mit Meinungsführern'
        },
        {
          id: 'tp2-m4',
          name: 'Content Production',
          budget: 70000,
          beschreibung: 'Videos, Grafiken, Blogbeiträge'
        }
      ],
      kpis: [
        {
          name: 'Website-Besucher',
          zielwert: '500000',
          einheit: 'Unique Visitors'
        },
        {
          name: 'Social Media Engagement',
          zielwert: '8.5%',
          einheit: 'Rate'
        },
        {
          name: 'Newsletter-Abonnenten',
          zielwert: '15000',
          einheit: 'Abonnenten'
        }
      ]
    }
  },
  {
    teilprojekt: 'tp3-messen',
    template_name: 'TP3 - Messen & Ausstellungen',
    template_data: {
      beschreibung: 'Präsenz auf Fachmessen und Publikumsmessen',
      gesamtbudget: 870000,
      massnahmen: [
        {
          id: 'tp3-m1',
          name: 'OLMA St. Gallen',
          budget: 280000,
          beschreibung: 'Messestand und Aktivitäten'
        },
        {
          id: 'tp3-m2',
          name: 'BEA Bern',
          budget: 220000,
          beschreibung: 'Messestand und Rahmenprogramm'
        },
        {
          id: 'tp3-m3',
          name: 'Comptoir Suisse',
          budget: 190000,
          beschreibung: 'Messestand in Lausanne'
        },
        {
          id: 'tp3-m4',
          name: 'Regionale Messen',
          budget: 180000,
          beschreibung: 'Kleinere lokale Auftritte'
        }
      ],
      kpis: [
        {
          name: 'Messebesucher am Stand',
          zielwert: '85000',
          einheit: 'Besucher'
        },
        {
          name: 'Verteilte Broschüren',
          zielwert: '50000',
          einheit: 'Stück'
        },
        {
          name: 'Neue Kontakte',
          zielwert: '3500',
          einheit: 'Leads'
        }
      ]
    }
  },
  {
    teilprojekt: 'tp4-events',
    template_name: 'TP4 - Events & Aktionen',
    template_data: {
      beschreibung: 'Durchführung von Veranstaltungen und Aktionen',
      gesamtbudget: 460000,
      massnahmen: [
        {
          id: 'tp4-m1',
          name: 'Tag der offenen Hoftüre',
          budget: 180000,
          beschreibung: 'Nationale Aktion auf Bauernhöfen'
        },
        {
          id: 'tp4-m2',
          name: 'Stadtevents',
          budget: 120000,
          beschreibung: 'Pop-up Events in Städten'
        },
        {
          id: 'tp4-m3',
          name: 'Fachveranstaltungen',
          budget: 90000,
          beschreibung: 'Seminare und Workshops'
        },
        {
          id: 'tp4-m4',
          name: 'Sponsoring Events',
          budget: 70000,
          beschreibung: 'Unterstützung von Drittevents'
        }
      ],
      kpis: [
        {
          name: 'Event-Teilnehmer',
          zielwert: '25000',
          einheit: 'Personen'
        },
        {
          name: 'Medienberichte',
          zielwert: '80',
          einheit: 'Artikel'
        },
        {
          name: 'Kundenzufriedenheit',
          zielwert: '4.5',
          einheit: 'von 5'
        }
      ]
    }
  },
  {
    teilprojekt: 'tp5-schulprojekte',
    template_name: 'TP5 - Schulprojekte',
    template_data: {
      beschreibung: 'Bildungsprogramme für Schulen und Jugendliche',
      gesamtbudget: 380000,
      massnahmen: [
        {
          id: 'tp5-m1',
          name: 'Schule auf dem Bauernhof',
          budget: 150000,
          beschreibung: 'Schulklassen besuchen Bauernhöfe'
        },
        {
          id: 'tp5-m2',
          name: 'Lehrmaterial',
          budget: 80000,
          beschreibung: 'Entwicklung von Unterrichtsmaterial'
        },
        {
          id: 'tp5-m3',
          name: 'Lehrerseminare',
          budget: 70000,
          beschreibung: 'Weiterbildung für Lehrpersonen'
        },
        {
          id: 'tp5-m4',
          name: 'Wettbewerbe',
          budget: 80000,
          beschreibung: 'Schulwettbewerbe zum Thema Landwirtschaft'
        }
      ],
      kpis: [
        {
          name: 'Erreichte Schüler',
          zielwert: '35000',
          einheit: 'Schüler'
        },
        {
          name: 'Teilnehmende Schulen',
          zielwert: '450',
          einheit: 'Schulen'
        },
        {
          name: 'Lehrerfortbildungen',
          zielwert: '25',
          einheit: 'Seminare'
        }
      ]
    }
  },
  {
    teilprojekt: 'tp6-partnerprojekte',
    template_name: 'TP6 - Partnerprojekte (inkl. KEP)',
    template_data: {
      beschreibung: 'Kooperationsprojekte mit Partnern und Koordinierte Einzelprojekte',
      gesamtbudget: 620000,
      massnahmen: [
        {
          id: 'tp6-m1',
          name: 'KEP - Koordinierte Einzelprojekte',
          budget: 250000,
          beschreibung: 'Unterstützung von Einzelprojekten'
        },
        {
          id: 'tp6-m2',
          name: 'Partnerschaften Detailhandel',
          budget: 180000,
          beschreibung: 'Kooperationen mit Coop/Migros'
        },
        {
          id: 'tp6-m3',
          name: 'Branchenkooperationen',
          budget: 110000,
          beschreibung: 'Zusammenarbeit mit Verbänden'
        },
        {
          id: 'tp6-m4',
          name: 'Internationale Projekte',
          budget: 80000,
          beschreibung: 'Grenzüberschreitende Initiativen'
        }
      ],
      kpis: [
        {
          name: 'Anzahl Partnerprojekte',
          zielwert: '28',
          einheit: 'Projekte'
        },
        {
          name: 'Erreichte Reichweite',
          zielwert: '1.2 Mio',
          einheit: 'Kontakte'
        },
        {
          name: 'Co-Finanzierung',
          zielwert: '450000',
          einheit: 'CHF'
        }
      ]
    }
  }
];

async function migrateTemplates() {
  let client;
  
  try {
    console.log('🚀 Starte Template-Migration in PostgreSQL...\n');
    
    // Verbindung testen
    client = await pool.connect();
    console.log('✅ Datenbankverbindung hergestellt\n');
    
    // Tabelle erstellen falls nicht vorhanden
    await client.query(`
      CREATE TABLE IF NOT EXISTS rapport_templates (
        id SERIAL PRIMARY KEY,
        teilprojekt VARCHAR(50) UNIQUE NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        template_data JSONB NOT NULL,
        aktiv BOOLEAN DEFAULT true,
        erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        aktualisiert_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabelle rapport_templates bereit\n');
    
    // Alte Templates löschen
    await client.query('DELETE FROM rapport_templates');
    console.log('🗑️  Alte Templates gelöscht\n');
    
    // Neue Templates einfügen
    console.log('📝 Füge 6 Rapport-Templates ein:\n');
    
    for (const template of rapportTemplates) {
      const result = await client.query(
        `INSERT INTO rapport_templates (teilprojekt, template_name, template_data) 
         VALUES ($1, $2, $3) 
         RETURNING id, teilprojekt, template_name`,
        [template.teilprojekt, template.template_name, JSON.stringify(template.template_data)]
      );
      
      const inserted = result.rows[0];
      console.log(`   ✅ ${inserted.template_name}`);
      console.log(`      Budget: CHF ${template.template_data.gesamtbudget.toLocaleString('de-CH')}`);
      console.log(`      Maßnahmen: ${template.template_data.massnahmen.length}`);
      console.log(`      KPIs: ${template.template_data.kpis.length}\n`);
    }
    
    // Statistik
    const countResult = await client.query('SELECT COUNT(*) FROM rapport_templates');
    const totalBudget = rapportTemplates.reduce((sum, t) => sum + t.template_data.gesamtbudget, 0);
    
    console.log('═══════════════════════════════════════════');
    console.log('📊 MIGRATION ERFOLGREICH ABGESCHLOSSEN');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Templates in DB: ${countResult.rows[0].count}`);
    console.log(`💰 Gesamtbudget: CHF ${totalBudget.toLocaleString('de-CH')}`);
    console.log(`📈 Gesamte Maßnahmen: ${rapportTemplates.reduce((sum, t) => sum + t.template_data.massnahmen.length, 0)}`);
    console.log(`🎯 Gesamte KPIs: ${rapportTemplates.reduce((sum, t) => sum + t.template_data.kpis.length, 0)}`);
    console.log('\n✨ Die App kann jetzt mit echten Datenbank-Templates arbeiten!');
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Script ausführen
migrateTemplates();