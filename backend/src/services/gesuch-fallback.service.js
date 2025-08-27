const { query } = require('../config/database');

class GesuchFallbackService {
    // Wenn Microservice nicht verfügbar
    async createManualGesuch(data) {
        try {
            // Erstelle Gesuch ohne automatische Verarbeitung
            const result = await query(`
                INSERT INTO gesuche 
                (jahr, titel, beschreibung, status, erstellt_von)
                VALUES (?, ?, ?, 'entwurf', ?)
            `, [data.jahr, data.titel, data.beschreibung, data.userId]);
            
            return {
                gesuchId: result.lastID,
                mode: 'manual',
                message: 'Bitte Teilprojekte manuell erfassen'
            };
        } catch (error) {
            console.error('Manual gesuch creation failed:', error);
            throw error;
        }
    }
    
    async createManualTeilprojekte(gesuchId, teilprojekte) {
        try {
            for (const tp of teilprojekte) {
                await query(`
                    INSERT INTO teilprojekte 
                    (gesuch_id, nummer, name, budget, status, beschreibung)
                    VALUES (?, ?, ?, ?, 'offen', ?)
                `, [gesuchId, tp.nummer, tp.name, tp.budget, tp.beschreibung || '']);
            }
            
            return {
                success: true,
                count: teilprojekte.length,
                message: `${teilprojekte.length} Teilprojekte manuell erstellt`
            };
        } catch (error) {
            console.error('Manual teilprojekte creation failed:', error);
            throw error;
        }
    }
    
    async generateBasicRapportTemplate(teilprojekt) {
        // Einfaches Template ohne Service
        return {
            titel: `Rapport für ${teilprojekt.name}`,
            beschreibung: `Bitte ausfüllen für Teilprojekt ${teilprojekt.nummer}`,
            felder: this.getDefaultFields(),
            teilprojekt_id: teilprojekt.id
        };
    }
    
    getDefaultFields() {
        return [
            { 
                key: 'ziele', 
                label: 'Projektziele', 
                type: 'textarea',
                required: true,
                placeholder: 'Beschreiben Sie die Ziele des Teilprojekts'
            },
            { 
                key: 'massnahmen', 
                label: 'Durchgeführte Maßnahmen', 
                type: 'textarea',
                required: true,
                placeholder: 'Beschreiben Sie die durchgeführten Maßnahmen'
            },
            { 
                key: 'ergebnisse', 
                label: 'Ergebnisse', 
                type: 'textarea',
                required: true,
                placeholder: 'Beschreiben Sie die erzielten Ergebnisse'
            },
            { 
                key: 'budget', 
                label: 'Budgetverwendung (CHF)', 
                type: 'number',
                required: true,
                placeholder: '0.00'
            },
            { 
                key: 'bemerkungen', 
                label: 'Bemerkungen', 
                type: 'textarea',
                required: false,
                placeholder: 'Zusätzliche Bemerkungen'
            }
        ];
    }
    
    async createManualRapport(teilprojektId, userId) {
        try {
            const template = await this.generateBasicRapportTemplate({ 
                id: teilprojektId, 
                name: 'Teilprojekt', 
                nummer: 'TP' 
            });
            
            const result = await query(`
                INSERT INTO rapporte 
                (teilprojekt_id, titel, beschreibung, status, author_id)
                VALUES (?, ?, ?, 'entwurf', ?)
            `, [teilprojektId, template.titel, template.beschreibung, userId]);
            
            // Felder werden in der Frontend-Anwendung definiert
            // Keine separate rapport_felder Tabelle benötigt
            
            return {
                rapportId: result.lastID,
                template: template,
                message: 'Rapport-Template manuell erstellt'
            };
        } catch (error) {
            console.error('Manual rapport creation failed:', error);
            throw error;
        }
    }
    
    async exportManualWord(rapportIds, gesuchId) {
        try {
            // Einfacher Export ohne Service
            const exportData = {
                gesuchId,
                rapportIds,
                format: 'docx',
                timestamp: new Date().toISOString(),
                mode: 'manual'
            };
            
            // Track export
            const result = await query(`
                INSERT INTO document_exports 
                (gesuch_id, job_id, download_url, expires_at)
                VALUES (?, ?, ?, ?)
            `, [
                gesuchId, 
                `manual-${Date.now()}`, 
                `/api/exports/manual-${Date.now()}.docx`,
                new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Stunden
            ]);
            
            return {
                jobId: `manual-${Date.now()}`,
                status: 'manual',
                message: 'Word-Export manuell verfügbar',
                downloadUrl: `/api/exports/manual-${Date.now()}.docx`
            };
        } catch (error) {
            console.error('Manual word export failed:', error);
            throw error;
        }
    }
    
    async getManualExportStatus(jobId) {
        try {
            const exportData = await query(`
                SELECT * FROM document_exports WHERE job_id = ?
            `, [jobId]);
            
            if (exportData.length === 0) {
                return { status: 'not_found' };
            }
            
            const exportRecord = exportData[0];
            const now = new Date();
            const expiresAt = new Date(exportRecord.expires_at);
            
            if (now > expiresAt) {
                return { status: 'expired' };
            }
            
            return {
                status: 'ready',
                downloadUrl: exportRecord.download_url,
                expiresAt: exportRecord.expires_at
            };
        } catch (error) {
            console.error('Manual export status check failed:', error);
            return { status: 'error' };
        }
    }
}

module.exports = new GesuchFallbackService();
