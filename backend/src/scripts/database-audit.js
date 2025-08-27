// Gründlicher Datenbank-Audit für SBV Professional V2
const { query } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function databaseAudit() {
    console.log('🔍 SBV Professional V2 - Datenbank-Audit\n');
    console.log('='.repeat(60));
    
    const auditResults = {
        timestamp: new Date().toISOString(),
        tables: {},
        duplicates: [],
        issues: [],
        recommendations: []
    };
    
    try {
        // 1. Alle Tabellen auflisten
        console.log('\n📊 SCHRITT 1: Alle Tabellen in der Datenbank\n');
        const tables = await query(`
            SELECT name, sql 
            FROM sqlite_master 
            WHERE type='table' 
            ORDER BY name
        `);
        
        const tableList = Array.isArray(tables) ? tables : (tables.rows || []);
        console.log(`Anzahl Tabellen: ${tableList.length}\n`);
        
        // 2. Analyse jeder Tabelle
        for (const table of tableList) {
            console.log(`\n📋 Tabelle: ${table.name}`);
            console.log('-'.repeat(40));
            
            // Hole Tabellen-Schema
            const columns = await query(`PRAGMA table_info(${table.name})`);
            const columnList = Array.isArray(columns) ? columns : (columns.rows || []);
            
            // Hole Anzahl Einträge
            const countResult = await query(`SELECT COUNT(*) as count FROM ${table.name}`);
            const count = countResult[0]?.count || 0;
            
            // Speichere Informationen
            auditResults.tables[table.name] = {
                columns: columnList.map(col => ({
                    name: col.name,
                    type: col.type,
                    notnull: col.notnull,
                    pk: col.pk
                })),
                rowCount: count,
                createSQL: table.sql
            };
            
            console.log(`  Anzahl Einträge: ${count}`);
            console.log(`  Spalten:`);
            columnList.forEach(col => {
                console.log(`    - ${col.name} (${col.type})${col.pk ? ' [PRIMARY KEY]' : ''}`);
            });
        }
        
        // 3. Identifiziere User-Tabellen
        console.log('\n\n🔍 SCHRITT 2: Analyse der User-Tabellen\n');
        console.log('='.repeat(60));
        
        const userTables = tableList.filter(t => 
            t.name.toLowerCase().includes('user') || 
            t.name.toLowerCase().includes('benutzer')
        );
        
        console.log(`\nGefundene User-bezogene Tabellen: ${userTables.length}`);
        for (const table of userTables) {
            console.log(`\n📌 ${table.name}:`);
            
            // Hole Sample-Daten
            try {
                const sampleData = await query(`SELECT * FROM ${table.name} LIMIT 3`);
                const samples = Array.isArray(sampleData) ? sampleData : (sampleData.rows || []);
                
                if (samples.length > 0) {
                    console.log('  Sample-Daten:');
                    samples.forEach((row, idx) => {
                        console.log(`    Eintrag ${idx + 1}:`);
                        Object.keys(row).forEach(key => {
                            if (key !== 'password' && key !== 'passwort') {
                                console.log(`      ${key}: ${row[key]}`);
                            }
                        });
                    });
                }
                
                // Prüfe auf doppelte Spalten
                const cols = auditResults.tables[table.name].columns;
                const colNames = cols.map(c => c.name.toLowerCase());
                const duplicateCols = colNames.filter((item, index) => colNames.indexOf(item) !== index);
                
                if (duplicateCols.length > 0) {
                    console.log(`  ⚠️ WARNUNG: Doppelte Spalten gefunden: ${duplicateCols.join(', ')}`);
                    auditResults.issues.push(`Tabelle ${table.name} hat doppelte Spalten: ${duplicateCols.join(', ')}`);
                }
                
            } catch (err) {
                console.log(`  ❌ Fehler beim Lesen der Tabelle: ${err.message}`);
            }
        }
        
        // 4. Prüfe welche Tabellen im Code verwendet werden
        console.log('\n\n🔍 SCHRITT 3: Code-Analyse - Welche Tabellen werden verwendet?\n');
        console.log('='.repeat(60));
        
        const codeBaseDir = path.join(__dirname, '..', '..');
        const usedTables = new Set();
        
        // Durchsuche alle JS-Dateien nach Tabellen-Referenzen
        async function searchInFile(filePath) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                // Suche nach SQL-Queries
                const sqlPatterns = [
                    /FROM\s+(\w+)/gi,
                    /INSERT\s+INTO\s+(\w+)/gi,
                    /UPDATE\s+(\w+)/gi,
                    /DELETE\s+FROM\s+(\w+)/gi,
                    /JOIN\s+(\w+)/gi
                ];
                
                sqlPatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1] && !match[1].toLowerCase().includes('select')) {
                            usedTables.add(match[1].toLowerCase());
                        }
                    }
                });
            } catch (err) {
                // Ignore read errors
            }
        }
        
        async function walkDir(dir) {
            try {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = await fs.stat(filePath);
                    
                    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
                        await walkDir(filePath);
                    } else if (file.endsWith('.js')) {
                        await searchInFile(filePath);
                    }
                }
            } catch (err) {
                // Ignore directory read errors
            }
        }
        
        await walkDir(codeBaseDir);
        
        console.log('\nTabellen, die im Code referenziert werden:');
        usedTables.forEach(table => {
            console.log(`  ✓ ${table}`);
        });
        
        console.log('\n\nTabellen, die NICHT im Code verwendet werden:');
        tableList.forEach(table => {
            if (!usedTables.has(table.name.toLowerCase())) {
                console.log(`  ✗ ${table.name} (${auditResults.tables[table.name].rowCount} Einträge)`);
                auditResults.issues.push(`Tabelle ${table.name} wird nicht im Code verwendet`);
            }
        });
        
        // 5. Empfehlungen
        console.log('\n\n📝 SCHRITT 4: Empfehlungen\n');
        console.log('='.repeat(60));
        
        if (userTables.length > 1) {
            console.log('\n⚠️ KRITISCH: Mehrere User-Tabellen gefunden!');
            console.log('Empfehlung: Konsolidieren Sie alle User-Daten in EINE Tabelle.');
            auditResults.recommendations.push('User-Tabellen konsolidieren');
        }
        
        // Speichere Audit-Report
        const reportPath = path.join(__dirname, 'database-audit-report.json');
        await fs.writeFile(reportPath, JSON.stringify(auditResults, null, 2));
        console.log(`\n\n📄 Vollständiger Report gespeichert in: ${reportPath}`);
        
        // Zusammenfassung
        console.log('\n\n📊 ZUSAMMENFASSUNG\n');
        console.log('='.repeat(60));
        console.log(`Gesamtanzahl Tabellen: ${tableList.length}`);
        console.log(`User-bezogene Tabellen: ${userTables.length}`);
        console.log(`Tabellen im Code verwendet: ${usedTables.size}`);
        console.log(`Unbenutzte Tabellen: ${tableList.length - usedTables.size}`);
        console.log(`Gefundene Probleme: ${auditResults.issues.length}`);
        
        if (auditResults.issues.length > 0) {
            console.log('\n⚠️ Gefundene Probleme:');
            auditResults.issues.forEach((issue, idx) => {
                console.log(`  ${idx + 1}. ${issue}`);
            });
        }
        
    } catch (error) {
        console.error('\n❌ Fehler beim Audit:', error);
        auditResults.error = error.message;
    }
    
    return auditResults;
}

// Führe Audit aus
if (require.main === module) {
    databaseAudit().then(() => {
        console.log('\n\n✅ Datenbank-Audit abgeschlossen');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Fehler:', err);
        process.exit(1);
    });
}

module.exports = databaseAudit;