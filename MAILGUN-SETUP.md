# 📧 Mailgun Setup für SBV Professional V2

## ✅ Warum Mailgun?

Mailgun ist **besser** als normales SMTP für Transaktions-E-Mails:
- ✅ **Höhere Zustellrate** (99.9%)
- ✅ **Detaillierte Analytics** (Öffnungsraten, Klicks, Bounces)
- ✅ **Einfache API** (keine SMTP-Probleme)
- ✅ **Kostenlos** bis 1000 E-Mails/Monat
- ✅ **EU-Server** verfügbar (DSGVO-konform)

---

## 🚀 Schnell-Setup (5 Minuten)

### Schritt 1: Mailgun Account erstellen
1. Gehen Sie zu [mailgun.com](https://www.mailgun.com)
2. Klicken Sie auf "Start Free Trial"
3. **WICHTIG:** Wählen Sie **EU Region** für DSGVO-Compliance
4. Verifizieren Sie Ihre E-Mail-Adresse

### Schritt 2: Domain einrichten

#### Option A: **Sandbox-Domain** (Sofort, zum Testen)
- Automatisch verfügbar: `sandboxxxxx.mailgun.org`
- Nur an verifizierte E-Mail-Adressen
- Perfekt für Tests

#### Option B: **Eigene Domain** (Empfohlen für Produktion)
1. Dashboard → "Sending" → "Domains" → "Add New Domain"
2. Domain eingeben: `mg.ihre-domain.ch`
3. DNS-Einträge bei Ihrem Provider hinzufügen:
   ```
   TXT  mg.ihre-domain.ch  "v=spf1 include:mailgun.org ~all"
   TXT  k1._domainkey.mg.ihre-domain.ch  "k=rsa; p=MIGfMA0..."
   MX   mg.ihre-domain.ch  mxa.eu.mailgun.org (Priorität: 10)
   MX   mg.ihre-domain.ch  mxb.eu.mailgun.org (Priorität: 10)
   ```
4. Warten Sie 5-48 Stunden auf DNS-Propagation
5. Klicken Sie "Verify DNS Settings"

### Schritt 3: API-Key abrufen
1. Dashboard → "Settings" → "API Keys"
2. Kopieren Sie den **Private API Key**

### Schritt 4: .env konfigurieren

Erstellen Sie `.env` im Backend-Ordner:

```env
# Mailgun Configuration
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-api-key-here
MAILGUN_DOMAIN=sandboxxxxx.mailgun.org  # oder mg.ihre-domain.ch
MAILGUN_FROM="SBV Professional" <noreply@mg.ihre-domain.ch>
MAILGUN_EU=true  # Wichtig für EU-Server!
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Schritt 5: Server neu starten
```bash
cd backend
npm restart
```

---

## 🧪 Test der E-Mail-Funktion

### 1. Test-Seite öffnen:
```
http://localhost:8080/email-test.html
```

### 2. Für Sandbox-Domain:
- Fügen Sie Test-E-Mail-Adressen hinzu:
  - Mailgun Dashboard → "Sending" → "Domain Settings"
  - "Authorized Recipients" → E-Mail hinzufügen

### 3. Test-E-Mail senden:
- Nutzen Sie die Test-Funktion auf der Test-Seite
- Prüfen Sie Mailgun Dashboard → "Logs" für Details

---

## 📊 Mailgun Dashboard Features

### Logs & Analytics:
- **Real-time Logs**: Alle gesendeten E-Mails
- **Analytics**: Öffnungsraten, Klickraten, Bounces
- **Webhooks**: Echtzeit-Events (optional)

### Wichtige Metriken:
- **Delivered**: Erfolgreich zugestellt
- **Opened**: E-Mail wurde geöffnet
- **Clicked**: Links wurden geklickt
- **Bounced**: Nicht zustellbar
- **Complained**: Als Spam markiert

---

## 💰 Kosten

### Free Tier:
- **1000 E-Mails/Monat kostenlos**
- Perfekt für kleine Teams

### Pay-as-you-go:
- $0.80 per 1000 E-Mails
- Keine monatlichen Gebühren

### Foundation Plan ($35/Monat):
- 50,000 E-Mails/Monat
- Dedizierte IP
- Erweiterte Analytics

---

## 🔧 Troubleshooting

### Problem: "401 Unauthorized"
- **Lösung**: API-Key prüfen, Region (EU/US) prüfen

### Problem: "Domain not verified"
- **Lösung**: DNS-Einträge prüfen, 48h warten

### Problem: "Sandbox domain restrictions"
- **Lösung**: E-Mail-Adresse als "Authorized Recipient" hinzufügen

### Problem: E-Mails landen im Spam
- **Lösung**: 
  - SPF/DKIM korrekt konfigurieren
  - Eigene Domain verwenden (nicht Sandbox)
  - "From"-Adresse mit Domain übereinstimmen

---

## 📝 Code-Beispiel

```javascript
// E-Mail senden mit unserem Service
const EmailService = require('./services/email.service');

await EmailService.sendRapportRequest({
    to: 'user@example.com',
    userName: 'Max Mustermann',
    teilprojekt: 'TP1 - Leitmedien',
    deadline: '2024-12-31',
    description: 'Jahresabschlussbericht'
});
```

---

## 🎯 Best Practices

1. **Verwenden Sie eine Subdomain** (mg.domain.ch statt domain.ch)
2. **Setzen Sie vernünftige Rate Limits** (max 10 E-Mails/Sekunde)
3. **Überwachen Sie Bounce-Rates** (< 5% ist gut)
4. **Nutzen Sie Templates** für konsistentes Design
5. **Testen Sie immer mit Sandbox** bevor Produktion

---

## 🆘 Support

- **Mailgun Docs**: [documentation.mailgun.com](https://documentation.mailgun.com)
- **Status Page**: [status.mailgun.com](https://status.mailgun.com)
- **Support**: support@mailgun.com

---

**Fertig! Mit Mailgun haben Sie ein professionelles E-Mail-System in 5 Minuten.**