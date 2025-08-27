/**
 * Template Routes - Produktionsreife API für Rapport-Templates
 * Dynamisches Laden aller Templates aus der Datenbank
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * GET /api/templates/test
 * TEST ROUTE - Keine Auth
 */
router.get('/test', async (req, res) => {
  try {
    const sql = `
      SELECT teilprojekt, template_name, aktiv 
      FROM rapport_templates 
      ORDER BY teilprojekt
    `;
    
    const result = await query(sql);
    
    res.json({
      success: true,
      message: 'TEST ROUTE - Templates aus DB',
      count: result.rows.length,
      templates: result.rows
    });
    
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({
      success: false,
      message: 'Test Route Error',
      error: error.message
    });
  }
});

/**
 * GET /api/templates
 * Alle aktiven Rapport-Templates abrufen
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        teilprojekt,
        template_name,
        template_data,
        aktiv,
        erstellt_am,
        aktualisiert_am
      FROM rapport_templates
      WHERE aktiv = true
      ORDER BY teilprojekt ASC
    `;
    
    const result = await query(sql);
    
    res.json({
      success: true,
      count: result.rows.length,
      templates: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Templates',
      error: error.message
    });
  }
});

/**
 * GET /api/templates/:teilprojekt
 * Ein spezifisches Template abrufen
 */
router.get('/:teilprojekt', authenticateToken, async (req, res) => {
  try {
    const { teilprojekt } = req.params;
    
    const query = `
      SELECT 
        id,
        teilprojekt,
        template_name,
        template_data,
        aktiv
      FROM rapport_templates
      WHERE teilprojekt = $1 AND aktiv = true
    `;
    
    const result = await pool.query(query, [teilprojekt]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template nicht gefunden'
      });
    }
    
    res.json({
      success: true,
      template: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Templates',
      error: error.message
    });
  }
});

/**
 * PUT /api/templates/:id
 * Template aktualisieren (nur Admin/Super Admin)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Nur Admin und Super Admin dürfen Templates ändern
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Keine Berechtigung zum Ändern von Templates'
      });
    }
    
    const { id } = req.params;
    const { template_name, template_data } = req.body;
    
    const query = `
      UPDATE rapport_templates
      SET 
        template_name = COALESCE($1, template_name),
        template_data = COALESCE($2, template_data),
        aktualisiert_am = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      template_name,
      template_data ? JSON.stringify(template_data) : null,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template nicht gefunden'
      });
    }
    
    res.json({
      success: true,
      message: 'Template erfolgreich aktualisiert',
      template: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Templates',
      error: error.message
    });
  }
});

/**
 * POST /api/templates
 * Neues Template erstellen (nur Super Admin)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Nur Super Admin darf neue Templates erstellen
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Nur Super Admins können neue Templates erstellen'
      });
    }
    
    const { teilprojekt, template_name, template_data } = req.body;
    
    // Validierung
    if (!teilprojekt || !template_name || !template_data) {
      return res.status(400).json({
        success: false,
        message: 'Teilprojekt, Template-Name und Template-Daten sind erforderlich'
      });
    }
    
    const query = `
      INSERT INTO rapport_templates (teilprojekt, template_name, template_data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      teilprojekt,
      template_name,
      JSON.stringify(template_data)
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Template erfolgreich erstellt',
      template: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating template:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Ein Template mit diesem Teilprojekt existiert bereits'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Templates',
      error: error.message
    });
  }
});

/**
 * DELETE /api/templates/:id
 * Template deaktivieren (nicht löschen, nur Super Admin)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Nur Super Admins können Templates deaktivieren'
      });
    }
    
    const { id } = req.params;
    
    // Soft delete - nur deaktivieren
    const query = `
      UPDATE rapport_templates
      SET 
        aktiv = false,
        aktualisiert_am = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, teilprojekt, template_name
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template nicht gefunden'
      });
    }
    
    res.json({
      success: true,
      message: 'Template erfolgreich deaktiviert',
      deactivated: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error deactivating template:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Deaktivieren des Templates',
      error: error.message
    });
  }
});

module.exports = router;