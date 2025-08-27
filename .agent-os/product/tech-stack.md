# Technical Stack

> Last Updated: 2025-08-05
> Version: 1.0.0

## Application Framework
- **Framework:** Express.js
- **Version:** 4.19.2+
- **Language:** Node.js 18.0+
- **Architecture:** Clean Architecture with modular design

## Database System
- **Primary:** PostgreSQL 17+
- **Development:** SQLite 5.1.7 (local development)
- **ORM:** Native SQL with custom query builders
- **Migrations:** Custom migration system

## JavaScript Framework
- **Frontend:** Vanilla JavaScript + ES6 Modules
- **Build Tool:** None (native ES modules)
- **Module System:** ES6 imports/exports

## Import Strategy
- **Strategy:** ES6 Modules (native)
- **Package Manager:** npm
- **Node Version:** 18.0+ LTS

## CSS Framework
- **Primary:** TailwindCSS 3.0+ (CDN)
- **Custom:** Swiss Corporate Design System
- **PostCSS:** No (using CDN approach)
- **Architecture:** CSS Variables + Custom Components

## UI Component Library
- **Library:** Custom Swiss Corporate Components
- **Icons:** SVG icons (inline)
- **Design System:** Swiss Banking Standards

## Fonts Provider
- **Provider:** Google Fonts
- **Primary Font:** Plus Jakarta Sans
- **Loading Strategy:** CDN with fallbacks

## Icon Library
- **Library:** Custom SVG Icons
- **Format:** Inline SVG elements
- **Style:** Swiss Corporate Icon Set

## Application Hosting
- **Primary:** Render.com
- **Alternative:** Railway.app
- **Region:** US East (closest to Europe)

## Database Hosting
- **Provider:** Render PostgreSQL
- **Alternative:** Railway PostgreSQL
- **Backups:** Automated daily

## Asset Hosting
- **Provider:** Application server (static files)
- **Strategy:** Express static middleware
- **CDN:** None (direct serving)

## Deployment Solution
- **Primary:** Render automatic deploys
- **CI/CD:** Git-based deployment
- **Environment:** Docker container

## Development Tools
- **Testing Framework:** Jest 29.7.0
- **Code Coverage:** Jest built-in
- **Linting:** ESLint 8.57.0
- **Process Manager:** Nodemon (development)

## Security Stack
- **Authentication:** JWT with bcryptjs
- **Rate Limiting:** express-rate-limit
- **Security Headers:** Helmet.js
- **CORS:** cors middleware
- **Validation:** Joi schema validation

## External Services
- **Email:** Nodemailer (SMTP)
- **File Upload:** Multer
- **Webhooks:** Custom n8n integration
- **Monitoring:** Custom health check endpoints

## Code Quality Standards
- **Max File Size:** 300 lines
- **Test Coverage:** 100% target (currently 30%+)
- **Architecture:** Controllers → Services → Models
- **Error Handling:** Centralized middleware