import * as XLSX from 'xlsx';

/**
 * Reads solar panel data from a spreadsheet file
 * @param {File} file - The spreadsheet file to read
 * @returns {Promise<Object>} - Object mapping addresses to solar panel data
 */
export const readSpreadsheet = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let workbook;
        const fileName = file.name.toLowerCase();
        
        // Handle CSV files differently
        if (fileName.endsWith('.csv')) {
          const text = e.target.result;
          workbook = XLSX.read(text, { type: 'string', csv: true });
        } else {
          const data = new Uint8Array(e.target.result);
          workbook = XLSX.read(data, { type: 'array' });
        }
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Create a map of address to solar panel data
        const addressMap = {};
        jsonData.forEach((row) => {
          // Normalize address for matching (case-insensitive)
          const addressKey = (row.Address || row.address || '').toLowerCase().trim();
          if (addressKey) {
            addressMap[addressKey] = {
              panels: row.Panels || row.panels || row['Number of Panels'] || row['Number of panels'],
              capacity: row.Capacity || row.capacity || row['Total Capacity (kW)'],
              installationDate: row['Installation Date'] || row['Installation date'] || row.installationDate,
            };
          }
        });
        
        resolve(addressMap);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    // Use appropriate reading method based on file type
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Loads spreadsheet from a URL (for public files or Google Sheets)
 * @param {string} url - URL to the spreadsheet file or Google Sheets export URL
 * @returns {Promise<Object>} - Object mapping addresses to solar panel data
 */
export const loadSpreadsheetFromUrl = async (url) => {
  try {
    // Convert Google Sheets URL to CSV export URL if needed
    let exportUrl = url;
    if (url.includes('docs.google.com/spreadsheets/d/')) {
      const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (sheetId) {
        exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
    }
    
    const response = await fetch(exportUrl);
    let workbook;
    
    // Handle CSV files differently
    if (exportUrl.toLowerCase().includes('.csv') || exportUrl.includes('format=csv')) {
      const text = await response.text();
      workbook = XLSX.read(text, { type: 'string', csv: true });
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      workbook = XLSX.read(data, { type: 'array' });
    }
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Helper function to normalize address (same as in App.jsx)
    const normalizeAddress = (addr) => {
      return addr
        .replace(/^["']|["']$/g, '') // Remove quotes
        .toLowerCase()
        .replace(/[.,;:]/g, ' ') // Replace punctuation with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };
    
    const addressMap = {};
    jsonData.forEach((row) => {
      // Try multiple possible column name variations
      const address = row.Address || row.address || '';
      if (!address) return;
      
      // Normalize address for matching (same normalization as search)
      const addressKey = normalizeAddress(address);
      
      // Parse availability factor (remove % sign if present)
      // Normalize: if value is less than 1, treat as decimal and convert to percentage (multiply by 100)
      const availabilityFactorStr = row['Availability factor (%)'] || row['Availability factor'] || row['Availability Factor (%)'] || '';
      let availabilityFactor = parseFloat(availabilityFactorStr.toString().replace('%', '')) || 99;
      // If value is less than 1, it's likely a decimal (0.99) and should be converted to percentage (99)
      if (availabilityFactor > 0 && availabilityFactor < 1) {
        availabilityFactor = availabilityFactor * 100;
      }
      
      // Parse other numeric values
      const panels = parseFloat(row['Number of solar panels'] || row['Number of Solar Panels'] || row.panels || 0) || 0;
      const confidence = parseFloat(row['Confidence level (1-10)'] || row['Confidence Level (1-10)'] || row.confidence || 0) || 0;
      const annualOutput = parseFloat(row['Annual output (kWh)'] || row['Annual Output (kWh)'] || row.annualOutput || 0) || 0;
      const kwp = parseFloat(row.kWp || row.kwp || 0) || 0;
      const kwhPerKwpPerYear = parseFloat(row['kWh/kWp/year_NL'] || row['kWh/kWp/Year_NL'] || 875) || 875;
      const avgPanelOutput = parseFloat(row['Avg solar panel output (Wp)'] || row['Avg Solar Panel Output (Wp)'] || row.avgPanelOutput || 435) || 435;
      
      addressMap[addressKey] = {
        panels,
        confidence,
        annualOutput,
        kwp,
        kwhPerKwpPerYear,
        availabilityFactor,
        avgPanelOutput,
        // Store original address for display
        originalAddress: address
      };
    });
    
    return addressMap;
  } catch (error) {
    throw new Error(`Failed to load spreadsheet: ${error.message}`);
  }
};

