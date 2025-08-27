# 🎨 RAPPORT-FELDER FARBSYSTEM DOKUMENTATION
## Grau vs. Gelb Felder Erklärung

---

## 📋 ÜBERSICHT DES FARBSYSTEMS

Das Rapport-System verwendet **zwei Farben** zur Unterscheidung der Felder-Herkunft:

- **🔘 GRAUE FELDER**: Automatisch aus dem Gesuch übernommene Daten
- **🟡 GELBE FELDER**: Manuell auszufüllende/editierbare Felder

---

## 🔘 GRAUE FELDER (Automatisch befüllt)

### Was sind graue Felder?
**Graue Felder** sind Datenfelder, die **automatisch** aus dem hochgeladenen Gesuch extrahiert und in den Rapport übertragen werden. Diese Felder werden durch die KI-Texterkennung befüllt.

### Warum grau?
- **Grau = Read-Only (ursprünglich)**: Signalisiert, dass diese Daten aus einer externen Quelle stammen
- **Grau = Stammdaten**: Unveränderliche Basis-Informationen aus dem Gesuch
- **Grau = Vererbt**: Bei Split/Merge werden diese Daten an Unter-Rapporte vererbt

### Welche Felder sind grau?

#### Aus dem Gesuch automatisch übernommen:
```
1. Titel des Teilprojekts (z.B. "TP1 Leitmedien")
2. Jahr (z.B. "2024")
3. Budget (z.B. "CHF 1'650'000")
4. Teilprojekt-Nummer (TP1-TP6)
5. K-Ziele und Beiträge (aus Gesuch-Text extrahiert)
6. Basis-Beschreibung des Teilprojekts
7. Antragsteller/Organisation
8. Eingereicht am (Datum aus Gesuch)
```

### Technische Umsetzung:
```sql
-- In der Datenbank (rapport_felder Tabelle):
feld_typ = 'grau'
quelle = 'gesuch' oder 'vererbt'
```

```javascript
// Im Frontend (CSS-Klasse):
className="bg-gray-50 text-gray-700"  // Graue Hintergrundfarbe
readonly={true}                       // Ursprünglich nicht editierbar
```

---

## 🟡 GELBE FELDER (Manuell auszufüllen)

### Was sind gelbe Felder?
**Gelbe Felder** sind Eingabefelder, die vom Benutzer **manuell** ausgefüllt werden müssen. Diese Informationen sind NICHT im Gesuch enthalten und müssen während der Rapport-Erstellung ergänzt werden.

### Warum gelb?
- **Gelb = Achtung/Aktion erforderlich**: Signalisiert dem Benutzer, dass hier Input benötigt wird
- **Gelb = Editierbar**: Volle Bearbeitungsrechte für den Benutzer
- **Gelb = Neu**: Diese Informationen entstehen erst während des Jahres

### Welche Felder sind gelb?

#### Vom Benutzer manuell einzugeben:
```
1. Herausforderungen (was waren die Schwierigkeiten?)
2. Durchgeführte Massnahmen (was wurde konkret gemacht?)
3. Tatsächliche Arbeitszeit (Stunden/Tage)
4. Erzielte Ergebnisse (Outcome)
5. Kommentare/Notizen
6. Status-Updates
7. Anhänge/Dokumente
8. Abweichungen vom Plan
```

### Technische Umsetzung:
```sql
-- In der Datenbank (rapport_felder Tabelle):
feld_typ = 'gelb'
quelle = 'manuell'
```

```javascript
// Im Frontend (CSS-Klasse):
className="bg-yellow-50 border-yellow-200"  // Gelbe Hintergrundfarbe
readonly={false}                             // Vollständig editierbar
```

---

## 🔄 AKTUELLE ÄNDERUNG (Stand: August 2025)

### Ursprüngliches Konzept:
- **Graue Felder**: NICHT editierbar (readonly)
- **Gelbe Felder**: Editierbar

### NEUE Implementierung:
Nach Benutzerfeedback wurden **ALLE Felder editierbar** gemacht:
```javascript
// Aus IMPLEMENTATION-LOG-PHASE-1.md:
"Alle Felder sind jetzt gelb (bg-yellow-50) für bessere Sichtbarkeit"
"Normale User können jetzt ALLE Felder bearbeiten"
```

### Warum die Änderung?
- Benutzer müssen manchmal auch Stammdaten korrigieren können
- Fehler in der automatischen Erkennung müssen korrigierbar sein
- Flexibilität für spezielle Anpassungen

---

## 📊 DATENFLUSS: GESUCH → RAPPORT

```
1. GESUCH UPLOAD
   ↓
2. KI-TEXTERKENNUNG
   ↓
3. DATENEXTRAKTION
   ↓
4. RAPPORT ERSTELLEN
   ├─→ GRAUE FELDER (automatisch befüllt aus Gesuch)
   │   • Titel, Budget, K-Ziele
   │   • Stammdaten
   │   
   └─→ GELBE FELDER (leer, warten auf User-Input)
       • Herausforderungen
       • Durchgeführte Massnahmen
       • Ergebnisse
```

---

## 💾 DATENBANK-STRUKTUR

### Tabelle: `rapport_felder`
```sql
CREATE TABLE rapport_felder (
    id INTEGER PRIMARY KEY,
    rapport_id INTEGER,
    feld_typ VARCHAR(50),     -- 'grau' oder 'gelb'
    feld_name VARCHAR(100),    -- z.B. 'budget', 'herausforderungen'
    feld_wert TEXT,           -- Der aktuelle Wert
    quelle VARCHAR(100),      -- 'gesuch', 'manuell', 'vererbt', 'automatisch'
    ist_pflichtfeld BOOLEAN,
    geaendert_von INTEGER,    -- User ID bei manueller Änderung
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Beispiel-Einträge:
```sql
-- Graues Feld (aus Gesuch)
INSERT INTO rapport_felder VALUES 
(1, 101, 'grau', 'budget', '1650000', 'gesuch', true, NULL, '2025-01-01', '2025-01-01');

-- Gelbes Feld (manuell)
INSERT INTO rapport_felder VALUES 
(2, 101, 'gelb', 'herausforderungen', 'Verzögerung bei...', 'manuell', false, 5, '2025-03-15', '2025-03-20');
```

---

## 🎯 VERWENDUNGSZWECK

### Für Benutzer:
- **Schnelle Orientierung**: Sofort erkennbar, welche Felder bereits befüllt sind
- **Arbeitsersparnis**: Graue Felder müssen nicht manuell übertragen werden
- **Qualitätskontrolle**: Gelbe Felder zeigen, wo noch Arbeit nötig ist

### Für Admins:
- **Tracking**: Nachvollziehbar, welche Daten woher kommen
- **Audit**: Änderungshistorie für alle Felder
- **Validierung**: Prüfung ob alle Pflichtfelder ausgefüllt sind

### Für das System:
- **Split/Merge**: Graue Felder werden automatisch vererbt
- **Export**: Unterschiedliche Behandlung beim Word-Export
- **Versionierung**: Stammdaten-Snapshot bei Änderungen

---

## 📝 ZUSAMMENFASSUNG

| Aspekt | GRAUE FELDER | GELBE FELDER |
|--------|--------------|--------------|
| **Herkunft** | Aus Gesuch (automatisch) | Vom User (manuell) |
| **Inhalt** | Stammdaten, Budget, K-Ziele | Herausforderungen, Massnahmen, Ergebnisse |
| **Zeitpunkt** | Bei Rapport-Erstellung | Während des Jahres |
| **Editierbar** | Ursprünglich Nein, jetzt JA | Immer JA |
| **Datenbank** | feld_typ='grau' | feld_typ='gelb' |
| **CSS-Klasse** | bg-gray-50 → bg-yellow-50 | bg-yellow-50 |
| **Vererbung** | Wird bei Split vererbt | Muss neu eingegeben werden |

---

## 🔍 WO FINDE ICH DIE FELDER?

### Frontend-Code:
- `frontend/js/rapport.page.js` - Rapport-Formular
- `frontend/src/rapport-form.component.js` - Feld-Rendering

### Backend-Code:
- `backend/src/controllers/rapport.controller.js` - Feld-Verwaltung
- `backend/migrations/010_multi_user_teilprojekt_system.sql` - rapport_felder Tabelle

### Dokumentation:
- `GESUCH_RAPPORT_KONZEPT.md` - Konzept der automatischen Befüllung
- `DATABASE_CHANGES_PROTOCOL.md` - Tabellen-Definition
- `IMPLEMENTATION-LOG-PHASE-1.md` - Aktuelle Änderungen

---

*Stand: August 2025*
*Hinweis: Aktuell sind alle Felder editierbar (gelb), die Unterscheidung grau/gelb dient primär der Herkunfts-Kennzeichnung*