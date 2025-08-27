// Gesuch Controller - Production Version
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const textExtractor = require('../services/gesuch/text-extractor.service');
const config = require('../config/gesuch.config');
const { asyncHandler } = require('../middleware/error.middleware');

// Multer Setup
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../../', config.upload.storageDir);
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `gesuch-${unique}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.upload.allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF und Word-Dokumente sind erlaubt'));
    }
  }
}).single('gesuchFile');

// Upload und Verarbeitung
const uploadGesuch = asyncHandler(async (req, res) => {
  console.log('[Gesuch] Upload started');

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Keine Datei hochgeladen'
    });
  }

  const { jahr, titel, beschreibung } = req.body;
  const userId = req.user.id;

  console.log('[Gesuch] File received:', req.file.originalname);

  // Extract text from document
  const extraction = await textExtractor.extract(
    req.file.path,
    req.file.mimetype
  );

  // Save to database
  const gesuchResult = await db.query(
    `INSERT INTO gesuche (
        jahr, titel, beschreibung, datei_pfad, datei_name,
        datei_typ, datei_groesse, extrahierte_daten,
        status, bearbeitet_von, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
    [
      jahr || new Date().getFullYear(),
      titel || `Gesuch ${req.file.originalname}`,
      beschreibung || '',
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      JSON.stringify(extraction),
      extraction.success ? 'verarbeitet' : 'fehler',
      userId
    ]
  );

  const gesuch = gesuchResult.rows[0];
  console.log('[Gesuch] Saved to DB with ID:', gesuch.id);

  // Save Teilprojekte
  if (extraction.teilprojekte && extraction.teilprojekte.length > 0) {
    for (const tp of extraction.teilprojekte) {
      await db.query(
        `INSERT INTO gesuch_teilprojekte
           (gesuch_id, nummer, name, budget, automatisch_erkannt, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
        [gesuch.id, tp.nummer, tp.name, tp.budget || 0, tp.automatisch_erkannt]
      );
    }
    console.log(`[Gesuch] Saved ${extraction.teilprojekte.length} Teilprojekte`);
  }

  res.json({
    success: true,
    gesuch: {
      id: gesuch.id,
      titel: gesuch.titel,
      status: gesuch.status
    },
    extraction: {
      success: extraction.success,
      teilprojekte_count: extraction.teilprojekte ? extraction.teilprojekte.length : 0,
      teilprojekte: extraction.teilprojekte || [],
      metadata: extraction.metadata || {},
      language: extraction.language
    },
    message: extraction.success
      ? `${extraction.teilprojekte.length} Teilprojekte erkannt`
      : 'Dokument hochgeladen, automatische Erkennung fehlgeschlagen - bitte manuell hinzufügen'
  });
});

// Teilprojekte aktualisieren
const updateTeilprojekte = asyncHandler(async (req, res) => {
  const { gesuchId } = req.params;
  const { teilprojekte } = req.body;

  console.log(`[Gesuch] Updating Teilprojekte for Gesuch ${gesuchId}`);

  // Delete old entries
  await db.query('DELETE FROM gesuch_teilprojekte WHERE gesuch_id = $1', [gesuchId]);

  // Insert updated entries
  for (const tp of teilprojekte) {
    await db.query(
      `INSERT INTO gesuch_teilprojekte
         (gesuch_id, nummer, name, budget, manuell_korrigiert, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())`,
      [gesuchId, tp.nummer, tp.name, tp.budget || 0]
    );
  }

  // Update gesuch status
  await db.query(
    `UPDATE gesuche
       SET korrigierte_daten = $1, 
           status = 'korrigiert',
           updated_at = NOW()
       WHERE id = $2`,
    [JSON.stringify({ teilprojekte }), gesuchId]
  );

  res.json({
    success: true,
    message: `${teilprojekte.length} Teilprojekte aktualisiert`
  });
});

// Rapporte aus Gesuch erstellen
const createRapporte = asyncHandler(async (req, res) => {
  const { gesuchId } = req.params;

  console.log(`[Gesuch] Creating Rapporte for Gesuch ${gesuchId}`);

  // Get Gesuch
  const gesuchResult = await db.query(
    'SELECT * FROM gesuche WHERE id = $1',
    [gesuchId]
  );

  if (gesuchResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Gesuch nicht gefunden'
    });
  }

  const gesuch = gesuchResult.rows[0];

  // Get Teilprojekte
  const tpResult = await db.query(
    'SELECT * FROM gesuch_teilprojekte WHERE gesuch_id = $1',
    [gesuchId]
  );

  const teilprojekte = tpResult.rows;

  if (teilprojekte.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Keine Teilprojekte vorhanden'
    });
  }

  const created = [];

  // Create Rapport for each Teilprojekt
  for (const tp of teilprojekte) {
    const rapportResult = await db.query(
      `INSERT INTO rapporte
         (titel, beschreibung, status, benutzer_id, gesuch_id, teilprojekt_id, budget, created_at, updated_at)
         VALUES ($1, $2, 'entwurf', $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, titel`,
      [
        `${tp.name} - ${gesuch.jahr}`,
        `Rapport für Teilprojekt: ${tp.name}\nBudget: CHF ${tp.budget}\nAutomatisch erstellt aus Gesuch: ${gesuch.titel}`,
        req.user.id,
        gesuchId,
        tp.id,
        tp.budget
      ]
    );

    created.push(rapportResult.rows[0]);
  }

  // Update Gesuch status
  await db.query(
    `UPDATE gesuche
       SET status = 'rapporte_erstellt', 
           updated_at = NOW() 
       WHERE id = $1`,
    [gesuchId]
  );

  console.log(`[Gesuch] Created ${created.length} Rapporte`);

  res.json({
    success: true,
    message: `${created.length} Rapporte erfolgreich erstellt`,
    rapporte: created
  });
});

// Alle Gesuche abrufen
const getAllGesuche = asyncHandler(async (req, res) => {
  const result = await db.query(`
      SELECT g.*, 
             COUNT(gt.id) as teilprojekte_count,
             COALESCE(u.name, u.email) as bearbeiter
      FROM gesuche g
      LEFT JOIN gesuch_teilprojekte gt ON g.id = gt.gesuch_id
      LEFT JOIN users u ON g.bearbeitet_von = u.id
      GROUP BY g.id, u.name, u.email
      ORDER BY g.created_at DESC
    `);

  res.json({
    success: true,
    gesuche: result.rows
  });
});

// Einzelnes Gesuch mit Details
const getGesuchDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const gesuchResult = await db.query(
    'SELECT * FROM gesuche WHERE id = $1',
    [id]
  );

  if (gesuchResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Gesuch nicht gefunden'
    });
  }

  const teilprojekteResult = await db.query(
    'SELECT * FROM gesuch_teilprojekte WHERE gesuch_id = $1 ORDER BY nummer',
    [id]
  );

  res.json({
    success: true,
    gesuch: gesuchResult.rows[0],
    teilprojekte: teilprojekteResult.rows
  });
});

module.exports = {
  upload,
  uploadGesuch,
  updateTeilprojekte,
  createRapporte,
  getAllGesuche,
  getGesuchDetails
};