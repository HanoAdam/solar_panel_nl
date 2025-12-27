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

  // Load spreadsheet from public folder on mount
  useEffect(() => {
    const loadDefaultSpreadsheet = async () => {
      try {
        // Try to load CSV from public folder first
        const data = await loadSpreadsheetFromUrl('/solar_panels.csv');
        setSpreadsheetData(data);
      } catch (err) {
        // If CSV fails, try XLSX
        try {
          const data = await loadSpreadsheetFromUrl('/solar_panels.xlsx');
          setSpreadsheetData(data);
        } catch (err2) {
          console.log('No default spreadsheet found in public folder');
        }
      }
    };
    loadDefaultSpreadsheet();
  }, []);

  const handleSearch = async (searchAddress) => {
    setLoading(true);
    setError(null);
    setAddress(searchAddress);
    setSolarPanelData(null);

    try {
      // Geocode the address to get coordinates
      const coords = await geocodeAddress(searchAddress);
      setCoordinates(coords);

      // Look up solar panel data
      const normalizedAddress = searchAddress.toLowerCase().trim();
      
      // Try exact match first
      let data = spreadsheetData[normalizedAddress];
      
      // If no exact match, try partial matching
      if (!data) {
        const matchingKey = Object.keys(spreadsheetData).find(key => 
          normalizedAddress.includes(key) || key.includes(normalizedAddress)
        );
        if (matchingKey) {
          data = spreadsheetData[matchingKey];
        }
      }

      if (data) {
        setSolarPanelData(data);
      } else {
        setError('No solar panel data found for this address');
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
          <h1 className="app-title">Solar Info - Spenat Labs</h1>
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
            <SolarPanelInfo data={solarPanelData} address={address} loading={loading} />
          </div>
          <div className="map-panel">
            <PdokMap address={address} coordinates={coordinates} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

