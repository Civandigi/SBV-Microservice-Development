/**
 * Template Management - Produktionsreifes Template-System
 * Lädt alle Templates dynamisch aus der Datenbank
 */

// API Configuration - nutze globale Variable aus config.js
// Fallback auf location.origin falls config.js nicht geladen wurde

// Template Cache
let templateCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten Cache

/**
 * Lädt alle Templates von der API
 */
async function loadTemplatesFromAPI() {
  try {
    // Cache verwenden wenn noch gültig
    if (templateCache && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      return templateCache;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Kein Auth-Token gefunden');
      return {};
    }
    
    const response = await fetch(`${window.API_BASE_URL || ''}/api/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.templates) {
      // Templates in Object-Format konvertieren für einfachen Zugriff
      const templatesObject = {};
      data.templates.forEach(template => {
        templatesObject[template.teilprojekt] = {
          id: template.id,
          name: template.template_name,
          ...template.template_data
        };
      });
      
      // Cache aktualisieren
      templateCache = templatesObject;
      lastFetchTime = Date.now();
      
      console.log(`✅ ${data.count} Templates aus Datenbank geladen`);
      return templatesObject;
    }
    
    throw new Error('Ungültige API-Antwort');
    
  } catch (error) {
    console.error('Fehler beim Laden der Templates:', error);
    
    // Fallback: Leeres Object wenn API nicht erreichbar
    return {};
  }
}

/**
 * Lädt ein spezifisches Template
 */
async function loadSpecificTemplate(teilprojekt) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Kein Auth-Token gefunden');
      return null;
    }
    
    const response = await fetch(`${window.API_BASE_URL || ''}/api/templates/${teilprojekt}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.template) {
      return {
        id: data.template.id,
        name: data.template.template_name,
        ...data.template.template_data
      };
    }
    
    return null;
    
  } catch (error) {
    console.error(`Fehler beim Laden des Templates ${teilprojekt}:`, error);
    return null;
  }
}

/**
 * Berechnet das Gesamtbudget aller Templates
 */
async function calculateTotalBudget() {
  const templates = await loadTemplatesFromAPI();
  
  if (!templates || Object.keys(templates).length === 0) {
    return 0;
  }
  
  return Object.values(templates).reduce((sum, template) => {
    return sum + (template.gesamtbudget || 0);
  }, 0);
}

/**
 * Rendert Template-Cards für die Übersicht
 */
async function renderTemplateCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Loading State
  container.innerHTML = '<div class="text-center py-8">Templates werden geladen...</div>';
  
  try {
    const templates = await loadTemplatesFromAPI();
    
    if (!templates || Object.keys(templates).length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">Keine Templates gefunden</div>';
      return;
    }
    
    // Template Cards generieren
    let cardsHTML = '';
    Object.entries(templates).forEach(([key, template]) => {
      const budget = template.gesamtbudget || 0;
      const formattedBudget = new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 0
      }).format(budget);
      
      cardsHTML += `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow template-card" 
             data-teilprojekt="${key}">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-gray-900">${template.name}</h3>
            <span class="text-sm font-medium text-blue-600">${formattedBudget}</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">${template.beschreibung || ''}</p>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Maßnahmen:</span>
              <span class="font-medium ml-2">${template.massnahmen ? template.massnahmen.length : 0}</span>
            </div>
            <div>
              <span class="text-gray-500">KPIs:</span>
              <span class="font-medium ml-2">${template.kpis ? template.kpis.length : 0}</span>
            </div>
          </div>
          <button onclick="createRapportFromTemplate('${key}')" 
                  class="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
            Rapport erstellen
          </button>
        </div>
      `;
    });
    
    container.innerHTML = cardsHTML;
    
  } catch (error) {
    console.error('Fehler beim Rendern der Template-Cards:', error);
    container.innerHTML = '<div class="text-center py-8 text-red-500">Fehler beim Laden der Templates</div>';
  }
}

/**
 * Lädt Template-Daten in ein Formular
 */
async function loadTemplateIntoForm(teilprojekt, formPrefix = '') {
  try {
    const template = await loadSpecificTemplate(teilprojekt);
    
    if (!template) {
      console.error(`Template ${teilprojekt} nicht gefunden`);
      return false;
    }
    
    // Formularfelder füllen
    const nameField = document.getElementById(`${formPrefix}teilprojektName`);
    const budgetField = document.getElementById(`${formPrefix}teilprojektBudget`);
    const beschreibungField = document.getElementById(`${formPrefix}teilprojektBeschreibung`);
    
    if (nameField) nameField.value = template.name;
    if (budgetField) budgetField.value = template.gesamtbudget;
    if (beschreibungField) beschreibungField.value = template.beschreibung;
    
    // Maßnahmen laden
    if (template.massnahmen && template.massnahmen.length > 0) {
      const massnahmenContainer = document.getElementById(`${formPrefix}massnahmenContainer`);
      if (massnahmenContainer) {
        massnahmenContainer.innerHTML = '';
        template.massnahmen.forEach(massnahme => {
          addMassnahmeRow(massnahme, formPrefix);
        });
      }
    }
    
    // KPIs laden
    if (template.kpis && template.kpis.length > 0) {
      const kpiContainer = document.getElementById(`${formPrefix}kpiContainer`);
      if (kpiContainer) {
        kpiContainer.innerHTML = '';
        template.kpis.forEach(kpi => {
          addKPIRow(kpi, formPrefix);
        });
      }
    }
    
    console.log(`✅ Template ${template.name} in Formular geladen`);
    return true;
    
  } catch (error) {
    console.error('Fehler beim Laden des Templates ins Formular:', error);
    return false;
  }
}

/**
 * Cache leeren (z.B. nach Template-Update)
 */
function clearTemplateCache() {
  templateCache = null;
  lastFetchTime = null;
  console.log('Template-Cache geleert');
}

/**
 * Erstellt einen neuen Rapport basierend auf einem Template
 */
async function createRapportFromTemplate(teilprojekt) {
  try {
    const template = await loadSpecificTemplate(teilprojekt);
    
    if (!template) {
      showNotification('Template konnte nicht geladen werden', 'error');
      return;
    }
    
    // Neuer Rapport Modal öffnen und Template-Daten laden
    openNewRapportModal();
    
    // Template-Daten ins Formular laden
    setTimeout(() => {
      loadTemplateIntoForm(teilprojekt);
    }, 100);
    
  } catch (error) {
    console.error('Fehler beim Erstellen des Rapports:', error);
    showNotification('Fehler beim Erstellen des Rapports', 'error');
  }
}

// Helper-Funktionen für Maßnahmen und KPIs
function addMassnahmeRow(massnahme, formPrefix = '') {
  // Implementation abhängig von der spezifischen Formular-Struktur
  console.log('Maßnahme hinzugefügt:', massnahme);
}

function addKPIRow(kpi, formPrefix = '') {
  // Implementation abhängig von der spezifischen Formular-Struktur
  console.log('KPI hinzugefügt:', kpi);
}

// Export für andere Module
window.TemplateManager = {
  loadTemplatesFromAPI,
  loadSpecificTemplate,
  calculateTotalBudget,
  renderTemplateCards,
  loadTemplateIntoForm,
  clearTemplateCache,
  createRapportFromTemplate
};