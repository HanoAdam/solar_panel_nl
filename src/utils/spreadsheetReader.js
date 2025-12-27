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
 * Loads spreadsheet from a URL (for public files)
 * @param {string} url - URL to the spreadsheet file
 * @returns {Promise<Object>} - Object mapping addresses to solar panel data
 */
export const loadSpreadsheetFromUrl = async (url) => {
  try {
    const response = await fetch(url);
    let workbook;
    
    // Handle CSV files differently
    if (url.toLowerCase().endsWith('.csv')) {
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
    
    const addressMap = {};
    jsonData.forEach((row) => {
      const addressKey = (row.Address || row.address || '').toLowerCase().trim();
      if (addressKey) {
        addressMap[addressKey] = {
          panels: row.Panels || row.panels || row['Number of Panels'] || row['Number of panels'],
          capacity: row.Capacity || row.capacity || row['Total Capacity (kW)'],
          installationDate: row['Installation Date'] || row['Installation date'] || row.installationDate,
        };
      }
    });
    
    return addressMap;
  } catch (error) {
    throw new Error(`Failed to load spreadsheet: ${error.message}`);
  }
};

