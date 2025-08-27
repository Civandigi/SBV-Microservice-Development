# 📋 UMSETZUNGSPLAN SBV Professional V2

> Stand: 30.07.2025  
> Priorität: Marketing-Projekte Schweizer Bauernverband

## 🚨 PHASE 1: KRITISCHE FIXES (Sofort - Diese Woche)

### 1.1 Rapport-Frontend Reparatur
- [ ] loadRapporte() Funktion in rapport.html implementieren
- [ ] displayRapporte() mit echten Daten verbinden
- [ ] updateKPIDashboard() API-Anbindung
- [ ] Demo-Daten entfernen (teilprojektTemplates)
- [ ] Error-Handling für API-Calls
- [ ] Loading-States implementieren

### 1.2 Environment & Security
- [ ] .env.example erstellen mit allen Variablen
- [ ] JWT_SECRET generieren und dokumentieren
- [ ] Datenbank-Credentials sichern
- [ ] CORS-Konfiguration prüfen
- [ ] File-Upload Validierung hinzufügen

### 1.3 Gesuch-Teilprojekt Flexibilität
- [ ] Migration 004: Trigger für Auto-Teilprojekte entfernen
- [ ] API: POST /api/gesuche/:id/teilprojekte
- [ ] API: PUT /api/gesuche/teilprojekt/:id
- [ ] API: DELETE /api/gesuche/teilprojekt/:id
- [ ] Frontend: Teilprojekt hinzufügen Button
- [ ] Frontend: Teilprojekt bearbeiten/löschen

## 📈 PHASE 2: KERNFUNKTIONEN (Woche 2-3)

### 2.1 Rapport-Gesuch Verknüpfung
- [ ] Rapport-Formular: Teilprojekt-Dropdown
- [ ] Teilprojekte vom Backend laden
- [ ] Rapport mit teilprojekt_id speichern
- [ ] Rapport-Übersicht: Gesuch/Teilprojekt anzeigen
- [ ] Filter nach Gesuch/Teilprojekt

### 2.2 Gesuch-Verwaltung Frontend
- [ ] gesuch-verwaltung.html API-Integration
- [ ] Gesuch-Liste dynamisch laden
- [ ] Detail-Ansicht funktionsfähig
- [ ] Teilprojekt-Status Updates
- [ ] Fortschrittsbalken live updaten
- [ ] K-Ziele Editor implementieren
- [ ] Jahresvergleich Editor

### 2.3 Erste Tests
- [ ] Jest Setup verifizieren
- [ ] API-Tests für Gesuch-Endpoints
- [ ] API-Tests für Rapport-Endpoints
- [ ] Frontend Unit-Tests Setup
- [ ] Integration Tests für Workflows

## 🔗 PHASE 3: INTEGRATION (Woche 4-5)

### 3.1 Webhook & Export
- [ ] Webhook-Service implementieren
- [ ] n8n Endpoint konfigurieren
- [ ] JSON-Payload Format definieren
- [ ] Export-Button Funktionalität
- [ ] Export-Log in DB speichern
- [ ] Fehlerbehandlung für Webhook

### 3.2 Erweiterte Features
- [ ] Massnahmen-Verwaltung pro Teilprojekt
- [ ] Budget-Tracking implementieren
- [ ] Automatische Berechnungen
- [ ] Validierungsregeln
- [ ] Batch-Operationen

### 3.3 UI/UX Verbesserungen
- [ ] Loading-Animationen überall
- [ ] Bestätigungsdialoge
- [ ] Toast-Notifications
- [ ] Keyboard-Shortcuts
- [ ] Mobile-Optimierung

## 🚀 PHASE 4: PRODUCTION-READY (Woche 6-8)

### 4.1 Qualitätssicherung
- [ ] Code-Review aller Module
- [ ] Test-Coverage auf 80%+
- [ ] E2E Tests mit Playwright
- [ ] Performance-Tests
- [ ] Security-Audit

### 4.2 Deployment
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Staging-Environment
- [ ] Backup-Strategie
- [ ] Monitoring einrichten
- [ ] Dokumentation vervollständigen

### 4.3 Dokumentation
- [ ] API-Dokumentation (Swagger)
- [ ] Benutzerhandbuch
- [ ] Admin-Handbuch
- [ ] Entwickler-Dokumentation
- [ ] Video-Tutorials

## 📊 TRACKING & METRIKEN

### Wöchentliche Ziele:
- **Woche 1:** Rapport funktionsfähig + Flexibilität
- **Woche 2-3:** Gesuch-System komplett
- **Woche 4-5:** Integration & Export
- **Woche 6-8:** Testing & Deployment

### Erfolgs-Kriterien:
- [ ] Alle Rapporte zeigen echte Daten
- [ ] Gesuch-Workflow funktioniert End-to-End
- [ ] Export generiert korrektes Google Doc
- [ ] 80%+ Test-Coverage
- [ ] Keine kritischen Security-Issues

## 🛠️ TECHNISCHE DETAILS

### Priorität 1: Rapport-API Integration
```javascript
// rapport.html - Zeile ~1782
async function loadRapporte() {
    const response = await fetch(`${API_BASE_URL}/api/rapporte`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    displayRapporte(data.rapporte); // MIT ECHTEN DATEN!
}
```

### Priorität 2: Flexible Teilprojekte
```sql
-- Migration 004
DROP TRIGGER create_teilprojekte_after_gesuch;
-- Admin erstellt Teilprojekte manuell
```

### Priorität 3: Webhook Integration
```javascript
// Bei Gesuch-Submit
const webhookPayload = {
    gesuch: gesuchData,
    teilprojekte: teilprojekteMitRapporten,
    exportFormat: 'google-docs'
};
await callWebhook(webhookPayload);
```

## ✅ DEFINITION OF DONE

Jede Aufgabe gilt als erledigt wenn:
1. Code implementiert und getestet
2. Keine Console-Errors
3. UI reagiert korrekt
4. Tests geschrieben und grün
5. Code-Review durchgeführt
6. Dokumentation aktualisiert

---

**Start:** 30.07.2025  
**Ziel MVP:** 20.08.2025  
**Production:** 30.09.2025