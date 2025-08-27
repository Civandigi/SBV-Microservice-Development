# 🚨 PostgreSQL Produktions-Datenbank CHAOS-ANALYSE

> Backup vom: 2025-08-06 07:23:45
> Datenbank-Version: PostgreSQL 16.9

## 🔴 KRITISCHE PROBLEME GEFUNDEN

### 1. VIER verschiedene User-Tabellen!

```
1. public.users          - Die "richtige" Tabelle (wie in SQLite)
2. public.sbv_users      - Komplett andere Struktur mit UUID
3. public.sbv_benutzer   - DOPPELTE SPALTEN (role + rolle)!
4. public.sbv_benutzer_backup - Backup der chaotischen Tabelle
```

### 2. Doppelte Spalten in sbv_benutzer

Die Tabelle `sbv_benutzer` hat DOPPELTE Spalten für dasselbe:
- `role` UND `rolle` (beide für Benutzerrolle)
- `created_at` UND `erstellt_am` (beide für Erstelldatum)
- `updated_at` UND `aktualisiert_am` (beide für Update-Datum)
- `last_login` UND `letzter_login` (beide für letzten Login)

### 3. Duplizierte Funktionalitäten

Mehrere Tabellen für denselben Zweck:
- **Rapporte:** `rapporte`, `sbv_berichte`, `sbv_reports`, `reports`
- **Dokumente:** `documents`, `sbv_dokumente`, `standalone_documents`
- **Zuweisungen:** `assignments`, `sbv_assignments`, `sbv_zuweisungen`
- **Teilprojekte:** `teilprojekte`, `sbv_teilprojekte`, `subprojects`
- **Gesuche:** `gesuche`, `sbv_gesuche`

## 📊 KOMPLETTE TABELLEN-LISTE (30+ Tabellen!)

### User/Auth-bezogen:
- users ✅ (sollte die Haupttabelle sein)
- sbv_users ❌ (Duplikat)
- sbv_benutzer ❌ (Duplikat mit doppelten Spalten)
- sbv_benutzer_backup ❌ (Backup)
- sbv_permissions
- sbv_role_permissions

### Rapport-bezogen:
- rapporte ✅
- reports ❌ (Duplikat)
- sbv_reports ❌ (Duplikat)
- sbv_berichte ❌ (Duplikat)
- rapport_templates
- rapport_attachments
- rapport_kpis
- rapport_massnahmen

### Dokument-bezogen:
- documents ✅
- sbv_dokumente ❌ (Duplikat)
- standalone_documents ❌ (Duplikat)

### Projekt-bezogen:
- gesuche ✅
- sbv_gesuche ❌ (Duplikat)
- teilprojekte ✅
- sbv_teilprojekte ❌ (Duplikat)
- subprojects ❌ (Duplikat)

### Andere:
- activities
- activity_logs
- applications
- assignments / sbv_assignments / sbv_zuweisungen
- comments
- migration_log
- notifications

## 🔍 DATEN-STATUS

**ALLE User-Tabellen sind LEER!** (0 Einträge in allen User-Tabellen)
- Keine COPY/INSERT Statements für User-Daten gefunden
- Das Backup enthält nur die Struktur, keine Daten

## ⚠️ WARUM IST DAS PASSIERT?

Vermutliche Ursachen:
1. **Mehrere Entwickler** haben parallel gearbeitet
2. **Keine klare Namenskonvention** (sbv_ Prefix inkonsistent)
3. **Mehrere Migrationsversuche** ohne Cleanup
4. **Deutsche + Englische Spalten** gemischt
5. **Keine Datenbank-Governance**

## 🎯 EMPFOHLENE LÖSUNG

### Phase 1: Analyse (JETZT)
1. ✅ Struktur-Chaos dokumentiert (diese Datei)
2. ⬜ Prüfen welche Tabellen die LIVE-App tatsächlich nutzt
3. ⬜ Backup der aktuellen Produktion mit DATEN

### Phase 2: Bereinigungsplan
1. ⬜ Definieren der EINEN korrekten Struktur
2. ⬜ Migrations-Script erstellen
3. ⬜ Test-Migration auf Staging

### Phase 3: Migration
1. ⬜ Wartungsfenster planen
2. ⬜ Daten-Migration durchführen
3. ⬜ Alte Tabellen löschen

## 🚨 SOFORT-MASSNAHMEN

1. **STOPP:** Keine neuen Features bis DB bereinigt ist
2. **BACKUP:** Vollständiges Backup MIT DATEN erstellen
3. **ANALYSE:** Welche Tabellen nutzt die Live-App wirklich?
4. **ENTSCHEIDUNG:** Welche Struktur soll bleiben?

## 📝 NÄCHSTE SCHRITTE

1. Live-App Code prüfen: Welche Tabellen werden verwendet?
2. Datenbank mit Daten sichern (nicht nur Struktur)
3. Entscheiden: Clean Migration oder Schritt-für-Schritt?
4. Test-Umgebung aufsetzen für sichere Migration

---

**STATUS:** 🔴 KRITISCH - Produktion läuft mit chaotischer DB-Struktur