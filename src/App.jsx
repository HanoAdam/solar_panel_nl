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

      // Helper function to extract street name and number
      const extractStreetAndNumber = (addr) => {
        const normalized = normalizeAddress(addr);
        // Try to match: street name + number (with optional letter suffix)
        const match = normalized.match(/^([a-z\s]+?)\s+(\d+[a-z]*)/);
        if (match) {
          return {
            street: match[1].trim().replace(/\s+/g, ''),
            number: match[2].toLowerCase().replace(/\s+/g, '')
          };
        }
        // Fallback: try to find number anywhere
        const numberMatch = normalized.match(/(\d+[a-z]*)/);
        if (numberMatch) {
          const number = numberMatch[1].toLowerCase();
          const street = normalized.replace(number, '').trim().replace(/\s+/g, '');
          return { street, number };
        }
        return { street: normalized.replace(/\s+/g, ''), number: '' };
      };

      // Helper function for fuzzy string matching (Levenshtein-like)
      const fuzzyMatch = (str1, str2, threshold = 0.8) => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        // Check if strings are very similar
        if (longer.includes(shorter) || shorter.includes(longer)) {
          return shorter.length / longer.length;
        }
        
        // Simple character-based similarity
        let matches = 0;
        const shorterSet = new Set(shorter.split(''));
        for (const char of longer) {
          if (shorterSet.has(char)) matches++;
        }
        const similarity = matches / Math.max(longer.length, shorter.length);
        
        return similarity >= threshold;
      };

      // Normalize search address
      let normalizedSearchAddress = normalizeAddress(searchAddress);
      
      // Try exact match first
      let data = spreadsheetData[normalizedSearchAddress];
      
      // If no exact match, try partial matching
      if (!data) {
        const matchingKey = Object.keys(spreadsheetData).find(key => 
          normalizedSearchAddress.includes(key) || key.includes(normalizedSearchAddress)
        );
        if (matchingKey) {
          data = spreadsheetData[matchingKey];
        }
      }

      if (data) {
        setSolarPanelData(data);
        setError(null); // Clear any previous errors
        
        // Use original address from data if available, otherwise use search address
        const addressToGeocode = data.originalAddress || searchAddress;
        
        // Only geocode and update coordinates if data is found
        // This prevents the map from zooming when address is not in dataset
        try {
          const coords = await geocodeAddress(addressToGeocode);
          setCoordinates(coords);
        } catch (geocodeErr) {
          console.warn('Geocoding failed, but continuing with solar panel data:', geocodeErr);
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
            <SolarPanelInfo data={solarPanelData} address={address || (solarPanelData?.originalAddress)} loading={loading} />
          </div>
          <div className="map-panel">
            <PdokMap address={address || (solarPanelData?.originalAddress)} coordinates={coordinates} />
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

