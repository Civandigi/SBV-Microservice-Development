// SBV Professional V2 - Frontend Configuration

// Backend URL - nutzt die gleiche Domain wie das Frontend
window.API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8082'
  : ''; // Leer bedeutet: nutze die gleiche Domain

// Für Render.com deployment - Backend und Frontend laufen auf dem gleichen Service
if (window.location.hostname.includes('onrender.com')) {
  window.API_BASE_URL = ''; // Nutze relative URLs
}

// Wenn Frontend und Backend auf dem gleichen Port laufen (wie jetzt auf 8082)
if (window.location.port === '8082') {
  window.API_BASE_URL = ''; // Nutze relative URLs, da alles über den gleichen Server läuft
}