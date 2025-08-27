# Gesuch-System Implementierungsstatus

> Stand: 2025-07-29
> Version: 1.0

## ✅ Abgeschlossene Implementierungen

### Phase 1: Datenbank-Schema ✓
- **Migration 002_create_gesuch_system.sql erstellt**
  - Tabelle `gesuche` für Hauptanträge
  - Tabelle `teilprojekte` für die 6 Unterprojekte
  - Tabelle `massnahmen` für Maßnahmen pro Teilprojekt
  - Tabelle `k_ziele` für Leistungsindikatoren
  - Tabelle `jahresvergleich` für Jahresvergleichsdaten
  - Tabelle `gesuch_export_log` für Webhook-Protokoll
  - Automatische Trigger für Teilprojekt-Erstellung
  - Views und Funktionen für Gesuch-Übersicht

- **Migration 003_seed_gesuch_data.sql erstellt**
  - Beispieldaten für Tests
  - Gesuch für 2024 mit allen Teilprojekten

### Phase 2: Backend API ✓
- **gesuch.routes.js implementiert**
  - GET /api/gesuche - Alle Gesuche abrufen (Admin only)
  - GET /api/gesuche/:id - Einzelnes Gesuch mit Details
  - POST /api/gesuche - Neues Gesuch erstellen
  - PUT /api/gesuche/:id - Gesuch aktualisieren
  - POST /api/gesuche/:id/submit - Gesuch einreichen
  - GET /api/gesuche/teilprojekt/:id - Teilprojekt-Details
  - PUT /api/gesuche/teilprojekt/:id/status - Teilprojekt-Status ändern
  - POST /api/gesuche/:id/k-ziele - K-Ziele aktualisieren
  - POST /api/gesuche/:id/jahresvergleich - Jahresvergleich aktualisieren

- **rapport.routes.js erweitert**
  - Teilprojekt-Verknüpfung für Rapporte hinzugefügt
  - Massnahmen-Verknüpfung für Rapporte hinzugefügt

### Phase 3: Frontend Gesuch-Verwaltung ✓
- **gesuch-verwaltung.html erstellt**
  - Übersicht aller Gesuche mit Status
  - Fortschrittsanzeige für Teilprojekte
  - Detail-Ansicht mit allen Teilprojekten
  - K-Ziele und Jahresvergleich Anzeige
  - Gesuch erstellen Funktionalität
  - Gesuch einreichen wenn alle Teilprojekte genehmigt
  - Teilprojekt-Genehmigung durch Admin

- **Navigation aktualisiert**
  - Gesuch-Verwaltung Link für Admin und Super Admin
  - Korrekte Berechtigungsprüfung

## 🚧 Noch zu implementieren

### Phase 4: Frontend - Rapport zu Gesuch zuordnen
- Dropdown in Rapport-Erstellung für Teilprojekt-Auswahl
- Anzeige der Gesuch-Zuordnung in Rapport-Übersicht
- Filter nach Gesuch/Teilprojekt

### Phase 5: Webhook-Integration
- n8n Webhook Endpoint implementieren
- JSON-Payload für Google Docs generieren
- Export-Log und Status-Tracking

### Phase 6: Zusatzfelder
- Weitere K-Ziele Typen
- Erweiterte Jahresvergleiche
- Benutzerdefinierte Felder

## 🔧 Setup-Anleitung

### 1. Datenbank einrichten
```bash
# Datenbank erstellen und Migrationen ausführen
npm run setup

# Oder nur Migrationen ausführen
npm run migrate
```

### 2. Server starten
```bash
npm run dev
```

### 3. Als Admin anmelden
- Email: admin@sbv-professional.ch
- Passwort: Admin123!

### 4. Gesuch-Verwaltung aufrufen
- Navigation → "Gesuch-Verwaltung"
- Nur für Admin und Super Admin sichtbar

## 📋 Nächste Schritte

1. **Rapport-Zuordnung implementieren**
   - Teilprojekt-Dropdown in Rapport-Formular
   - Gesuch-Filter in Rapport-Übersicht

2. **Webhook testen**
   - n8n Workflow anpassen
   - Test-Export durchführen

3. **UI-Verbesserungen**
   - Loading-States
   - Bessere Fehlerbehandlung
   - Bestätigungsdialoge

## 🐛 Bekannte Probleme

- Keine automatische Aktualisierung bei Status-Änderungen
- Fehlende Validierung für Jahr-Duplikate im Frontend
- Keine Pagination für große Datenmengen

## 📝 Testdaten

Nach dem Setup sind folgende Testdaten verfügbar:
- 1 Gesuch für 2024 mit 6 Teilprojekten
- Beispiel K-Ziele und Jahresvergleiche
- 2 Teilprojekte "in Bearbeitung"