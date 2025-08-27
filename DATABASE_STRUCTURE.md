# 📊 Datenbankstruktur - SBV Professional App

## 📍 Datenbankstandort
- **Hauptdatenbank:** `./database.sqlite` (Root-Verzeichnis)
- **Typ:** SQLite für Entwicklung, PostgreSQL für Produktion

## 📋 Tabellenübersicht

### 1️⃣ **users** - Benutzerverwaltung
```sql
- id (PRIMARY KEY)
- email (UNIQUE, NOT NULL)
- name (NOT NULL)
- first_name
- last_name
- password_hash (NOT NULL)
- role (DEFAULT 'user') - Optionen: 'user', 'admin', 'super_admin'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- is_active (BOOLEAN DEFAULT true)
- last_login (TIMESTAMP)
- login_attempts (INTEGER DEFAULT 0)
- locked_until (TIMESTAMP)
```

### 2️⃣ **rapporte** - Haupttabelle für Berichte
```sql
- id (PRIMARY KEY)
- title (VARCHAR 500, NOT NULL)
- content (TEXT)
- status (DEFAULT 'entwurf') 
  - Optionen: 'entwurf', 'eingereicht', 'in_bearbeitung', 'fertig', 'genehmigt', 'abgelehnt'
- priority (DEFAULT 'normal')
  - Optionen: 'niedrig', 'normal', 'hoch', 'kritisch'
- category (VARCHAR 100)
- author_id (FOREIGN KEY → users.id)
- assigned_to (FOREIGN KEY → users.id)
- approved_by (FOREIGN KEY → users.id)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- submitted_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- rejection_reason (TEXT)
```

### 3️⃣ **documents** - Dateianhänge
```sql
- id (PRIMARY KEY)
- rapport_id (FOREIGN KEY → rapporte.id)
- filename (VARCHAR 255, NOT NULL)
- original_name (VARCHAR 255, NOT NULL)
- file_size (INTEGER)
- mime_type (VARCHAR 100)
- file_data (BYTEA/BLOB, NOT NULL) - Datei wird in DB gespeichert
- uploaded_by (FOREIGN KEY → users.id)
- created_at (TIMESTAMP)
```

### 4️⃣ **comments** - Kommentare zu Rapporten
```sql
- id (PRIMARY KEY)
- rapport_id (FOREIGN KEY → rapporte.id)
- user_id (FOREIGN KEY → users.id)
- content (TEXT, NOT NULL)
- created_at (TIMESTAMP)
```

### 5️⃣ **activity_logs** - Aktivitätsprotokoll (für Super Admin)
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- action (VARCHAR 100, NOT NULL)
- resource_type (VARCHAR 50)
- resource_id (INTEGER)
- details (JSONB/TEXT)
- ip_address (INET/VARCHAR)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

## 🔍 Indizes für Performance

- `idx_users_email` - Schnelle E-Mail-Suche
- `idx_users_role` - Rollenbasierte Abfragen
- `idx_rapporte_status` - Status-Filterung
- `idx_rapporte_author_id` - Benutzer-Rapporte
- `idx_rapporte_assigned_to` - Zugewiesene Rapporte
- `idx_documents_rapport_id` - Dokumente pro Rapport
- `idx_comments_rapport_id` - Kommentare pro Rapport
- `idx_activity_logs_user_id` - Benutzeraktivitäten
- `idx_activity_logs_created_at` - Zeitbasierte Abfragen

## 📁 Datenbankdefinition-Dateien

### Hauptkonfiguration
- `backend/src/config/database.js` - PostgreSQL Konfiguration
- `backend/src/config/database-sqlite.js` - SQLite Konfiguration

### Migrations
- `backend/migrations/005_webhook_logs.sql` - Webhook-Logging
- `backend/migrations/007_create_standalone_documents.sql` - Standalone Dokumente
- `backend/migrations/008_add_deadline_feature.sql` - Deadline-Feature
- `backend/migrations/009_add_gesuch_tables.sql` - Gesuch-Tabellen

## 🔄 Beziehungen

```
users
  ├── rapporte (author_id, assigned_to, approved_by)
  ├── documents (uploaded_by)
  ├── comments (user_id)
  └── activity_logs (user_id)

rapporte
  ├── documents (rapport_id)
  └── comments (rapport_id)
```

## 💡 Wichtige Hinweise

1. **Dateispeicherung**: Dokumente werden direkt in der Datenbank gespeichert (file_data als BLOB/BYTEA)
2. **Rollen**: Drei-Stufen-System (user, admin, super_admin)
3. **Status-Workflow**: 6 verschiedene Status für Rapporte
4. **Prioritäten**: 4 Prioritätsstufen (niedrig bis kritisch)
5. **Sicherheit**: Login-Attempts und Lock-Until für Brute-Force-Schutz

## 🛠️ Datenbankzugriff

### Entwicklung (SQLite)
```javascript
// Aktivieren über .env
USE_SQLITE=true
NODE_ENV=development
```

### Produktion (PostgreSQL)
```javascript
// Konfiguriert über DATABASE_URL
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

---
*Generiert am: 2025-08-26*