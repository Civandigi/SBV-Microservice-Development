// Gesuch Configuration
module.exports = {
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.pdf', '.docx', '.doc', '.txt'],
    tempDir: 'uploads/temp',
    storageDir: 'uploads/gesuche'
  },
  extraction: {
    patterns: {
      teilprojekt: [
        /Teilprojekt\s*(\d+)[:\s]*(.*?)(?=\n|$)/gi,
        /TP\s*(\d+)[:\s]*(.*?)(?=\n|$)/gi,
        /Projekt\s*(\d+)[:\s]*(.*?)(?=\n|$)/gi,
        /Massnahme\s*(\d+)[:\s]*(.*?)(?=\n|$)/gi
      ],
      budget: [
        /CHF\s*([\d']+(?:\.\d{2})?)/gi,
        /Fr\.\s*([\d']+(?:\.\d{2})?)/gi,
        /([\d']+(?:\.\d{2})?)\s*(?:CHF|Fr\.)/gi,
        /Budget[:\s]*([\d']+(?:\.\d{2})?)/gi
      ],
      jahr: /20\d{2}/g,
      antragsteller: /Antragsteller[:\s]*(.*?)(?=\n|$)/gi
    },
    languages: ['de', 'fr', 'it']
  }
};