// DATABASE SAFETY CHECK - Verhindert versehentliche SQLite-Nutzung
const fs = require('fs');
const path = require('path');

// KRITISCH: Diese Funktion stellt sicher, dass wir IMMER wissen, welche DB wir nutzen
function validateDatabaseConnection() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DATABASE CONNECTION SAFETY CHECK');
    console.log('='.repeat(60));
    
    // 1. Check welche Datenbank konfiguriert ist
    const USE_SQLITE = process.env.USE_SQLITE === 'true';
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // 2. PostgreSQL Credentials parsen (falls vorhanden)
    let dbInfo = {
        type: 'UNKNOWN',
        host: 'UNKNOWN',
        configured: false
    };
    
    if (USE_SQLITE) {
        dbInfo.type = 'SQLite';
        dbInfo.host = 'Local File (database.sqlite)';
        dbInfo.configured = true;
        
        // Prüfe ob SQLite-Datei existiert
        const sqlitePath = path.join(__dirname, '../../../database.sqlite');
        if (fs.existsSync(sqlitePath)) {
            const stats = fs.statSync(sqlitePath);
            dbInfo.fileSize = `${(stats.size / 1024).toFixed(2)} KB`;
            dbInfo.lastModified = stats.mtime.toISOString();
        }
    } else if (DATABASE_URL) {
        dbInfo.configured = true;
        
        // Parse PostgreSQL URL
        if (DATABASE_URL.includes('postgresql://') || DATABASE_URL.includes('postgres://')) {
            dbInfo.type = 'PostgreSQL';
            
            // Extract host from URL (safely)
            const urlMatch = DATABASE_URL.match(/@([^:\/]+)/);
            if (urlMatch) {
                dbInfo.host = urlMatch[1];
                
                // Check if it's Elestio
                if (dbInfo.host.includes('elestio')) {
                    dbInfo.environment = 'PRODUCTION (Elestio)';
                } else if (dbInfo.host === 'localhost' || dbInfo.host === '127.0.0.1') {
                    dbInfo.environment = 'LOCAL PostgreSQL';
                } else {
                    dbInfo.environment = 'EXTERNAL PostgreSQL';
                }
            }
        }
    }
    
    // 3. Status ausgeben
    console.log('\n📊 AKTUELLE KONFIGURATION:');
    console.log(`   Datenbank-Typ: ${dbInfo.type}`);
    console.log(`   Host/Location: ${dbInfo.host}`);
    
    if (dbInfo.environment) {
        console.log(`   Environment: ${dbInfo.environment}`);
    }
    
    if (dbInfo.fileSize) {
        console.log(`   SQLite Größe: ${dbInfo.fileSize}`);
        console.log(`   Letzte Änderung: ${dbInfo.lastModified}`);
    }
    
    // 4. WARNUNGEN
    console.log('\n⚠️  SICHERHEITS-CHECKS:');
    
    const warnings = [];
    const errors = [];
    
    // Check 1: Keine DB konfiguriert
    if (!dbInfo.configured) {
        errors.push('KEINE DATENBANK KONFIGURIERT! App wird abstürzen!');
    }
    
    // Check 2: SQLite in Produktion
    if (USE_SQLITE && process.env.NODE_ENV === 'production') {
        errors.push('SQLite in PRODUKTION! Das ist NICHT sicher für Multi-User!');
    }
    
    // Check 3: Lokale DB aber Produktions-Modus
    if (dbInfo.environment === 'LOCAL PostgreSQL' && process.env.NODE_ENV === 'production') {
        warnings.push('Lokale PostgreSQL in Produktions-Modus');
    }
    
    // Check 4: Elestio DB aber Development-Modus
    if (dbInfo.environment === 'PRODUCTION (Elestio)' && process.env.NODE_ENV === 'development') {
        warnings.push('ACHTUNG: Entwicklung gegen PRODUKTIONS-DATENBANK!');
    }
    
    // Check 5: DATABASE_URL aber USE_SQLITE=true
    if (USE_SQLITE && DATABASE_URL) {
        warnings.push('PostgreSQL URL vorhanden, aber SQLite ist aktiviert!');
    }
    
    // Ausgabe der Warnungen
    if (errors.length > 0) {
        console.log('\n🔴 KRITISCHE FEHLER:');
        errors.forEach(err => console.log(`   ❌ ${err}`));
    }
    
    if (warnings.length > 0) {
        console.log('\n🟡 WARNUNGEN:');
        warnings.forEach(warn => console.log(`   ⚠️ ${warn}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        console.log('   ✅ Alle Checks bestanden');
    }
    
    // 5. EMPFEHLUNGEN
    console.log('\n💡 EMPFEHLUNGEN:');
    
    if (USE_SQLITE) {
        console.log('   → Für Produktion: USE_SQLITE=false setzen');
        console.log('   → PostgreSQL URL konfigurieren');
    }
    
    if (!DATABASE_URL && !USE_SQLITE) {
        console.log('   → DATABASE_URL in .env setzen');
        console.log('   → Oder USE_SQLITE=true für lokale Entwicklung');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 6. Return für programmatische Nutzung
    return {
        isConfigured: dbInfo.configured,
        type: dbInfo.type,
        isSafe: errors.length === 0,
        errors,
        warnings,
        info: dbInfo
    };
}

// Funktion um sicherzustellen, dass .env.example aktuell ist
function updateEnvExample() {
    const envExamplePath = path.join(__dirname, '../../../.env.example');
    const requiredVars = `# SBV Professional V2 - Environment Variables
# KRITISCH: Diese Datei zeigt ALLE benötigten Variablen!

# ============================================
# DATENBANK KONFIGURATION (WICHTIGSTE EINSTELLUNG!)
# ============================================

# Option 1: PostgreSQL (PRODUKTION)
# Für Produktion IMMER PostgreSQL verwenden!
USE_SQLITE=false
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Beispiel für Elestio PostgreSQL:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@postgresql-sbv-fg-app-u38422.vm.elestio.app:25432/postgres?sslmode=require

# Option 2: SQLite (NUR ENTWICKLUNG!)
# USE_SQLITE=true
# DATABASE_URL=sqlite://./database.sqlite

# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
HOST=localhost

# ============================================
# SICHERHEIT (KRITISCH!)
# ============================================
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
JWT_EXPIRES_IN=8h
SESSION_SECRET=your-session-secret-also-32-chars-minimum

# ============================================
# ADMIN CONFIGURATION
# ============================================
ADMIN_EMAIL=admin@sbv.ch
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_THIS_IN_PRODUCTION!

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_REGISTRATION=false
ENABLE_PASSWORD_RESET=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_API_DOCS=true

# ============================================
# WEITERE EINSTELLUNGEN
# ============================================
BCRYPT_ROUNDS=12
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION_MINUTES=15
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,png,jpg,jpeg
LOG_LEVEL=info
`;

    fs.writeFileSync(envExamplePath, requiredVars);
    console.log('✅ .env.example wurde aktualisiert mit allen kritischen Variablen');
}

module.exports = {
    validateDatabaseConnection,
    updateEnvExample
};