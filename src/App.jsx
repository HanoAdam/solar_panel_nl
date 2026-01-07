import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import SolarPanelInfo from './components/SolarPanelInfo';
import PdokMap from './components/PdokMap';
import { loadSpreadsheetFromUrl } from './utils/spreadsheetReader';
import { geocodeAddress } from './utils/geocoding';
import './App.css';

// Default coordinates
const DEFAULT_LAT = 52.166705;
const DEFAULT_LON = 5.519060;

function App() {
  const [address, setAddress] = useState('');
  const [solarPanelData, setSolarPanelData] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spreadsheetData, setSpreadsheetData] = useState({});

  // Load spreadsheet from Google Sheets on mount
  useEffect(() => {
    const loadSpreadsheet = async () => {
      try {
        // Load from Google Sheets
        const googleSheetsUrl = 'https://docs.google.com/spreadsheets/d/10pxEZ3RvdQWfbILSCfv5elbAbmKAUKbZFWBKkOqhtIk/edit?usp=sharing';
        const data = await loadSpreadsheetFromUrl(googleSheetsUrl);
        setSpreadsheetData(data);
      } catch (err) {
        console.error('Failed to load spreadsheet:', err);
        setError('Failed to load solar panel data. Please refresh the page.');
      }
    };
    loadSpreadsheet();
  }, []);

  const handleSearch = async (searchAddress) => {
    setLoading(true);
    setError(null);
    setAddress(searchAddress);
    setSolarPanelData(null);

    // Check if data is loaded
    if (Object.keys(spreadsheetData).length === 0) {
      setError('Solar panel data is still loading. Please wait a moment and try again.');
      setLoading(false);
      return;
    }

    // Look up solar panel data (this is the main functionality)
    try {
      // Helper function to normalize address (remove punctuation, extra spaces, lowercase)
      const normalizeAddress = (addr) => {
        return addr
          .replace(/^["']|["']$/g, '') // Remove quotes
          .toLowerCase()
          .replace(/[.,;:]/g, ' ') // Replace punctuation with spaces
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      // Helper function to extract street name and number from address
      const extractStreetAndNumber = (addr) => {
        const normalized = normalizeAddress(addr);
        // Try to match: street name + number (with optional letter suffix like "23a")
        const match = normalized.match(/([a-z\s]+?)\s+(\d+[a-z]*)/);
        if (match) {
          return {
            street: match[1].trim().replace(/\s+/g, ' '),
            number: match[2].toLowerCase()
          };
        }
        // Fallback: try to find number anywhere
        const numberMatch = normalized.match(/(\d+[a-z]*)/);
        if (numberMatch) {
          const number = numberMatch[1].toLowerCase();
          const street = normalized.replace(number, '').trim();
          return { street, number };
        }
        return { street: normalized, number: '' };
      };

      // Helper function for fuzzy string matching (Levenshtein distance approximation)
      const calculateSimilarity = (str1, str2) => {
        if (str1 === str2) return 1.0;
        if (str1.length === 0 || str2.length === 0) return 0.0;
        
        // Check if one contains the other
        if (str1.includes(str2) || str2.includes(str1)) {
          return Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
        }
        
        // Calculate Levenshtein-like similarity
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        // Simple character-based similarity
        let matches = 0;
        const shorterChars = shorter.split('');
        const longerChars = longer.split('');
        
        for (let i = 0; i < shorterChars.length; i++) {
          if (shorterChars[i] === longerChars[i] || longerChars.includes(shorterChars[i])) {
            matches++;
          }
        }
        
        // Also check for common substrings
        let commonSubstring = 0;
        for (let i = 0; i < shorter.length - 2; i++) {
          const substr = shorter.substring(i, i + 3);
          if (longer.includes(substr)) commonSubstring++;
        }
        
        const similarity = (matches / longer.length) * 0.7 + (commonSubstring / Math.max(shorter.length - 2, 1)) * 0.3;
        return similarity;
      };

      // Normalize search address
      let normalizedSearchAddress = normalizeAddress(searchAddress);
      
      // Try exact match first
      let data = spreadsheetData[normalizedSearchAddress];
      let matchedKey = normalizedSearchAddress;
      
      // If no exact match, try matching by street name and number
      if (!data) {
        const searchParts = extractStreetAndNumber(searchAddress);
        
        // Find best match by comparing street name and number
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [key, value] of Object.entries(spreadsheetData)) {
          const keyParts = extractStreetAndNumber(value.originalAddress || key);
          
          // Must match number if both have numbers
          if (searchParts.number && keyParts.number) {
            if (searchParts.number !== keyParts.number) {
              continue; // Skip if numbers don't match
            }
          }
          
          // Calculate similarity for street names
          const streetSimilarity = calculateSimilarity(searchParts.street, keyParts.street);
          
          // Prefer matches where search address is contained in full address
          const containsMatch = key.includes(searchParts.street) && 
                                (!searchParts.number || key.includes(searchParts.number));
          
          const score = containsMatch ? 0.9 : streetSimilarity;
          
          if (score > bestScore && score > 0.6) { // Minimum threshold of 60% similarity
            bestScore = score;
            bestMatch = key;
            data = value;
          }
        }
        
        if (bestMatch) {
          matchedKey = bestMatch;
        }
      }
      
      // If still no match, try partial string matching as last resort
      if (!data) {
        const matchingKey = Object.keys(spreadsheetData).find(key => {
          const searchParts = extractStreetAndNumber(searchAddress);
          const keyParts = extractStreetAndNumber(key);
          
          // Check if street name is similar and number matches
          if (searchParts.number && keyParts.number && searchParts.number === keyParts.number) {
            const similarity = calculateSimilarity(searchParts.street, keyParts.street);
            return similarity > 0.5;
          }
          
          // Fallback: check if search is contained in key or vice versa
          return key.includes(normalizedSearchAddress) || normalizedSearchAddress.includes(key);
        });
        
        if (matchingKey) {
          data = spreadsheetData[matchingKey];
          matchedKey = matchingKey;
        }
      }

      if (data) {
        // Always use the original address from spreadsheet for display and geocoding
        // This ensures correct spelling and full address (with city, zip, country) is shown
        const addressToGeocode = data.originalAddress || matchedKey || searchAddress;
        
        // Geocode first, then set both data and coordinates together to prevent double zoom
        try {
          const coords = await geocodeAddress(addressToGeocode);
          // Set coordinates and data together to prevent intermediate map updates
          setCoordinates(coords);
          setSolarPanelData(data);
          setError(null); // Clear any previous errors
        } catch (geocodeErr) {
          console.warn('Geocoding failed, but continuing with solar panel data:', geocodeErr);
          // Set data even if geocoding fails, but don't update coordinates
          setSolarPanelData(data);
          setError(null);
          // Keep default coordinates or previous coordinates
        }
      } else {
        setError('The address is not available in this dataset.');
        console.log('Searched for:', normalizedSearchAddress);
        console.log('Total addresses loaded:', Object.keys(spreadsheetData).length);
        console.log('Sample addresses:', Object.keys(spreadsheetData).slice(0, 5));
        // Don't update coordinates - keep map as is
      }
    } catch (err) {
      setError('Failed to process address: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-top">
            <h1 className="app-title">Solar Panel Finder</h1>
            <a href="https://spenatlabs.com" target="_blank" rel="noopener noreferrer" className="spenat-logo">
              Spenat Labs
            </a>
          </div>
          <p className="app-subtitle">Search for addresses and view solar panel data</p>
        </div>
      </header>

      <div className="main-container">
        <div className="search-section">
          <SearchBar onSearch={handleSearch} loading={loading} />
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="content-container">
          <div className="info-panel">
            <SolarPanelInfo data={solarPanelData} address={solarPanelData?.originalAddress || address} loading={loading} />
          </div>
          <div className="map-panel">
            <PdokMap address={solarPanelData?.originalAddress || address} coordinates={coordinates} />
          </div>
        </div>
      </div>
      <footer className="app-footer">
        <div className="footer-content">
          <p className="disclaimer">
            For API access and inquiries, please contact{' '}
            <a href="mailto:andrej@spenatlabs.com" className="footer-link">andrej@spenatlabs.com</a>.
            <br /><br />
            Estimates are approximate and based on aerial or satellite imagery and other third-party information. No legal responsibility is assumed for accuracy or timeliness. Copyright © Spenat Labs Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

