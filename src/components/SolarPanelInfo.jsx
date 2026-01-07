import React, { useState, useEffect, useRef } from 'react';
import { calculateKwp, calculateAnnualOutput } from '../utils/calculations';
import './SolarPanelInfo.css';

const SolarPanelInfo = ({ data, address, loading, onDataChange }) => {
  const [kwhPerKwpPerYear, setKwhPerKwpPerYear] = useState(875);
  const [availabilityFactor, setAvailabilityFactor] = useState(99);
  const [avgPanelOutput, setAvgPanelOutput] = useState(435);
  const [calculatedKwp, setCalculatedKwp] = useState(0);
  const [calculatedAnnualOutput, setCalculatedAnnualOutput] = useState(0);
  const isInitialLoadRef = useRef(true);
  const previousDataRef = useRef(null);

  // Initialize values from data when it changes and recalculate
  useEffect(() => {
    if (data) {
      // Check if this is a new data object (different from previous)
      const isNewData = previousDataRef.current !== data;
      
      // Mark as initial load when new data arrives to prevent recalculation effect from running
      if (isNewData) {
        isInitialLoadRef.current = true;
        previousDataRef.current = data;
      }
      
      // Use data values if available, otherwise use defaults (not current state to avoid circular dependency)
      const newKwhPerKwpPerYear = data.kwhPerKwpPerYear !== undefined && data.kwhPerKwpPerYear !== null ? data.kwhPerKwpPerYear : 875;
      const newAvailabilityFactor = data.availabilityFactor !== undefined && data.availabilityFactor !== null ? data.availabilityFactor : 99;
      const newAvgPanelOutput = data.avgPanelOutput !== undefined && data.avgPanelOutput !== null ? data.avgPanelOutput : 435;
      
      setKwhPerKwpPerYear(newKwhPerKwpPerYear);
      setAvailabilityFactor(newAvailabilityFactor);
      setAvgPanelOutput(newAvgPanelOutput);

      // Use spreadsheet values if available, otherwise calculate
      if (data.panels !== undefined && data.panels !== null) {
        // Use kWp from spreadsheet if available, otherwise calculate
        const kwp = (data.kwp !== undefined && data.kwp !== null && data.kwp > 0) 
          ? data.kwp 
          : calculateKwp(data.panels, newAvgPanelOutput);
        setCalculatedKwp(kwp);

        // Use Annual output from spreadsheet if available, otherwise calculate
        const annualOutput = (data.annualOutput !== undefined && data.annualOutput !== null && data.annualOutput > 0)
          ? data.annualOutput
          : calculateAnnualOutput(kwp, newKwhPerKwpPerYear, newAvailabilityFactor);
        setCalculatedAnnualOutput(annualOutput);

        // Mark that initial load is complete after setting values
        // Use setTimeout to ensure this happens after any recalculation effect runs
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 0);

        // Notify parent component of changes
        if (onDataChange) {
          onDataChange({
            ...data,
            kwhPerKwpPerYear: newKwhPerKwpPerYear,
            availabilityFactor: newAvailabilityFactor,
            avgPanelOutput: newAvgPanelOutput,
            calculatedKwp: kwp,
            calculatedAnnualOutput: annualOutput
          });
        }
      } else {
        // If no panels data, set to 0
        setCalculatedKwp(0);
        setCalculatedAnnualOutput(0);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 0);
      }
    }
  }, [data, onDataChange]);

  // Recalculate when user edits the fields (this runs after state updates from user input)
  useEffect(() => {
    // Skip recalculation on initial load - only recalculate when user manually edits fields
    if (isInitialLoadRef.current) {
      return;
    }

    // Only recalculate if data exists and we have panel data
    // This effect runs when user edits fields (state changes), not when data initially loads
    // When user edits fields, always recalculate (ignore spreadsheet values)
    if (data && data.panels !== undefined && data.panels !== null) {
      // Always calculate kWp when user edits fields
      const kwp = calculateKwp(data.panels, avgPanelOutput);
      setCalculatedKwp(kwp);

      // Always calculate Annual output when user edits fields
      const annualOutput = calculateAnnualOutput(kwp, kwhPerKwpPerYear, availabilityFactor);
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
          <div className="info-value read-only">{data.originalAddress || address}</div>
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

