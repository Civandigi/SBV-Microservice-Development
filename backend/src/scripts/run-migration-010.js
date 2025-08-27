#!/usr/bin/env node

/**
 * Run Migration 010: Multi-User Teilprojekt System
 * Führt die Migration für das neue Zuweisungssystem aus
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Pfade
const dbPath = path.join(__dirname, '../../../database.sqlite');
const migrationPath = path.join(__dirname, '../../migrations/010_multi_user_teilprojekt_system.sql');

console.log('🚀 Starting Migration 010: Multi-User Teilprojekt System');
console.log('📂 Database:', dbPath);
console.log('📄 Migration file:', migrationPath);

// Lese Migration SQL
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Verbinde zur Datenbank
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// Führe Migration aus
db.serialize(() => {
    // Aktiviere Foreign Keys
    db.run("PRAGMA foreign_keys = ON");
    
    // Splitte SQL in einzelne Statements (bei ; trennen, aber nicht innerhalb von Strings)
    const statements = migrationSQL
        .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + (stmt.trim().endsWith(';') ? '' : ';'));
    
    let completed = 0;
    let failed = 0;
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Führe jedes Statement aus
    statements.forEach((statement, index) => {
        // Skip Kommentare und leere Zeilen
        if (statement.startsWith('--') || statement.trim() === ';') {
            return;
        }
        
        // Zeige Fortschritt für wichtige Statements
        if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE[IF NOT EXISTS ]* (\w+)/i)?.[1];
            console.log(`  📋 Creating table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
            const tableName = statement.match(/ALTER TABLE (\w+)/i)?.[1];
            console.log(`  🔧 Altering table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
            const indexName = statement.match(/CREATE INDEX[IF NOT EXISTS ]* (\w+)/i)?.[1];
            console.log(`  🔍 Creating index: ${indexName}`);
        } else if (statement.includes('CREATE VIEW')) {
            const viewName = statement.match(/CREATE VIEW[IF NOT EXISTS ]* (\w+)/i)?.[1];
            console.log(`  👁️ Creating view: ${viewName}`);
        } else if (statement.includes('CREATE TRIGGER')) {
            const triggerName = statement.match(/CREATE TRIGGER[IF NOT EXISTS ]* (\w+)/i)?.[1];
            console.log(`  ⚡ Creating trigger: ${triggerName}`);
        }
        
        db.run(statement, (err) => {
            if (err) {
                console.error(`  ❌ Statement ${index + 1} failed:`, err.message);
                console.error(`     Statement: ${statement.substring(0, 100)}...`);
                failed++;
            } else {
                completed++;
            }
            
            // Wenn alle Statements verarbeitet wurden
            if (completed + failed === statements.length) {
                console.log('\n📊 Migration Summary:');
                console.log(`  ✅ Successful statements: ${completed}`);
                console.log(`  ❌ Failed statements: ${failed}`);
                
                // Validierung: Prüfe ob Tabellen erstellt wurden
                db.all(`
                    SELECT name FROM sqlite_master 
                    WHERE type='table' 
                    AND name IN ('teilprojekt_zuweisungen', 'massnahmen', 'rapport_audit_trail')
                `, (err, tables) => {
                    if (err) {
                        console.error('❌ Validation failed:', err);
                    } else {
                        console.log('\n✅ Validation Results:');
                        console.log(`  Tables created: ${tables.length}/3`);
                        tables.forEach(t => console.log(`    - ${t.name}`));
                        
                        if (tables.length === 3) {
                            console.log('\n🎉 Migration 010 completed successfully!');
                        } else {
                            console.log('\n⚠️ Migration partially successful. Some tables may be missing.');
                        }
                    }
                    
                    // Schließe Datenbank
                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database:', err);
                        }
                        console.log('📁 Database connection closed');
                        process.exit(failed > 0 ? 1 : 0);
                    });
                });
            }
        });
    });
});

// Error handling
db.on('error', (err) => {
    console.error('Database error:', err);
});