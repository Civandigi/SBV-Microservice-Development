# 📋 VOLLSTÄNDIGE DOKUMENTATION: Alle Rapport-Formular Eingabefelder
## Mit Erklärung was jedes Feld bedeutet

---

## 🎯 1. GRUNDINFORMATIONEN (Pflichtfelder)

### Teilprojekt-Auswahl
- **Feldname:** `teilprojekt`
- **Bedeutung:** Wählt eines der 6 Hauptprojekte aus dem Gesuch
- **Optionen:**
  - TP1 - Leitmedien (Budget: 1'650'000 CHF)
  - TP2 - Digitale Medien (Budget: 920'000 CHF)
  - TP3 - Messen & Ausstellungen (Budget: 410'000 CHF)
  - TP4 - Events & Aktionen (Budget: 740'000 CHF)
  - TP5 - Schulprojekte (Budget: 450'000 CHF)
  - TP6 - Partnerprojekte inkl. KEP (Budget: 240'000 CHF)
- **Pflichtfeld:** ✅ JA

### Berichtsjahr
- **Feldname:** `jahr`
- **Bedeutung:** Das Jahr für welches der Rapport erstellt wird
- **Beispiel:** 2024
- **Pflichtfeld:** ✅ JA

### Berichtsperiode
- **Feldname:** `periode`
- **Bedeutung:** Quartal des Jahres (Q1-Q4)
- **Beispiel:** "Q3 2024" = Juli-September 2024
- **Pflichtfeld:** ✅ JA

---

## 📊 2. TEILPROJEKT-STAMMDATEN (Automatisch befüllt)

Diese Felder werden automatisch aus dem Template befüllt wenn ein Teilprojekt ausgewählt wird:

### Teilprojekt Name
- **Feldname:** `teilprojektName`
- **Bedeutung:** Offizieller Name des Teilprojekts
- **Beispiel:** "Leitmedien - Print und Online Kommunikation"
- **Herkunft:** 🔘 Grau (aus Template)

### Beschreibung
- **Feldname:** `teilprojektBeschreibung`
- **Bedeutung:** Detaillierte Beschreibung was das Teilprojekt beinhaltet
- **Beispiel:** "Kommunikation über traditionelle Printmedien und deren digitale Kanäle..."
- **Herkunft:** 🔘 Grau (aus Template)

### Ziele
- **Feldname:** `teilprojektZiele`
- **Bedeutung:** Was soll mit diesem Teilprojekt erreicht werden?
- **Beispiel:** "Erhöhung der Medienpräsenz, Stärkung der Markenbekanntheit..."
- **Herkunft:** 🔘 Grau (aus Template)

### K-Zielbezug
- **Feldname:** `teilprojektKZielbezug`
- **Bedeutung:** Verbindung zu den Kommunikationszielen aus dem Gesuch
- **Beispiel:** "K-Ziel 1: Awareness, K-Ziel 3: Trust Building"
- **Herkunft:** 🔘 Grau (aus Template)

### Gesamtbudget
- **Feldname:** `teilprojektGesamtbudget`
- **Bedeutung:** Genehmigtes Jahresbudget für dieses Teilprojekt
- **Beispiel:** "1'650'000 CHF"
- **Herkunft:** 🔘 Grau (aus Gesuch)

### Anzahl Massnahmen
- **Feldname:** `teilprojektMassnahmenCount`
- **Bedeutung:** Wie viele einzelne Massnahmen sind in diesem Teilprojekt geplant
- **Beispiel:** "12 Massnahmen"
- **Herkunft:** 🔘 Grau (aus Template)

---

## 💰 3. BUDGET-FELDER (Manuell auszufüllen)

### Budget Brutto
- **Feldname:** `budgetBrutto`
- **Bedeutung:** Geplantes Budget für diese Periode (Quartal)
- **Beispiel:** "412'500 CHF" (1/4 des Jahresbudgets)
- **Herkunft:** 🟡 Gelb (manuell)

### IST Brutto
- **Feldname:** `istBrutto`
- **Bedeutung:** Tatsächlich ausgegebenes/verbrauchtes Budget
- **Beispiel:** "385'200 CHF"
- **Herkunft:** 🟡 Gelb (manuell)

### Aufwandsminderung
- **Feldname:** `aufwandsminderung`
- **Bedeutung:** Eingespartes Budget durch Optimierungen oder Partnerbeiträge
- **Beispiel:** "25'000 CHF" (durch Sponsoring eingespart)
- **Herkunft:** 🟡 Gelb (manuell)

### Kosten Netto
- **Feldname:** `kostenNetto`
- **Bedeutung:** Tatsächliche Nettokosten (IST minus Aufwandsminderung)
- **Berechnung:** Automatisch: IST Brutto - Aufwandsminderung
- **Beispiel:** "360'200 CHF"
- **Herkunft:** ⚙️ Berechnet

---

## 📈 4. MASSNAHMEN-DETAILS (Pro Massnahme)

Für jede Massnahme im Teilprojekt:

### IST Brutto pro Massnahme
- **Feldname:** `istBrutto_{nr}`
- **Bedeutung:** Kosten für diese spezifische Massnahme
- **Beispiel:** "45'000 CHF für Inseratekampagne"

### Aufwandsminderung pro Massnahme
- **Feldname:** `aufwandsminderung_{nr}`
- **Bedeutung:** Einsparungen bei dieser Massnahme

### Streukosten
- **Feldname:** `streukosten_{nr}`
- **Bedeutung:** Kosten für Verbreitung/Distribution (z.B. Mediakosten)
- **Beispiel:** "20'000 CHF für Anzeigenschaltung"

### Produktionskosten
- **Feldname:** `produktionskosten_{nr}`
- **Bedeutung:** Kosten für Erstellung/Produktion
- **Beispiel:** "15'000 CHF für Grafikdesign und Text"

### Overhead
- **Feldname:** `overhead_{nr}`
- **Bedeutung:** Anteilige Gemeinkosten (Personal, Büro, etc.)
- **Beispiel:** "10'000 CHF"

### K-Ziel Bezug
- **Feldname:** `kZielBezug_{nr}`
- **Bedeutung:** Welche Kommunikationsziele werden mit dieser Massnahme verfolgt
- **Beispiel:** "K-Ziel 1 + K-Ziel 3"

---

## 📊 5. KPI-FELDER (Leistungskennzahlen)

### KPI IST-Wert
- **Feldname:** `kpi_{id}`
- **Bedeutung:** Gemessener Wert der Kennzahl
- **Beispiel:** "850'000" (Reichweite)

### KPI Name
- **Feldname:** `kpi_{id}_name`
- **Bedeutung:** Bezeichnung der Kennzahl
- **Beispiel:** "Medienreichweite Print"

### KPI Zielwert
- **Feldname:** `kpi_{id}_target`
- **Bedeutung:** Geplanter Sollwert
- **Beispiel:** "1'000'000"

---

## 📝 6. BERICHTS-TEXTFELDER (Qualitative Angaben)

### Was lief gut?
- **Feldname:** `wasLiefGut`
- **Bedeutung:** Erfolge und positive Erkenntnisse dieser Periode
- **Beispiel:** "Die Medienkampagne erreichte 20% mehr Menschen als geplant..."
- **Herkunft:** 🟡 Gelb (manuell)

### Wo gab es Abweichungen?
- **Feldname:** `abweichungen`
- **Bedeutung:** Probleme, Verzögerungen, Budget-Überschreitungen
- **Beispiel:** "Die Produktion verzögerte sich um 2 Wochen wegen..."
- **Herkunft:** 🟡 Gelb (manuell)

### Erkenntnisse / Lessons Learned
- **Feldname:** `lessonsLearned`
- **Bedeutung:** Was haben wir gelernt? Was würden wir anders machen?
- **Beispiel:** "Frühere Einbindung der Partner führt zu besseren Ergebnissen..."
- **Herkunft:** 🟡 Gelb (manuell)

---

## 📄 7. ERWEITERTE BERICHTSFELDER

### Zieleinschätzung
- **Feldname:** `zieleinschaetzung`
- **Bedeutung:** Bewertung ob und wie gut die Ziele erreicht wurden
- **Beispiel:** "Ziel zu 85% erreicht, weil..."

### Massnahmen Details
- **Feldname:** `massnahmenDetails`
- **Bedeutung:** Detaillierte Beschreibung der durchgeführten Massnahmen
- **Beispiel:** "Folgende 5 Massnahmen wurden umgesetzt:..."

### Zielgruppen-Erreichung
- **Feldname:** `zielgruppenErreichung`
- **Bedeutung:** Wie gut wurden die definierten Zielgruppen erreicht?
- **Beispiel:** "Junge Familien: sehr gut, Senioren: mittelmässig..."

### Medienresonanz
- **Feldname:** `medienresonanz`
- **Bedeutung:** Reaktionen und Berichterstattung in den Medien
- **Beispiel:** "15 Artikel in Tageszeitungen, 3 TV-Berichte..."

### Partner Feedback
- **Feldname:** `partnerFeedback`
- **Bedeutung:** Rückmeldungen von Kooperationspartnern
- **Beispiel:** "Partner XY war sehr zufrieden mit..."

### Weitere Effekte
- **Feldname:** `weitereEffekte`
- **Bedeutung:** Unerwartete positive oder negative Auswirkungen
- **Beispiel:** "Zusätzlich erhöhte Social Media Präsenz..."

### Zusammenfassung
- **Feldname:** `zusammenfassung`
- **Bedeutung:** Executive Summary des gesamten Rapports
- **Beispiel:** "In Q3 wurden alle geplanten Massnahmen erfolgreich..."

---

## 📅 8. AKTIVITÄTEN-STATUS

### Abgeschlossene Aktivitäten
- **Feldname:** `abgeschlosseneAktivitaeten`
- **Bedeutung:** Was wurde in dieser Periode fertiggestellt?
- **Beispiel:** "- Kampagne X lanciert\n- Event Y durchgeführt..."

### Laufende Aktivitäten
- **Feldname:** `laufendeAktivitaeten`
- **Bedeutung:** Was ist aktuell noch in Bearbeitung?
- **Beispiel:** "- Produktion Video Z (80% fertig)..."

### Geplante Aktivitäten
- **Feldname:** `geplanteAktivitaeten`
- **Bedeutung:** Was ist für die nächste Periode vorgesehen?
- **Beispiel:** "- Start Kampagne Q4\n- Vorbereitung Jahresabschluss..."

---

## 🚧 9. HERAUSFORDERUNGEN & VERBESSERUNGEN

### Herausforderungen
- **Feldname:** `herausforderungen`
- **Bedeutung:** Welche Schwierigkeiten gab es?
- **Beispiel:** "Lieferengpässe bei Druckmaterial, Personalmangel..."

### Verbesserungen
- **Feldname:** `verbesserungen`
- **Bedeutung:** Konkrete Verbesserungsvorschläge
- **Beispiel:** "Frühere Bestellung, bessere Ressourcenplanung..."

### Empfehlungen
- **Feldname:** `empfehlungen`
- **Bedeutung:** Empfehlungen für Management/Führung
- **Beispiel:** "Budget für digitale Kanäle erhöhen..."

### Ausblick
- **Feldname:** `ausblick`
- **Bedeutung:** Prognose und Planung für kommende Perioden
- **Beispiel:** "Q4 wird intensiv mit Jahresendkampagne..."

---

## 📎 10. DOKUMENTE & ANHÄNGE

### Rapport-Dokumentation
- **Feldname:** `rapportDocument`
- **Bedeutung:** PDF-Upload mit detaillierter Dokumentation
- **Format:** Nur PDF erlaubt
- **Beispiel:** "Q3_2024_TP1_Detailbericht.pdf"

### Zusätzliche Hinweise zu Dokumenten
- **Feldname:** `dokumenteHinweise`
- **Bedeutung:** Erklärung was in den Anhängen zu finden ist
- **Beispiel:** "Anhang enthält Medienclippings und Reichweitenanalyse"

---

## 📊 ZUSAMMENFASSUNG

**Gesamtanzahl Felder:** ~50+ Felder

**Kategorien:**
- **3 Pflichtfelder** (Teilprojekt, Jahr, Periode)
- **6 Stammdaten-Felder** (aus Template/Gesuch)
- **4 Budget-Hauptfelder**
- **5-30 Massnahmen-Felder** (je nach Anzahl)
- **3-15 KPI-Felder** (je nach Anzahl)
- **14 Berichts-Textfelder**
- **2 Upload-Felder**

**Farbcodierung:**
- 🔘 **Grau**: Ursprünglich aus Gesuch/Template (jetzt editierbar)
- 🟡 **Gelb**: Manuell vom User auszufüllen
- ⚙️ **Berechnet**: Automatisch vom System

---

*Stand: August 2025*
*Hinweis: Alle Felder sind aktuell editierbar, auch die ursprünglich grauen Stammdaten-Felder*