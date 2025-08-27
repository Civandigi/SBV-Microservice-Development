// Text Extractor Service - Production Version
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const { franc } = require('franc');
const config = require('../../config/gesuch.config');

class TextExtractorService {
  async extract(filePath, mimeType) {
    console.log(`[TextExtractor] Starting extraction for: ${filePath}`);
    
    try {
      // 1. Raw Text Extraction
      let rawText = '';
      
      if (mimeType.includes('pdf')) {
        rawText = await this.extractPDF(filePath);
      } else if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('openxmlformats')) {
        rawText = await this.extractWord(filePath);
      } else if (mimeType.includes('text') || filePath.endsWith('.txt')) {
        rawText = (await fs.readFile(filePath, 'utf8')).toString();
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
      
      console.log(`[TextExtractor] Extracted ${rawText.length} characters`);
      
      // 2. Language Detection
      const language = franc(rawText.substring(0, 1000));
      console.log(`[TextExtractor] Detected language: ${language}`);
      
      // 3. Parse Structure
      const structured = await this.parseStructure(rawText);
      
      return {
        success: true,
        text: rawText.substring(0, 5000),
        language,
        teilprojekte: structured.teilprojekte,
        metadata: structured.metadata
      };
      
    } catch (error) {
      console.error('[TextExtractor] Error:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        teilprojekte: [],
        metadata: {}
      };
    }
  }
  
  async extractPDF(filePath) {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  
  async extractWord(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  
  async parseStructure(text) {
    const teilprojekte = [];
    const metadata = {};
    
    // Find Jahr
    const yearMatch = text.match(/20\d{2}/);
    if (yearMatch) metadata.jahr = yearMatch[0];
    
    // Find Antragsteller
    const antragMatch = config.extraction.patterns.antragsteller.exec(text);
    if (antragMatch) {
      metadata.antragsteller = antragMatch[1].trim();
    }
    
    // Find Teilprojekte
    for (const pattern of config.extraction.patterns.teilprojekt) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(text)) !== null) {
        const nummer = match[1];
        const name = match[2].trim();
        
        // Find budget nearby (next 500 characters)
        const contextStart = match.index;
        const contextEnd = Math.min(contextStart + 500, text.length);
        const context = text.substring(contextStart, contextEnd);
        
        let budget = 0;
        for (const budgetPattern of config.extraction.patterns.budget) {
          budgetPattern.lastIndex = 0; // Reset regex
          const budgetMatch = budgetPattern.exec(context);
          if (budgetMatch) {
            // Swiss format (1'000.00) to number
            budget = parseFloat(
              budgetMatch[1].replace(/'/g, '').replace(/,/g, '.')
            );
            break;
          }
        }
        
        // Avoid duplicates
        const exists = teilprojekte.find(tp => 
          tp.nummer === `TP${nummer}` || 
          (tp.name === name && name.length > 3)
        );
        
        if (!exists && name.length > 3) {
          teilprojekte.push({
            nummer: `TP${nummer}`,
            name: this.cleanProjectName(name),
            budget: budget || 0,
            automatisch_erkannt: true
          });
        }
      }
    }
    
    // Fallback if no projects found
    if (teilprojekte.length === 0) {
      teilprojekte.push(...this.fallbackExtraction(text));
    }
    
    console.log(`[TextExtractor] Found ${teilprojekte.length} projects`);
    return { teilprojekte, metadata };
  }
  
  cleanProjectName(name) {
    return name
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-äöüÄÖÜß.,]/gi, '')
      .trim()
      .substring(0, 200);
  }
  
  fallbackExtraction(text) {
    const teilprojekte = [];
    const lines = text.split('\n');
    let sectionCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for numbered lists
      if (/^(\d+)[\.\)]\s+(.+)/.test(line)) {
        const match = line.match(/^(\d+)[\.\)]\s+(.+)/);
        if (match) {
          sectionCount++;
          const name = match[2].trim();
          
          // Look for budget in next few lines
          let budget = 0;
          for (let j = i; j < Math.min(i + 5, lines.length); j++) {
            for (const pattern of config.extraction.patterns.budget) {
              pattern.lastIndex = 0;
              const budgetMatch = pattern.exec(lines[j]);
              if (budgetMatch) {
                budget = parseFloat(
                  budgetMatch[1].replace(/'/g, '').replace(/,/g, '.')
                );
                break;
              }
            }
            if (budget > 0) break;
          }
          
          if (name.length > 3 && name.length < 200) {
            teilprojekte.push({
              nummer: `TP${sectionCount}`,
              name: this.cleanProjectName(name),
              budget: budget || 0,
              automatisch_erkannt: false
            });
          }
        }
      }
    }
    
    return teilprojekte;
  }
}

module.exports = new TextExtractorService();