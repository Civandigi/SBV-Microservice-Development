// SBV Professional V2 - Email Service
const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
    constructor() {
        this.initializeService();
    }
    
    async initializeService() {
        const emailService = process.env.EMAIL_SERVICE || 'smtp';
        
        if (emailService === 'mailgun' && process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
            // Initialize Mailgun
            try {
                const formData = require('form-data');
                const Mailgun = require('mailgun.js');
                const mailgun = new Mailgun(formData);
                
                this.mailgunClient = mailgun.client({
                    username: 'api',
                    key: process.env.MAILGUN_API_KEY,
                    url: process.env.MAILGUN_EU === 'true' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
                });
                
                this.mailgunDomain = process.env.MAILGUN_DOMAIN;
                this.serviceType = 'mailgun';
                this.enabled = true;
                console.log('✅ Mailgun email service initialized');
                console.log('   Domain:', this.mailgunDomain);
                console.log('   Region:', process.env.MAILGUN_EU === 'true' ? 'EU' : 'US');
            } catch (error) {
                console.error('❌ Mailgun initialization failed:', error);
                this.enabled = false;
            }
        } else if (config.email?.smtp?.host) {
            // Initialize SMTP
            this.transporter = nodemailer.createTransport({
                host: config.email.smtp.host,
                port: config.email.smtp.port,
                secure: config.email.smtp.secure,
                auth: {
                    user: config.email.smtp.user,
                    pass: config.email.smtp.pass
                }
            });
            
            this.serviceType = 'smtp';
            this.enabled = true;
            console.log('✅ SMTP email service initialized');
        } else {
            this.enabled = false;
            this.serviceType = 'none';
            console.log('⚠️ Email service disabled - no configuration found');
            console.log('   Configure either Mailgun or SMTP in .env file');
        }
    }

    // Send email
    async sendEmail(to, subject, html, text = null) {
        if (!this.enabled) {
            console.log('📧 Email service disabled - logging email instead:');
            console.log('   To:', to);
            console.log('   Subject:', subject);
            console.log('   Service Type:', this.serviceType);
            return { success: true, skipped: true, logged: true };
        }

        try {
            let result;
            
            if (this.serviceType === 'mailgun') {
                // Send via Mailgun API
                const messageData = {
                    from: process.env.MAILGUN_FROM || config.email.from,
                    to: [to],
                    subject: subject,
                    html: html,
                    text: text || this.htmlToText(html)
                };
                
                result = await this.mailgunClient.messages.create(this.mailgunDomain, messageData);
                console.log('✅ Email sent via Mailgun:', result.id);
                
                return {
                    success: true,
                    messageId: result.id,
                    service: 'mailgun'
                };
            } else {
                // Send via SMTP
                const mailOptions = {
                    from: config.email.from,
                    to,
                    subject,
                    html,
                    text: text || this.htmlToText(html)
                };

                result = await this.transporter.sendMail(mailOptions);
                console.log('✅ Email sent via SMTP:', result.messageId);
                
                return {
                    success: true,
                    messageId: result.messageId,
                    service: 'smtp'
                };
            }
        } catch (error) {
            console.error('❌ Email send error:', error);
            console.error('   Service:', this.serviceType);
            console.error('   To:', to);
            console.error('   Subject:', subject);
            return {
                success: false,
                error: error.message,
                service: this.serviceType
            };
        }
    }

    // Convert HTML to plain text (basic implementation)
    htmlToText(html) {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }

    // Email Templates
    async sendWelcomeEmail(user) {
        const subject = 'Willkommen bei SBV Professional';
        const html = `
            <h2>Willkommen bei SBV Professional, ${user.username}!</h2>
            <p>Ihr Konto wurde erfolgreich erstellt.</p>
            <p><strong>Ihre Anmeldedaten:</strong></p>
            <ul>
                <li>Benutzername: ${user.username}</li>
                <li>E-Mail: ${user.email}</li>
                <li>Rolle: ${this.getRoleName(user.role)}</li>
            </ul>
            <p>Sie können sich hier anmelden: <a href="${config.app.url}/login.html">${config.app.url}</a></p>
            <p>Bei Fragen wenden Sie sich bitte an Ihren Administrator.</p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</small></p>
        `;

        return this.sendEmail(user.email, subject, html);
    }

    async sendPasswordResetEmail(user, newPassword) {
        const subject = 'Ihr Passwort wurde zurückgesetzt - SBV Professional';
        const html = `
            <h2>Passwort zurückgesetzt</h2>
            <p>Hallo ${user.username},</p>
            <p>Ihr Passwort wurde von einem Administrator zurückgesetzt.</p>
            <p><strong>Ihr neues Passwort:</strong> ${newPassword}</p>
            <p>Bitte ändern Sie dieses Passwort nach Ihrer ersten Anmeldung.</p>
            <p>Anmelden: <a href="${config.app.url}/login.html">${config.app.url}</a></p>
            <hr>
            <p><small>Wenn Sie diese Änderung nicht angefordert haben, kontaktieren Sie bitte sofort Ihren Administrator.</small></p>
        `;

        return this.sendEmail(user.email, subject, html);
    }

    async sendRapportStatusEmail(rapport, user, newStatus) {
        const statusText = this.getStatusText(newStatus);
        const subject = `Rapport-Status geändert: ${statusText} - SBV Professional`;
        
        const html = `
            <h2>Rapport-Status Update</h2>
            <p>Hallo ${user.username},</p>
            <p>Der Status Ihres Rapports wurde geändert:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Titel:</td>
                    <td style="padding: 8px;">${rapport.title}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Neuer Status:</td>
                    <td style="padding: 8px;"><strong style="color: ${this.getStatusColor(newStatus)}">${statusText}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Geändert am:</td>
                    <td style="padding: 8px;">${new Date().toLocaleString('de-CH')}</td>
                </tr>
            </table>
            <p>Sie können Ihren Rapport hier einsehen: <a href="${config.app.url}/rapport.html">${config.app.url}</a></p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch generiert.</small></p>
        `;

        return this.sendEmail(user.email, subject, html);
    }

    async sendGesuchSubmittedEmail(gesuch, recipients) {
        const subject = `Gesuch eingereicht: ${gesuch.jahr} - ${gesuch.titel}`;
        
        const html = `
            <h2>Gesuch wurde eingereicht</h2>
            <p>Ein neues Gesuch wurde zur Prüfung eingereicht:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Jahr:</td>
                    <td style="padding: 8px;">${gesuch.jahr}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Titel:</td>
                    <td style="padding: 8px;">${gesuch.titel}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Anzahl Teilprojekte:</td>
                    <td style="padding: 8px;">${gesuch.anzahl_teilprojekte || 0}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Eingereicht am:</td>
                    <td style="padding: 8px;">${new Date().toLocaleString('de-CH')}</td>
                </tr>
            </table>
            <p>Bitte prüfen Sie das Gesuch im Admin-Bereich: <a href="${config.app.url}/gesuch-verwaltung.html">${config.app.url}</a></p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch generiert.</small></p>
        `;

        // Send to all recipients
        const results = await Promise.all(
            recipients.map(email => this.sendEmail(email, subject, html))
        );

        return {
            success: results.every(r => r.success),
            results
        };
    }

    async sendTeilprojektApprovedEmail(teilprojekt, user) {
        const subject = `Teilprojekt genehmigt: ${teilprojekt.name}`;
        
        const html = `
            <h2>Teilprojekt wurde genehmigt</h2>
            <p>Hallo ${user.username},</p>
            <p>Ihr Teilprojekt wurde genehmigt:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Teilprojekt:</td>
                    <td style="padding: 8px;">${teilprojekt.name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Gesuch:</td>
                    <td style="padding: 8px;">${teilprojekt.gesuch_jahr} - ${teilprojekt.gesuch_titel}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Budget:</td>
                    <td style="padding: 8px;">CHF ${teilprojekt.budget?.toLocaleString('de-CH') || '0'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Genehmigt am:</td>
                    <td style="padding: 8px;">${new Date().toLocaleString('de-CH')}</td>
                </tr>
            </table>
            <p>Sie können nun mit der Umsetzung beginnen.</p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch generiert.</small></p>
        `;

        return this.sendEmail(user.email, subject, html);
    }

    // Send rapport request notification
    async sendRapportRequest({ to, userName, teilprojekt, deadline, description }) {
        const subject = `Neue Rapport-Anforderung: ${teilprojekt}`;
        
        const deadlineDate = new Date(deadline);
        const formattedDeadline = deadlineDate.toLocaleDateString('de-CH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const html = `
            <h2>Neue Rapport-Anforderung</h2>
            <p>Hallo ${userName},</p>
            <p>Sie haben eine neue Rapport-Anforderung erhalten:</p>
            <table style="border: 1px solid #ddd; border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 8px; font-weight: bold;">Teilprojekt:</td>
                    <td style="padding: 8px;">${teilprojekt}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Deadline:</td>
                    <td style="padding: 8px; color: #dc2626;"><strong>${formattedDeadline}</strong></td>
                </tr>
                ${description ? `
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 8px; font-weight: bold;">Beschreibung:</td>
                    <td style="padding: 8px;">${description}</td>
                </tr>
                ` : ''}
            </table>
            <p><strong>Bitte erstellen Sie den angeforderten Rapport bis zur angegebenen Deadline.</strong></p>
            <p>
                <a href="${config.app.url}/rapport" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Rapport erstellen
                </a>
            </p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch generiert.</small></p>
        `;
        
        return this.sendEmail(to, subject, html);
    }
    
    // Send deadline reminder
    async sendDeadlineReminder({ to, userName, teilprojekt, deadline, description }) {
        const deadlineDate = new Date(deadline);
        const daysRemaining = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
        
        const subject = `⚠️ Erinnerung: Rapport-Deadline in ${daysRemaining} Tagen`;
        
        const formattedDeadline = deadlineDate.toLocaleDateString('de-CH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const urgencyColor = daysRemaining <= 1 ? '#dc2626' : '#f59e0b';
        
        const html = `
            <h2 style="color: ${urgencyColor};">⚠️ Deadline-Erinnerung</h2>
            <p>Hallo ${userName},</p>
            <p><strong>Ihre Rapport-Deadline läuft in ${daysRemaining} Tag${daysRemaining !== 1 ? 'en' : ''} ab!</strong></p>
            <table style="border: 1px solid #ddd; border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 8px; font-weight: bold;">Teilprojekt:</td>
                    <td style="padding: 8px;">${teilprojekt}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold;">Deadline:</td>
                    <td style="padding: 8px; color: ${urgencyColor};"><strong>${formattedDeadline}</strong></td>
                </tr>
                ${description ? `
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 8px; font-weight: bold;">Beschreibung:</td>
                    <td style="padding: 8px;">${description}</td>
                </tr>
                ` : ''}
            </table>
            <p style="color: ${urgencyColor}; font-weight: bold;">
                Bitte erstellen Sie den Rapport umgehend, um die Deadline einzuhalten.
            </p>
            <p>
                <a href="${config.app.url}/rapport" style="background-color: ${urgencyColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Jetzt Rapport erstellen
                </a>
            </p>
            <hr>
            <p><small>Diese E-Mail wurde automatisch generiert.</small></p>
        `;
        
        return this.sendEmail(to, subject, html);
    }
    
    // Helper methods
    getRoleName(role) {
        const roleNames = {
            'user': 'Benutzer',
            'admin': 'Administrator',
            'superadmin': 'Super Administrator'
        };
        return roleNames[role] || role;
    }

    getStatusText(status) {
        const statusTexts = {
            'entwurf': 'Entwurf',
            'eingereicht': 'Eingereicht',
            'in_bearbeitung': 'In Bearbeitung',
            'genehmigt': 'Genehmigt',
            'abgelehnt': 'Abgelehnt',
            'offen': 'Offen',
            'abgeschlossen': 'Abgeschlossen'
        };
        return statusTexts[status] || status;
    }

    getStatusColor(status) {
        const colors = {
            'genehmigt': '#22c55e',
            'abgelehnt': '#ef4444',
            'eingereicht': '#3b82f6',
            'in_bearbeitung': '#f59e0b'
        };
        return colors[status] || '#6b7280';
    }
}

// Export singleton instance
module.exports = new EmailService();