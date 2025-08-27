// Analyse welche Tabellen im Code verwendet werden
const fs = require('fs').promises;
const path = require('path');

// Tabellen aus der PostgreSQL-Datenbank
const postgresTableNames = [
    'users', 'sbv_users', 'sbv_benutzer', 'sbv_benutzer_backup', 'user_permissions',
    'rapporte', 'reports', 'sbv_berichte', 'sbv_reports',
    'documents', 'sbv_dokumente', 'standalone_documents',
    'gesuche', 'sbv_gesuche',
    'teilprojekte', 'sbv_teilprojekte', 'subprojects',
    'activities', 'activity_logs', 'applications', 'assignments', 'sbv_assignments', 'sbv_zuweisungen',
    'comments', 'migration_log', 'notifications',
    'rapport_attachments', 'rapport_kpis', 'rapport_massnahmen', 'rapport_templates',
    'sbv_permissions', 'sbv_role_permissions'
];

// SQLite Tabellen (lokal)
const sqliteTableNames = [
    'users', 'rapporte', 'documents', 'comments', 'activity_logs',
    'teilprojekte', 'massnahmen', 'k_ziele', 'gesuche', 'jahresvergleich'
];

async function searchInFile(filePath, tables) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const foundTables = new Set();
        
        tables.forEach(table => {
            // Suche nach verschiedenen SQL-Mustern
            const patterns = [
                new RegExp(`FROM\\s+${table}(?:\\s|$|;)`, 'gi'),
                new RegExp(`INSERT\\s+INTO\\s+${table}(?:\\s|\\()`, 'gi'),
                new RegExp(`UPDATE\\s+${table}\\s+SET`, 'gi'),
                new RegExp(`DELETE\\s+FROM\\s+${table}(?:\\s|$)`, 'gi'),
                new RegExp(`JOIN\\s+${table}\\s+`, 'gi'),
                new RegExp(`CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${table}`, 'gi'),
                new RegExp(`ALTER\\s+TABLE\\s+${table}`, 'gi'),
                new RegExp(`DROP\\s+TABLE\\s+(IF\\s+EXISTS\\s+)?${table}`, 'gi'),
                new RegExp(`["'\`]${table}["'\`]`, 'g'), // In Quotes
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    foundTables.add(table);
                    break;
                }
            }
        });
        
        return foundTables;
    } catch (err) {
        return new Set();
    }
}

async function walkDir(dir, tables) {
    const results = new Map();
    
    async function walk(currentDir) {
        try {
            const files = await fs.readdir(currentDir);
            
            for (const file of files) {
                const filePath = path.join(currentDir, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isDirectory()) {
                    if (!file.includes('node_modules') && !file.startsWith('.')) {
                        await walk(filePath);
                    }
                } else if (file.endsWith('.js') || file.endsWith('.sql')) {
                    const foundTables = await searchInFile(filePath, tables);
                    if (foundTables.size > 0) {
                        const relativePath = path.relative(dir, filePath);
                        results.set(relativePath, foundTables);
                    }
                }
            }
        } catch (err) {
            // Ignore
        }
    }
    
    await walk(dir);
    return results;
}

async function main() {
    console.log('🔍 ANALYSE: Welche Tabellen werden im Code verwendet?\n');
    console.log('='.repeat(60));
    
    const projectRoot = path.join(__dirname, '../../..');
    
    // Backend-Code analysieren
    console.log('\n📂 Backend-Code Analyse...\n');
    const backendResults = await walkDir(path.join(projectRoot, 'backend'), postgresTableNames);
    
    // Tabellen-Nutzung zusammenfassen
    const tableUsage = new Map();
    
    backendResults.forEach((tables, file) => {
        tables.forEach(table => {
            if (!tableUsage.has(table)) {
                tableUsage.set(table, []);
            }
            tableUsage.get(table).push(file);
        });
    });
    
    // Kategorisieren
    const usedInCode = new Set();
    const notUsedInCode = new Set();
    
    postgresTableNames.forEach(table => {
        if (tableUsage.has(table)) {
            usedInCode.add(table);
        } else {
            notUsedInCode.add(table);
        }
    });
    
    // Ergebnisse ausgeben
    console.log('✅ TABELLEN DIE IM CODE VERWENDET WERDEN:\n');
    Array.from(usedInCode).sort().forEach(table => {
        console.log(`  📋 ${table}`);
        const files = tableUsage.get(table);
        if (files && files.length <= 3) {
            files.forEach(file => {
                console.log(`     → ${file}`);
            });
        } else if (files) {
            console.log(`     → Verwendet in ${files.length} Dateien`);
        }
    });
    
    console.log('\n❌ TABELLEN DIE NICHT IM CODE GEFUNDEN WURDEN:\n');
    Array.from(notUsedInCode).sort().forEach(table => {
        console.log(`  ⚠️ ${table}`);
    });
    
    // SQLite vs PostgreSQL Vergleich
    console.log('\n' + '='.repeat(60));
    console.log('\n🔄 SQLITE vs POSTGRESQL VERGLEICH:\n');
    
    console.log('Tabellen in BEIDEN Systemen:');
    const inBoth = sqliteTableNames.filter(t => postgresTableNames.includes(t));
    inBoth.forEach(t => console.log(`  ✅ ${t}`));
    
    console.log('\nNur in SQLite (lokal):');
    const onlyInSQLite = sqliteTableNames.filter(t => !postgresTableNames.includes(t));
    onlyInSQLite.forEach(t => console.log(`  📱 ${t}`));
    
    console.log('\nNur in PostgreSQL (Produktion):');
    const onlyInPostgres = postgresTableNames.filter(t => !sqliteTableNames.includes(t));
    onlyInPostgres.forEach(t => console.log(`  ☁️ ${t}`));
    
    // Empfehlungen
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 EMPFEHLUNGEN:\n');
    
    console.log('1. HAUPT-TABELLEN (sollten bleiben):');
    console.log('   - users (NICHT sbv_users oder sbv_benutzer)');
    console.log('   - rapporte (NICHT reports oder sbv_berichte)');
    console.log('   - documents (NICHT sbv_dokumente)');
    console.log('   - gesuche (NICHT sbv_gesuche)');
    console.log('   - teilprojekte (NICHT sbv_teilprojekte)');
    
    console.log('\n2. ZU LÖSCHEN (Duplikate):');
    const toDelete = ['sbv_users', 'sbv_benutzer', 'sbv_benutzer_backup', 'sbv_berichte', 
                      'sbv_reports', 'reports', 'sbv_dokumente', 'sbv_gesuche', 
                      'sbv_teilprojekte', 'subprojects'];
    toDelete.forEach(t => console.log(`   🗑️ ${t}`));
    
    console.log('\n3. MIGRATION NOTWENDIG für:');
    console.log('   - massnahmen (fehlt in PostgreSQL)');
    console.log('   - k_ziele (fehlt in PostgreSQL)');
    console.log('   - jahresvergleich (fehlt in PostgreSQL)');
}

main().then(() => {
    console.log('\n✅ Analyse abgeschlossen\n');
    process.exit(0);
}).catch(err => {
    console.error('❌ Fehler:', err);
    process.exit(1);
});