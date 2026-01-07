import React, { useState, useEffect } from 'react';
import './SolarPanelInfo.css';

const SolarPanelInfo = ({ data, address, loading, onDataChange }) => {
  const [kwhPerKwpPerYear, setKwhPerKwpPerYear] = useState(875);
  const [availabilityFactor, setAvailabilityFactor] = useState(99);
  const [avgPanelOutput, setAvgPanelOutput] = useState(435);
  const [calculatedKwp, setCalculatedKwp] = useState(0);
  const [calculatedAnnualOutput, setCalculatedAnnualOutput] = useState(0);

  // Initialize values from data when it changes
  useEffect(() => {
    if (data) {
      setKwhPerKwpPerYear(data.kwhPerKwpPerYear || 875);
      setAvailabilityFactor(data.availabilityFactor || 99);
      setAvgPanelOutput(data.avgPanelOutput || 435);
    }
  }, [data]);

  // Recalculate values when editable fields change or data changes
  useEffect(() => {
    if (data && data.panels !== undefined && data.panels !== null) {
      // Calculate kWp: (Number of panels * Avg solar panel output) / 1000
      const kwp = (data.panels * avgPanelOutput) / 1000;
      setCalculatedKwp(kwp);

      // Calculate Annual output: kWp * kWh/kWp/year_NL * (Availability factor / 100)
      const annualOutput = kwp * kwhPerKwpPerYear * (availabilityFactor / 100);
      setCalculatedAnnualOutput(annualOutput);

      // Notify parent component of changes
      if (onDataChange) {
        onDataChange({
          ...data,
          kwhPerKwpPerYear,
          availabilityFactor,
          avgPanelOutput,
          calculatedKwp: kwp,
          calculatedAnnualOutput: annualOutput
        });
      }
    } else if (data) {
      // If no panels data, set to 0
      setCalculatedKwp(0);
      setCalculatedAnnualOutput(0);
    }
  }, [data, kwhPerKwpPerYear, availabilityFactor, avgPanelOutput, onDataChange]);

  if (loading) {
    return (
      <div className="solar-panel-info">
        <div className="info-placeholder">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="solar-panel-info">
        <div className="info-placeholder">
          <p>Enter an address to see solar panel information</p>
        </div>
      </div>
    );
  }

  const handleKwhPerKwpChange = (e) => {
    const numValue = parseFloat(e.target.value);
    const value = isNaN(numValue) ? 875 : numValue;
    setKwhPerKwpPerYear(value);
  };

  const handleAvailabilityFactorChange = (e) => {
    const numValue = parseFloat(e.target.value);
    const value = isNaN(numValue) ? 99 : numValue;
    setAvailabilityFactor(value);
  };

  const handleAvgPanelOutputChange = (e) => {
    const numValue = parseFloat(e.target.value);
    const value = isNaN(numValue) ? 435 : numValue;
    setAvgPanelOutput(value);
  };

  return (
    <div className="solar-panel-info">
      <h2 className="info-title">Solar Panel Information</h2>
      <div className="info-content">
        <div className="info-item">
          <div className="info-label">ADDRESS</div>
          <div className="info-value read-only">{address || data.originalAddress}</div>
        </div>
        
        <div className="info-item highlight-item">
          <div className="info-label">APPROX. NUMBER OF SOLAR PANELS</div>
          <div className="info-value highlight read-only">{data.panels || 0}</div>
        </div>

        <div className="info-item">
          <div className="info-label">CONFIDENCE LEVEL (1-10)</div>
          <div className="info-value read-only">{data.confidence || 0}</div>
        </div>

        <div className="info-item">
          <div className="info-label">APPROX. ANNUAL OUTPUT</div>
          <div className="info-value read-only">{isNaN(calculatedAnnualOutput) ? '0' : calculatedAnnualOutput.toFixed(0)} kWh</div>
        </div>

        <div className="info-item">
          <div className="info-label">KWP</div>
          <div className="info-value read-only">{isNaN(calculatedKwp) ? '0.000' : calculatedKwp.toFixed(3)}</div>
        </div>

        <div className="info-item editable-item">
          <div className="info-label">KWH/KWP/YEAR_NL</div>
          <input
            type="number"
            className="info-input"
            value={kwhPerKwpPerYear}
            onChange={handleKwhPerKwpChange}
            min="0"
            step="1"
          />
        </div>

        <div className="info-item editable-item">
          <div className="info-label">AVAILABILITY FACTOR</div>
          <div className="input-with-unit">
            <input
              type="number"
              className="info-input"
              value={availabilityFactor}
              onChange={handleAvailabilityFactorChange}
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-unit">%</span>
          </div>
        </div>

        <div className="info-item editable-item">
          <div className="info-label">AVG SOLAR PANEL OUTPUT</div>
          <div className="input-with-unit">
            <input
              type="number"
              className="info-input"
              value={avgPanelOutput}
              onChange={handleAvgPanelOutputChange}
              min="0"
              step="1"
            />
            <span className="input-unit">Wp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarPanelInfo;

