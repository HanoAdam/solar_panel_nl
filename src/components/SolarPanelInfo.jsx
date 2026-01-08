import React, { useState, useEffect, useRef } from 'react';
import { calculateKwp, calculateAnnualOutput } from '../utils/calculations';
import './SolarPanelInfo.css';

const SolarPanelInfo = ({ data, address, loading, onDataChange }) => {
  const [kwhPerKwpPerYear, setKwhPerKwpPerYear] = useState(875);
  const [availabilityFactor, setAvailabilityFactor] = useState(99);
  const [avgPanelOutput, setAvgPanelOutput] = useState(435);
  const [calculatedKwp, setCalculatedKwp] = useState(0);
  const [calculatedAnnualOutput, setCalculatedAnnualOutput] = useState(0);
  const [visibleHelpTexts, setVisibleHelpTexts] = useState({});
  const isInitialLoadRef = useRef(true);
  const previousDataRef = useRef(null);

  const toggleHelpText = (fieldId) => {
    setVisibleHelpTexts(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

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
      let newAvailabilityFactor = data.availabilityFactor !== undefined && data.availabilityFactor !== null ? data.availabilityFactor : 99;
      // Normalize: if value is less than 1, treat as decimal and convert to percentage (multiply by 100)
      if (newAvailabilityFactor > 0 && newAvailabilityFactor < 1) {
        newAvailabilityFactor = newAvailabilityFactor * 100;
      }
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
    let value = isNaN(numValue) ? 99 : numValue;
    // Normalize: if user enters a decimal value less than 1 (like 0.99), convert to percentage (99)
    if (value > 0 && value < 1) {
      value = value * 100;
    }
    // Ensure value is within valid range (0-100)
    value = Math.max(0, Math.min(100, value));
    setAvailabilityFactor(value);
  };

  const handleAvgPanelOutputChange = (e) => {
    const numValue = parseFloat(e.target.value);
    const value = isNaN(numValue) ? 435 : numValue;
    setAvgPanelOutput(value);
  };

  const helpTexts = {
    confidence: "System confidence in detecting the correct number of solar panels. 10 = highest.",
    annualOutput: "Approximate annual output of the property's solar PV system.\n\nFormula:\nAnnual output (kWh) = kWp × (kWh/kWp/year in the Netherlands) × availability factor (%)",
    kwp: "Rated peak power of a solar PV system (kWp).\n\nFormula:\nkWP = number of solar panels × average solar panel peak power (Wp) ÷ 1,000",
    kwhPerKwpPerYear: "Typical annual solar yield in the Netherlands (kWh per kWp installed).\n\nSource: International Energy Agency (IEA), 2023",
    availabilityFactor: "Availability factor (%)\n\nProportion of time the system is available to generate electricity over the year (including day and night). Use a lower value for systems affected by shading/obstructions or downtime due to maintenance or grid disconnection.",
    avgPanelOutput: "Average rated peak power of a solar panel (Wp).\n\nSource: International Energy Agency (IEA), 2025"
  };

  const HelpIcon = ({ fieldId }) => (
    <button
      className="help-icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleHelpText(fieldId);
      }}
      aria-label="Toggle help text"
      type="button"
    >
      ?
    </button>
  );

  const HelpText = ({ fieldId, text }) => {
    if (!visibleHelpTexts[fieldId]) return null;
    return (
      <div className="help-text">
        {text.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
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
          <div className="info-label-row">
            <span>CONFIDENCE LEVEL (1-10)</span>
            <HelpIcon fieldId="confidence" />
          </div>
          <HelpText fieldId="confidence" text={helpTexts.confidence} />
          <div className="info-value read-only">{data.confidence || 0}</div>
        </div>

        <div className="info-item">
          <div className="info-label-row">
            <span>APPROX. ANNUAL OUTPUT</span>
            <HelpIcon fieldId="annualOutput" />
          </div>
          <HelpText fieldId="annualOutput" text={helpTexts.annualOutput} />
          <div className="info-value read-only">{isNaN(calculatedAnnualOutput) ? '0' : calculatedAnnualOutput.toFixed(0)} kWh</div>
        </div>

        <div className="info-item">
          <div className="info-label-row">
            <span>KWP</span>
            <HelpIcon fieldId="kwp" />
          </div>
          <HelpText fieldId="kwp" text={helpTexts.kwp} />
          <div className="info-value read-only">{isNaN(calculatedKwp) ? '0.000' : calculatedKwp.toFixed(3)}</div>
        </div>

        <div className="info-item editable-item">
          <div className="info-label-row">
            <span>KWH/KWP/YEAR_NL</span>
            <HelpIcon fieldId="kwhPerKwpPerYear" />
          </div>
          <HelpText fieldId="kwhPerKwpPerYear" text={helpTexts.kwhPerKwpPerYear} />
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
          <div className="info-label-row">
            <span>AVAILABILITY FACTOR</span>
            <HelpIcon fieldId="availabilityFactor" />
          </div>
          <HelpText fieldId="availabilityFactor" text={helpTexts.availabilityFactor} />
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
          <div className="info-label-row">
            <span>AVG SOLAR PANEL OUTPUT</span>
            <HelpIcon fieldId="avgPanelOutput" />
          </div>
          <HelpText fieldId="avgPanelOutput" text={helpTexts.avgPanelOutput} />
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

