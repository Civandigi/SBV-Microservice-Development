# 📋 RAPPORT-FORMULAR: Komplette Feld-Dokumentation (Enhanced)
## Mit Frontend-Backend Mapping und tatsächlicher Implementierung

---

## 📊 ÜBERSICHT

**Stand:** August 2025  
**Quelle:** Tatsächliche Implementierung aus `frontend/pages/rapport.html`  
**Datenspeicherung:** JSON im `content` Feld der Datenbank  

---

## 🔵 1. GRUNDINFORMATIONEN (Pflichtfelder)

### 1.1 Teilprojekt-Auswahl
```javascript
Field: teilprojekt
HTML: <select name="teilprojekt" id="teilprojektSelect">
Type: SELECT
Required: ✅ JA
Optionen:
  - TP1 - Leitmedien (1'650'000 CHF)
  - TP2 - Digitale Medien (920'000 CHF)
  - TP3 - Messen & Ausstellungen (410'000 CHF)
  - TP4 - Events & Aktionen (740'000 CHF)
  - TP5 - Schulprojekte (450'000 CHF)
  - TP6 - Partnerprojekte inkl. KEP (240'000 CHF)
Storage: contentData.teilprojekt
```

### 1.2 Berichtsjahr
```javascript
Field: jahr
HTML: <select name="jahr">
Type: SELECT
Required: ✅ JA
Optionen: 2023, 2024, 2025
Default: Aktuelles Jahr
Storage: contentData.jahr
```

### 1.3 Berichtsperiode
```javascript
Field: periode
HTML: <select name="periode">
Type: SELECT
Required: ✅ JA
Optionen: Q1, Q2, Q3, Q4
Storage: contentData.periode
```

---

## 🔘 2. TEILPROJEKT-STAMMDATEN (Grau → Automatisch aus Template)

### 2.1 Teilprojekt Name
```javascript
Field: teilprojektName
HTML: <input type="text" name="teilprojektName" id="teilprojektNameField">
Type: TEXT
Editierbar: JA (war ursprünglich readonly)
Quelle: Template/Gesuch
CSS: bg-gray-100 (visuell grau)
Storage: contentData.teilprojektName
```

### 2.2 Teilprojekt Beschreibung
```javascript
Field: teilprojektBeschreibung
HTML: <textarea name="teilprojektBeschreibung" id="teilprojektBeschreibungField">
Type: TEXTAREA
Rows: 3
Quelle: Template/Gesuch
Storage: contentData.teilprojektBeschreibung
```

### 2.3 Teilprojekt Ziele
```javascript
Field: teilprojektZiele
HTML: <textarea name="teilprojektZiele" id="teilprojektZieleField">
Type: TEXTAREA
Rows: 4
Quelle: Template/Gesuch
Storage: contentData.teilprojektZiele
```

### 2.4 K-Zielbezug
```javascript
Field: teilprojektKZielbezug
HTML: <textarea name="teilprojektKZielbezug" id="teilprojektKZielbezugField">
Type: TEXTAREA
Rows: 3
Quelle: Template/Gesuch
Storage: contentData.teilprojektKZielbezug
```

### 2.5 Gesamtbudget
```javascript
Field: teilprojektGesamtbudget
HTML: <input type="text" name="teilprojektGesamtbudget" id="teilprojektBudgetField">
Type: TEXT
Format: CHF
Quelle: Gesuch
Storage: contentData.teilprojektGesamtbudget
```

### 2.6 Anzahl Maßnahmen
```javascript
Field: teilprojektMassnahmenCount
HTML: <input type="text" name="teilprojektMassnahmenCount" id="teilprojektMassnahmenCountField">
Type: TEXT
Format: Zahl
Quelle: Template
Storage: contentData.teilprojektMassnahmenCount
```

---

## 💰 3. BUDGET-FELDER (Gelb → Manuell auszufüllen)

### 3.1 Budget Brutto (Geplant)
```javascript
Field: budgetBrutto
HTML: <input type="number" name="budgetBrutto" step="0.01">
Type: NUMBER
CSS: bg-yellow-50 border-yellow-300
Placeholder: "Geplantes Budget für diese Periode"
Storage: contentData.budgetBrutto
Berechnung: Trigger für Varianz-Berechnung
```

### 3.2 IST Brutto (Ausgegeben)
```javascript
Field: istBrutto
HTML: <input type="number" name="istBrutto" step="0.01">
Type: NUMBER
CSS: bg-yellow-50 border-yellow-300
Placeholder: "Tatsächlich ausgegebenes Budget"
Storage: contentData.istBrutto
Berechnung: Trigger für Netto-Berechnung
```

### 3.3 Aufwandsminderung
```javascript
Field: aufwandsminderung
HTML: <input type="number" name="aufwandsminderung" step="0.01">
Type: NUMBER
CSS: bg-yellow-50 border-yellow-300
Placeholder: "Eingespartes Budget / Sponsoring"
Storage: contentData.aufwandsminderung
Berechnung: IST Brutto - Aufwandsminderung = Netto
```

### 3.4 Kosten Netto (Berechnet)
```javascript
Field: kostenNetto
Type: CALCULATED
Berechnung: istBrutto - aufwandsminderung
Display: Nur Anzeige, nicht editierbar
CSS: text-gray-600 font-semibold
```

### 3.5 Budget Varianz (Berechnet)
```javascript
Field: budgetVarianz
HTML: <span id="budgetVarianz">
Type: CALCULATED
Berechnung: ((istBrutto - budgetBrutto) / budgetBrutto) * 100
Display: Prozent mit Farb-Indikator
Farben:
  - Grün: < 100% (unter Budget)
  - Rot: > 100% (über Budget)
```

---

## 📋 4. MAßNAHMEN (Dynamisch generiert)

### 4.1 Maßnahmen Container
```javascript
Container: massnahmenContainer
HTML: <div id="massnahmenContainer">
Dynamisch: Wird aus Template geladen
```

### 4.2 Pro Maßnahme (Nummer 1-N)
```javascript
// Für jede Maßnahme X:
Fields:
  - kZielBezug_{X}: SELECT (K-Ziel Auswahl, Multiple)
  - istBrutto_{X}: NUMBER (Kosten dieser Maßnahme)
  - aufwandsminderung_{X}: NUMBER (Einsparungen)
  - streukosten_{X}: NUMBER (Mediakosten)
  - produktionskosten_{X}: NUMBER (Herstellungskosten)
  - overhead_{X}: NUMBER (Gemeinkosten)

Storage: contentData.massnahmen.kZielBezug_{X} etc.
CSS: Alle mit bg-yellow-50 (editierbar)
```

---

## 📊 5. KPI-FELDER (Dynamisch generiert)

### 5.1 KPI Container
```javascript
Container: kpiContainer
HTML: <div id="kpiContainer" class="grid grid-cols-1 md:grid-cols-2 gap-4">
Dynamisch: Wird aus Template geladen
```

### 5.2 Pro KPI
```javascript
// Für jeden KPI mit ID:
Fields:
  - kpi_name_{ID}: TEXT (Name der Kennzahl) [readonly]
  - kpi_target_{ID}: NUMBER (Zielwert) [readonly]
  - kpi_{ID}: NUMBER (IST-Wert) [editierbar]

Storage: contentData.kpis.kpi_{ID}
CSS: IST-Werte mit bg-yellow-50
```

---

## 📝 6. BERICHTS-TEXTFELDER (Alle Gelb → Manuell)

### 6.1 Was lief gut?
```javascript
Field: wasLiefGut
HTML: <textarea name="wasLiefGut" rows="3">
Type: TEXTAREA
CSS: bg-yellow-50 border-yellow-300
Placeholder: "Positive Aspekte und Erfolge beschreiben"
Storage: contentData.wasLiefGut
```

### 6.2 Abweichungen
```javascript
Field: abweichungen
HTML: <textarea name="abweichungen" rows="3">
Type: TEXTAREA
CSS: bg-yellow-50 border-yellow-300
Placeholder: "Herausforderungen und Abweichungen vom Plan"
Storage: contentData.abweichungen
```

### 6.3 Lessons Learned
```javascript
Field: lessonsLearned
HTML: <textarea name="lessonsLearned" rows="3">
Type: TEXTAREA
CSS: bg-yellow-50 border-yellow-300
Placeholder: "Wichtige Erkenntnisse für zukünftige Projekte"
Storage: contentData.lessonsLearned
```

---

## 📄 7. ERWEITERTE BERICHTSFELDER (In contentData gespeichert)

Diese Felder werden im Code referenziert, sind aber im aktuellen HTML nicht direkt sichtbar:

```javascript
// Aus Frontend Code (Zeile 2056-2061):
const fieldsToFill = [
    'zieleinschaetzung',      // Bewertung der Zielerreichung
    'massnahmenDetails',       // Detaillierte Maßnahmenbeschreibung
    'zielgruppenErreichung',   // Wie gut wurden Zielgruppen erreicht
    'medienresonanz',          // Medienecho und Berichterstattung
    'partnerFeedback',         // Rückmeldungen von Partnern
    'weitereEffekte',          // Unerwartete Effekte
    'zusammenfassung',         // Executive Summary
    'abgeschlosseneAktivitaeten', // Fertige Aktivitäten
    'laufendeAktivitaeten',    // Aktuelle Aktivitäten
    'geplanteAktivitaeten',    // Zukünftige Aktivitäten
    'herausforderungen',       // Schwierigkeiten
    'verbesserungen',          // Verbesserungsvorschläge
    'empfehlungen',            // Empfehlungen für Management
    'ausblick'                 // Prognose nächste Periode
];

// Diese werden alle als TEXTAREA-Felder behandelt
// Storage: contentData.{fieldName}
```

---

## 📎 8. DOKUMENTE & UPLOADS

### 8.1 Rapport PDF Upload
```javascript
Field: rapportDocument
HTML: <input type="file" id="rapportDocument" name="rapportDocument" accept=".pdf">
Type: FILE
Accept: Nur PDF
Storage: Separate Upload-Route /api/upload/rapport/{id}
```

### 8.2 Dokument-Hinweise
```javascript
Field: dokumenteHinweise
HTML: <textarea name="dokumenteHinweise" rows="2">
Type: TEXTAREA
Placeholder: "Beschreibung der hochgeladenen Dokumente..."
Storage: contentData.dokumenteHinweise
```

---

## 💾 9. DATENBANK-STRUKTUR

### 9.1 Haupt-Rapport Tabelle
```sql
rapporte (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255),          -- Rapport-Titel
    content TEXT,                 -- JSON mit allen Feldern
    category VARCHAR(50),         -- Teilprojekt (TP1-TP6)
    status VARCHAR(50),           -- entwurf|eingereicht|genehmigt|etc
    author_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### 9.2 Content JSON Struktur
```json
{
    "teilprojekt": "TP1",
    "jahr": "2024",
    "periode": "Q3",
    "budgetBrutto": 412500,
    "istBrutto": 385200,
    "aufwandsminderung": 25000,
    "wasLiefGut": "Die Medienkampagne...",
    "abweichungen": "Verzögerung bei...",
    "lessonsLearned": "Frühere Einbindung...",
    "teilprojektName": "Leitmedien",
    "teilprojektBeschreibung": "...",
    "massnahmen": {
        "kZielBezug_1": ["K1", "K3"],
        "istBrutto_1": 45000,
        "streukosten_1": 20000
    },
    "kpis": {
        "kpi_reichweite": 850000,
        "kpi_engagement": 4.2
    }
}
```

---

## 🔄 10. FORMULAR-WORKFLOW

### 10.1 Neuer Rapport
1. User wählt Teilprojekt → Template wird geladen
2. Graue Felder werden automatisch befüllt
3. User füllt gelbe Felder aus
4. Speichern als JSON im `content` Feld

### 10.2 Rapport Bearbeiten
1. Content JSON wird geparst
2. Alle Felder werden befüllt (inkl. dynamische)
3. User bearbeitet
4. Update des JSON im `content` Feld

### 10.3 Status-Workflow
```
entwurf → eingereicht → zur-pruefung → genehmigt/abgelehnt
```

---

## 📊 ZUSAMMENFASSUNG

### Feld-Statistik:
- **3** Pflichtfelder (Teilprojekt, Jahr, Periode)
- **6** Stammdaten-Felder (grau, aus Template)
- **5** Budget-Hauptfelder (3 manuell, 2 berechnet)
- **6×N** Maßnahmen-Felder (N = Anzahl Maßnahmen)
- **3×M** KPI-Felder (M = Anzahl KPIs)
- **3** Haupt-Berichtsfelder (wasLiefGut, etc.)
- **14** Erweiterte Textfelder (optional)
- **2** Upload-Felder

### Farbcodierung:
- 🔘 **Grau (bg-gray-100)**: Aus Template/Gesuch (aber editierbar)
- 🟡 **Gelb (bg-yellow-50)**: Manuell auszufüllen
- ⚙️ **Berechnet**: Automatisch kalkuliert

### Speicherung:
- Alle Felder werden als JSON im `content` Feld gespeichert
- Uploads werden separat behandelt
- Status und Metadaten in eigenen Spalten

---

*Stand: August 2025*  
*Basiert auf: Tatsächlicher Implementierung in frontend/pages/rapport.html*