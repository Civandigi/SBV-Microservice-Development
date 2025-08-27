// Gesuch Controller - Production Version
const { query } = require('../config/database');
const microserviceClient = require('../services/gesuch-microservice.client');
const fallbackService = require('../services/gesuch-fallback.service');
const { asyncHandler } = require('../middleware/error.middleware');

class GesuchController {
    static upload = asyncHandler(async (req, res) => {
        try {
            const { jahr, titel, beschreibung } = req.body;
            const file = req.file;
            
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Keine Datei hochgeladen'
                });
            }
            
            // 1. Speichere Gesuch-Metadaten
            const gesuchResult = await query(`
                INSERT INTO gesuche 
                (jahr, titel, beschreibung, datei_name, datei_groesse, status, bearbeitet_von)
                VALUES (?, ?, ?, ?, ?, 'hochgeladen', ?)
            `, [jahr, titel, beschreibung, file.originalname, file.size, req.user.id]);
            
            const gesuchId = gesuchResult.lastID;
            
            // 2. Sende an Microservice
            const serviceResult = await microserviceClient.processGesuch(
                file.buffer,
                file.originalname,
                { gesuchId, jahr, titel }
            );
            
            if (serviceResult.jobId) {
                // 3. Update mit Job ID
                await query(
                    'UPDATE gesuche SET service_job_id = ?, status = ?, processing_started_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [serviceResult.jobId, 'verarbeitung', gesuchId]
                );
                
                res.json({
                    success: true,
                    gesuchId,
                    jobId: serviceResult.jobId,
                    status: 'processing',
                    message: 'Gesuch wird automatisch verarbeitet'
                });
            } else {
                // 4. Fallback zu manuell
                await query(
                    'UPDATE gesuche SET status = ? WHERE id = ?',
                    ['manuell', gesuchId]
                );
                
                res.json({
                    success: true,
                    gesuchId,
                    status: 'manual',
                    message: 'Bitte Teilprojekte manuell erfassen'
                });
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Upload fehlgeschlagen'
            });
        }
    });
    
    static checkStatus = asyncHandler(async (req, res) => {
        const { gesuchId } = req.params;
        
        const gesuch = await query(
            'SELECT * FROM gesuche WHERE id = ?',
            [gesuchId]
        );
        
        if (gesuch.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gesuch nicht gefunden'
            });
        }
        
        const gesuchData = gesuch[0];
        
        // Wenn Service Job vorhanden, prüfe Status
        if (gesuchData.service_job_id) {
            const jobStatus = await microserviceClient.getJobStatus(gesuchData.service_job_id);
            
            // Update lokalen Status basierend auf Service Status
            if (jobStatus.status === 'completed') {
                await query(
                    'UPDATE gesuche SET status = ?, processing_completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['abgeschlossen', gesuchId]
                );
                gesuchData.status = 'abgeschlossen';
            } else if (jobStatus.status === 'failed') {
                await query(
                    'UPDATE gesuche SET status = ?, service_error = ? WHERE id = ?',
                    ['fehler', jobStatus.message, gesuchId]
                );
                gesuchData.status = 'fehler';
                gesuchData.service_error = jobStatus.message;
            }
        }
        
        // Hole Teilprojekte
        const teilprojekte = await query(
            'SELECT * FROM teilprojekte WHERE gesuch_id = ? ORDER BY nummer',
            [gesuchId]
        );
        
        res.json({
            success: true,
            gesuch: gesuchData,
            teilprojekte,
            jobStatus: gesuchData.service_job_id ? await microserviceClient.getJobStatus(gesuchData.service_job_id) : null
        });
    });
    
    static createManualTeilprojekte = asyncHandler(async (req, res) => {
        const { gesuchId } = req.params;
        const { teilprojekte } = req.body;
        
        if (!teilprojekte || !Array.isArray(teilprojekte)) {
            return res.status(400).json({
                success: false,
                message: 'Teilprojekte müssen als Array übergeben werden'
            });
        }
        
        const result = await fallbackService.createManualTeilprojekte(gesuchId, teilprojekte);
        
        res.json({
            success: true,
            ...result
        });
    });
    
    static generateRapporte = asyncHandler(async (req, res) => {
        const { gesuchId } = req.params;
        const { teilprojektIds, settings = {} } = req.body;
        
        // Hole Teilprojekte
        const teilprojekte = await query(
            'SELECT * FROM teilprojekte WHERE gesuch_id = ? AND id IN (?)',
            [gesuchId, teilprojektIds.join(',')]
        );
        
        if (teilprojekte.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Keine Teilprojekte gefunden'
            });
        }
        
        // Versuche Service
        const serviceResult = await microserviceClient.generateRapporte(gesuchId, teilprojekte, settings);
        
        if (serviceResult.jobId) {
            res.json({
                success: true,
                jobId: serviceResult.jobId,
                status: 'processing',
                message: 'Rapporte werden automatisch generiert'
            });
        } else {
            // Fallback: Erstelle manuelle Rapporte
            const rapportResults = [];
            
            for (const teilprojekt of teilprojekte) {
                const rapportResult = await fallbackService.createManualRapport(teilprojekt.id, req.user.id);
                rapportResults.push(rapportResult);
            }
            
            res.json({
                success: true,
                status: 'manual',
                message: `${rapportResults.length} Rapporte manuell erstellt`,
                rapporte: rapportResults
            });
        }
    });
    
    static exportWord = asyncHandler(async (req, res) => {
        const { gesuchId } = req.params;
        const { rapportIds, format = 'docx' } = req.body;
        
        // Versuche Service
        const serviceResult = await microserviceClient.exportWord(rapportIds, gesuchId, format);
        
        if (serviceResult.jobId) {
            res.json({
                success: true,
                jobId: serviceResult.jobId,
                status: 'processing',
                message: 'Word-Dokument wird automatisch erstellt'
            });
        } else {
            // Fallback: Manueller Export
            const exportResult = await fallbackService.exportManualWord(rapportIds, gesuchId);
            
            res.json({
                success: true,
                ...exportResult
            });
        }
    });
    
    static checkExportStatus = asyncHandler(async (req, res) => {
        const { jobId } = req.params;
        
        // Prüfe Service Status
        const serviceStatus = await microserviceClient.getJobStatus(jobId);
        
        if (serviceStatus.status !== 'unknown') {
            res.json({
                success: true,
                ...serviceStatus
            });
        } else {
            // Prüfe manuellen Export
            const manualStatus = await fallbackService.getManualExportStatus(jobId);
            
            res.json({
                success: true,
                ...manualStatus
            });
        }
    });
    
    static listGesuche = asyncHandler(async (req, res) => {
        const gesuche = await query(`
            SELECT g.*, u.username as bearbeiter_name,
                   COUNT(t.id) as teilprojekt_count,
                   COUNT(r.id) as rapport_count
            FROM gesuche g
            LEFT JOIN users u ON g.bearbeitet_von = u.id
            LEFT JOIN teilprojekte t ON g.id = t.gesuch_id
            LEFT JOIN rapporte r ON t.id = r.teilprojekt_id
            GROUP BY g.id
            ORDER BY g.created_at DESC
        `);
        
        res.json({
            success: true,
            gesuche
        });
    });
    
    static getGesuchDetails = asyncHandler(async (req, res) => {
        const { gesuchId } = req.params;
        
        const gesuch = await query(
            'SELECT * FROM gesuche WHERE id = ?',
            [gesuchId]
        );
        
        if (gesuch.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gesuch nicht gefunden'
            });
        }
        
        const teilprojekte = await query(`
            SELECT t.*, COUNT(r.id) as rapport_count
            FROM teilprojekte t
            LEFT JOIN rapporte r ON t.id = r.teilprojekt_id
            WHERE t.gesuch_id = ?
            GROUP BY t.id
            ORDER BY t.nummer
        `, [gesuchId]);
        
        const rapporte = await query(`
            SELECT r.*, t.name as teilprojekt_name, t.nummer as teilprojekt_nummer
            FROM rapporte r
            JOIN teilprojekte t ON r.teilprojekt_id = t.id
            WHERE t.gesuch_id = ?
            ORDER BY t.nummer, r.created_at
        `, [gesuchId]);
        
        res.json({
            success: true,
            gesuch: gesuch[0],
            teilprojekte,
            rapporte
        });
    });
}

module.exports = {
    uploadGesuch: GesuchController.upload,
    updateTeilprojekte: GesuchController.createManualTeilprojekte,
    createRapporte: GesuchController.generateRapporte,
    getAllGesuche: GesuchController.listGesuche,
    getGesuchDetails: GesuchController.getGesuchDetails,
    exportWord: GesuchController.exportWord,
    checkStatus: GesuchController.checkStatus,
    checkExportStatus: GesuchController.checkExportStatus
};