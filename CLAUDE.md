# SBV Professional V2 - Projekt Dokumentation

## Current Development Status

**Phase:** Phase 1 - Database-Fundament mit Microservice-Support (10-25%)
**Priority:** Schema für Microservice-Integration implementieren
**Next Steps:** Folge IMPLEMENTATION-PLAN-WITH-MICROSERVICE.md

### Known Issues Requiring Attention
1. **Critical:** Frontend not connected to backend API on rapport page
2. **High:** Security vulnerabilities in authentication system  
3. **Medium:** Test coverage below target (currently ~30%, target 70%+)
4. **Medium:** API response format inconsistencies

## Project Specific Guidelines

### Swiss Corporate Design Compliance
- Design must match V1 demo exactly (pixel-perfect)
- No design changes without explicit approval
- Swiss corporate colors, typography, and layout patterns mandatory

### User-Centric Architecture
- Primary focus on User role (Rapport-Ersteller) - 80% of users
- Admin features are secondary but comprehensive
- Super Admin limited to system administration only

### Clean Architecture Requirements
- Maximum file size: 300 lines
- Separate Controllers, Services, Models, Middleware
- 100% Jest test coverage mandatory
- Modular CSS architecture

### Role-Based Development Priority
1. **🟢 User Features**: Rapport creation, editing, personal dashboard
2. **🟡 Admin Features**: All-user management, approval workflows  
3. **🔴 Super Admin Features**: System configuration, monitoring

### Technical Constraints
- No frontend frameworks - Vanilla JavaScript + ES6 modules only
- PostgreSQL with clean normalized schema
- Express.js modular architecture
- Swiss Corporate Design - custom CSS implementation

## Development Plan

**Main Implementation Plan:** IMPLEMENTATION-PLAN-WITH-MICROSERVICE.md
- Phase 1: Database-Fundament (10-25%) - 3 Tage
- Phase 2: Backend API Integration (25-45%) - 4 Tage
- Phase 3: Frontend Service-Status (45-70%) - 5 Tage