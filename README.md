# SBV Professional V2 - Clean Architecture Edition

## 🏦 Überblick
Moderne, sichere Web-Anwendung für den Schweizer Bauernverband mit rollenbasiertem Rapport-Management. Komplett neu entwickelt mit sauberer Architektur und identischem Swiss Corporate Design.

## ✅ Verbesserungen gegenüber V1
- ❌ **Kein iFrame** - Direkte HTML/JS Integration
- 📁 **Modulare Struktur** - Kleine, fokussierte Dateien
- 🔒 **Sichere Konfiguration** - Environment-basiert
- ⚡ **Vernünftige Rate Limits** - Development vs Production
- 🧪 **Test-Coverage** - Jest für Backend & Frontend
- 🛡️ **Sicherheit First** - Input-Validation, sichere File-Uploads

## 👥 Benutzerrollen (Korrigiert)
- **🟢 User**: Rapport-Ersteller (Hauptnutzer) - kann eigene Rapporte erstellen/bearbeiten
- **🟡 Admin**: Rapport-Manager - kann fast alles, vereinfachte Ansicht
- **🔴 Super Admin**: System-Administrator - Systemeinstellungen + alles andere

## 🚀 Start
```bash
npm install
npm run dev
```

## 📋 Test-Benutzer
- Super Admin: superadmin@sbv-demo.ch (test123)
- Admin: admin@sbv-demo.ch (test123)
- User: user@sbv-demo.ch (test123)

---
*Schweizer Bauernverband Professional - Clean Architecture Edition*