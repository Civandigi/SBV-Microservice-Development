# SBV Professional V2 - Agent OS Project

## Agent OS Documentation

### Product Context
- **Mission & Vision:** @.agent-os/product/mission.md
- **Technical Architecture:** @.agent-os/product/tech-stack.md
- **Development Roadmap:** @.agent-os/product/roadmap.md
- **Decision History:** @.agent-os/product/decisions.md

### Development Standards
- **Code Style:** @~/.agent-os/standards/code-style.md
- **Best Practices:** @~/.agent-os/standards/best-practices.md

### Project Management
- **Active Specs:** @.agent-os/specs/
- **Spec Planning:** Use `@~/.agent-os/instructions/create-spec.md`
- **Tasks Execution:** Use `@~/.agent-os/instructions/execute-tasks.md`

## Workflow Instructions

When asked to work on this codebase:

1. **First**, check @.agent-os/product/roadmap.md for current priorities
2. **Then**, follow the appropriate instruction file:
   - For new features: @.agent-os/instructions/create-spec.md
   - For tasks execution: @.agent-os/instructions/execute-tasks.md
3. **Always**, adhere to the standards in the files listed above

## Important Notes

- Product-specific files in `.agent-os/product/` override any global standards
- User's specific instructions override (or amend) instructions found in `.agent-os/specs/...`
- Always adhere to established patterns, code style, and best practices documented above.

## Current Development Status

**Phase:** Phase 1 - Critical Bug Fixes and Integration  
**Priority:** Frontend-Backend Rapport Integration (rapport page API connection issues)  
**Next Steps:** Review @.agent-os/product/roadmap.md Phase 1 tasks

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