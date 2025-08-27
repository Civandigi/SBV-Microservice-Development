#!/usr/bin/env node

// KRITISCHES SCRIPT: Stellt sicher, dass Datenbank-Verbindung IMMER funktioniert
// Verhindert versehentliches Erstellen neuer SQLite-Datenbanken

const fs = require('fs');
const path = require('path');
const { validateDatabaseConnection, updateEnvExample } = require('../config/database-safety');

console.log('🔐 DATABASE CONNECTION INSURANCE SCRIPT');
console.log('='.repeat(60));

// 1. Check ob .env existiert
const envPath = path.join(__dirname, '../../../.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
    console.error('\n❌ KRITISCH: .env Datei fehlt!');
    console.log('\n📝 Erstelle .env aus Template...\n');
    
    // Kopiere .env.example zu .env
    const envExamplePath = path.join(__dirname, '../../../.env.example');
    
    if (fs.existsSync(envExamplePath)) {
        const content = fs.readFileSync(envExamplePath, 'utf8');
        fs.writeFileSync(envPath, content);
        console.log('✅ .env erstellt aus .env.example');
        console.log('\n⚠️  WICHTIG: Bitte DATABASE_URL konfigurieren!');
    } else {
        console.error('❌ .env.example fehlt auch!');
        
        // Notfall: Erstelle minimale .env
        const emergencyEnv = `# NOTFALL .env - BITTE KONFIGURIEREN!

# Option 1: PostgreSQL (PRODUKTION)
USE_SQLITE=false
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Option 2: SQLite (NUR ENTWICKLUNG)
# USE_SQLITE=true

NODE_ENV=development
JWT_SECRET=CHANGE_THIS_SECRET_${Date.now()}
`;
        fs.writeFileSync(envPath, emergencyEnv);
        console.log('⚠️  Notfall .env erstellt - MUSS konfiguriert werden!');
    }
}

// 2. Lade Environment-Variablen
require('dotenv').config();

// 3. Validiere Datenbank-Verbindung
const dbCheck = validateDatabaseConnection();

// 4. Entscheidungslogik
if (!dbCheck.isSafe) {
    console.log('\n🚨 DATENBANK-KONFIGURATION UNSICHER!\n');
    
    if (dbCheck.errors.includes('KEINE DATENBANK KONFIGURIERT! App wird abstürzen!')) {
        console.log('📋 LÖSUNG: Eine der folgenden Optionen wählen:\n');
        
        console.log('Option 1: PostgreSQL (Elestio) verwenden:');
        console.log('=========================================');
        console.log('USE_SQLITE=false');
        console.log('DATABASE_URL=postgresql://postgres:RvFb9djO-BpZC-JpFFB2su@postgresql-sbv-fg-app-u38422.vm.elestio.app:25432/postgres?sslmode=require\n');
        
        console.log('Option 2: SQLite (Lokal) verwenden:');
        console.log('====================================');
        console.log('USE_SQLITE=true');
        console.log('# DATABASE_URL kann leer bleiben\n');
        
        // Auto-Fix Angebot
        console.log('🔧 AUTO-FIX verfügbar!\n');
        console.log('Führen Sie eines der folgenden Kommandos aus:');
        console.log('  npm run fix:postgres  - Für PostgreSQL-Verbindung');
        console.log('  npm run fix:sqlite    - Für SQLite (nur Entwicklung)');
    }
    
    process.exit(1);
} else {
    console.log('\n✅ Datenbank-Konfiguration ist SICHER!');
    console.log(`   Typ: ${dbCheck.info.type}`);
    console.log(`   Environment: ${dbCheck.info.environment || 'N/A'}`);
    
    if (dbCheck.warnings.length > 0) {
        console.log('\n⚠️  Warnungen:');
        dbCheck.warnings.forEach(w => console.log(`   - ${w}`));
    }
}

// 5. Update .env.example für Team
updateEnvExample();

console.log('\n' + '='.repeat(60));
console.log('✅ Database Insurance Check abgeschlossen');