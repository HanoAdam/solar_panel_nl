import React from 'react';
import './SolarPanelInfo.css';

const SolarPanelInfo = ({ data, address, loading }) => {
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

  return (
    <div className="solar-panel-info">
      <h2 className="info-title">Solar Panel Information</h2>
      <div className="info-content">
        <div className="info-item">
          <div className="info-label">Address</div>
          <div className="info-value">{address}</div>
        </div>
        <div className="info-item highlight-item">
          <div className="info-label">Number of Solar Panels</div>
          <div className="info-value highlight">{data.panels || 'N/A'}</div>
        </div>
        {data.capacity && (
          <div className="info-item">
            <div className="info-label">Total Capacity</div>
            <div className="info-value">{data.capacity} kW</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolarPanelInfo;

