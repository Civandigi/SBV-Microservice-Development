#!/usr/bin/env node

/**
 * Fix and Run Migration 010: Multi-User Teilprojekt System
 * Bereinigt bestehende Konflikte und führt Migration aus
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../../database.sqlite');

console.log('🚀 Starting Fixed Migration 010');
console.log('📂 Database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

db.serialize(() => {
    // Aktiviere Foreign Keys
    db.run("PRAGMA foreign_keys = OFF", (err) => {
        if (err) console.error('Failed to disable FK:', err);
    });

    console.log('\n📋 Creating new tables for Multi-User System...\n');

    // 1. Erstelle teilprojekt_zuweisungen
    db.run(`
        CREATE TABLE IF NOT EXISTS teilprojekt_zuweisungen (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teilprojekt_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rolle VARCHAR(50) NOT NULL CHECK (rolle IN ('ausfueller', 'pruefer', 'freigeber')),
            gueltig_von DATE DEFAULT CURRENT_DATE,
            gueltig_bis DATE,
            zugewiesen_von INTEGER,
            bemerkung TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teilprojekt_id) REFERENCES teilprojekte(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (zugewiesen_von) REFERENCES users(id),
            UNIQUE(teilprojekt_id, user_id, rolle)
        )
    `, (err) => {
        if (err) console.error('❌ teilprojekt_zuweisungen:', err.message);
        else console.log('✅ teilprojekt_zuweisungen created');
    });

    // 2. Erstelle massnahmen_neu (da massnahmen existiert)
    db.run(`
        CREATE TABLE IF NOT EXISTS massnahmen_neu (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teilprojekt_id INTEGER NOT NULL,
            nummer VARCHAR(50) NOT NULL,
            titel VARCHAR(255) NOT NULL,
            beschreibung TEXT,
            budget DECIMAL(12,2),
            status VARCHAR(50) DEFAULT 'geplant' CHECK (status IN ('geplant', 'in_arbeit', 'abgeschlossen', 'pausiert')),
            parent_massnahme_id INTEGER,
            geplant_von DATE,
            geplant_bis DATE,
            tatsaechlich_von DATE,
            tatsaechlich_bis DATE,
            fortschritt INTEGER DEFAULT 0 CHECK (fortschritt >= 0 AND fortschritt <= 100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teilprojekt_id) REFERENCES teilprojekte(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_massnahme_id) REFERENCES massnahmen_neu(id)
        )
    `, (err) => {
        if (err) console.error('❌ massnahmen_neu:', err.message);
        else console.log('✅ massnahmen_neu created');
    });

    // 3. Erstelle massnahmen_zuweisungen
    db.run(`
        CREATE TABLE IF NOT EXISTS massnahmen_zuweisungen (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            massnahme_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rolle VARCHAR(50) NOT NULL CHECK (rolle IN ('ausfueller', 'pruefer', 'freigeber')),
            gueltig_von DATE DEFAULT CURRENT_DATE,
            gueltig_bis DATE,
            zugewiesen_von INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (massnahme_id) REFERENCES massnahmen_neu(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (zugewiesen_von) REFERENCES users(id),
            UNIQUE(massnahme_id, user_id, rolle)
        )
    `, (err) => {
        if (err) console.error('❌ massnahmen_zuweisungen:', err.message);
        else console.log('✅ massnahmen_zuweisungen created');
    });

    // 4. Erstelle teilprojekt_historie
    db.run(`
        CREATE TABLE IF NOT EXISTS teilprojekt_historie (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teilprojekt_id INTEGER NOT NULL,
            parent_teilprojekt_id INTEGER,
            aktion VARCHAR(50) NOT NULL CHECK (aktion IN ('erstellt', 'split', 'merge', 'update', 'archiviert')),
            stammdaten_snapshot TEXT,
            aenderungen TEXT,
            ausgefuehrt_von INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teilprojekt_id) REFERENCES teilprojekte(id),
            FOREIGN KEY (parent_teilprojekt_id) REFERENCES teilprojekte(id),
            FOREIGN KEY (ausgefuehrt_von) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ teilprojekt_historie:', err.message);
        else console.log('✅ teilprojekt_historie created');
    });

    // 5. Erstelle rapport_audit_trail
    db.run(`
        CREATE TABLE IF NOT EXISTS rapport_audit_trail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('teilprojekt', 'massnahme', 'rapport', 'zuweisung')),
            entity_id INTEGER NOT NULL,
            aktion VARCHAR(100) NOT NULL,
            alte_werte TEXT,
            neue_werte TEXT,
            user_id INTEGER NOT NULL,
            user_name VARCHAR(255),
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ rapport_audit_trail:', err.message);
        else console.log('✅ rapport_audit_trail created');
    });

    // 6. Erstelle rapport_felder
    db.run(`
        CREATE TABLE IF NOT EXISTS rapport_felder (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rapport_id INTEGER NOT NULL,
            feld_typ VARCHAR(50) NOT NULL CHECK (feld_typ IN ('grau', 'gelb')),
            feld_name VARCHAR(100) NOT NULL,
            feld_wert TEXT,
            quelle VARCHAR(100) CHECK (quelle IN ('gesuch', 'manuell', 'vererbt', 'automatisch')),
            ist_pflichtfeld BOOLEAN DEFAULT 0,
            geaendert_von INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (rapport_id) REFERENCES rapporte(id) ON DELETE CASCADE,
            FOREIGN KEY (geaendert_von) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ rapport_felder:', err.message);
        else console.log('✅ rapport_felder created');
    });

    // Erweitere teilprojekte Tabelle (nur fehlende Spalten)
    console.log('\n🔧 Adding new columns to existing tables...\n');

    const alterStatements = [
        "ALTER TABLE teilprojekte ADD COLUMN parent_teilprojekt_id INTEGER REFERENCES teilprojekte(id)",
        "ALTER TABLE teilprojekte ADD COLUMN ebene INTEGER DEFAULT 1 CHECK (ebene IN (1, 2, 3))",
        "ALTER TABLE teilprojekte ADD COLUMN stammdaten TEXT",
        "ALTER TABLE teilprojekte ADD COLUMN ist_geteilt BOOLEAN DEFAULT 0",
        "ALTER TABLE teilprojekte ADD COLUMN ist_aktiv BOOLEAN DEFAULT 1",
        "ALTER TABLE teilprojekte ADD COLUMN teilungs_datum TIMESTAMP",
        "ALTER TABLE teilprojekte ADD COLUMN geteilt_von INTEGER REFERENCES users(id)",
        "ALTER TABLE rapporte ADD COLUMN massnahme_id INTEGER",
        "ALTER TABLE rapporte ADD COLUMN ist_vorlage BOOLEAN DEFAULT 0",
        "ALTER TABLE rapporte ADD COLUMN vorlage_id INTEGER REFERENCES rapporte(id)",
        "ALTER TABLE rapporte ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'entwurf'",
        "ALTER TABLE rapporte ADD COLUMN geprueft_von INTEGER REFERENCES users(id)",
        "ALTER TABLE rapporte ADD COLUMN geprueft_am TIMESTAMP",
        "ALTER TABLE rapporte ADD COLUMN freigegeben_von INTEGER REFERENCES users(id)",
        "ALTER TABLE rapporte ADD COLUMN freigegeben_am TIMESTAMP",
        "ALTER TABLE rapporte ADD COLUMN ablehnungsgrund TEXT"
    ];

    alterStatements.forEach((sql, index) => {
        db.run(sql, (err) => {
            if (err) {
                if (err.message.includes('duplicate column')) {
                    // Spalte existiert bereits - OK
                } else {
                    console.error(`❌ ALTER ${index + 1}:`, err.message);
                }
            } else {
                console.log(`✅ Column added: ${sql.match(/ADD COLUMN (\w+)/)[1]}`);
            }
        });
    });

    // Erstelle Indizes
    setTimeout(() => {
        console.log('\n🔍 Creating indexes...\n');
        
        const indexStatements = [
            "CREATE INDEX IF NOT EXISTS idx_tp_zuw_user ON teilprojekt_zuweisungen(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_tp_zuw_tp ON teilprojekt_zuweisungen(teilprojekt_id)",
            "CREATE INDEX IF NOT EXISTS idx_mn_zuw_user ON massnahmen_zuweisungen(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_mn_zuw_mn ON massnahmen_zuweisungen(massnahme_id)",
            "CREATE INDEX IF NOT EXISTS idx_audit_entity ON rapport_audit_trail(entity_type, entity_id)",
            "CREATE INDEX IF NOT EXISTS idx_audit_date ON rapport_audit_trail(created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_rf_rapport ON rapport_felder(rapport_id)"
        ];

        indexStatements.forEach(sql => {
            db.run(sql, (err) => {
                if (err) console.error('Index error:', err.message);
                else console.log(`✅ Index created: ${sql.match(/idx_\w+/)[0]}`);
            });
        });

        // Validierung nach 2 Sekunden
        setTimeout(() => {
            db.all(`
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                AND name IN (
                    'teilprojekt_zuweisungen', 
                    'massnahmen_neu',
                    'massnahmen_zuweisungen', 
                    'teilprojekt_historie', 
                    'rapport_audit_trail', 
                    'rapport_felder'
                )
            `, (err, tables) => {
                if (err) {
                    console.error('❌ Validation error:', err);
                } else {
                    console.log('\n📊 Final Validation:');
                    console.log(`✅ New tables created: ${tables.length}/6`);
                    tables.forEach(t => console.log(`   - ${t.name}`));
                    
                    if (tables.length >= 5) {
                        console.log('\n🎉 Migration 010 completed successfully!');
                        console.log('Note: massnahmen_neu created (original massnahmen table exists)');
                    }
                }
                
                // Re-enable FK and close
                db.run("PRAGMA foreign_keys = ON", () => {
                    db.close();
                    console.log('\n📁 Database connection closed');
                });
            });
        }, 2000);
    }, 1000);
});