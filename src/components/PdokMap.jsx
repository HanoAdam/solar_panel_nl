import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PdokMap.css';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const PdokMap = ({ address, coordinates }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!coordinates) return;

    const { lat, lon } = coordinates;
    
    // Handle window resize to ensure map fills container
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);

      // Initialize map if it doesn't exist
      if (!mapInstanceRef.current && mapRef.current) {
        // Create map centered on coordinates with maximum zoom allowed
        const map = L.map(mapRef.current, {
          maxZoom: 25, // Allow maximum zoom
          zoomControl: true
        }).setView([lat, lon], address ? 19 : 17); // Zoom level: 19 for address search, 17 for default view

      // Add PDOK base layer (BGT - Basisregistratie Grootschalige Topografie)
      // PDOK provides WMS services, using BGT as base layer
      const pdokBgtLayer = L.tileLayer.wms('https://service.pdok.nl/brt/bgt/wms/v1_1?', {
        layers: 'bgt',
        format: 'image/png',
        transparent: true,
        maxZoom: 25, // Allow maximum zoom
        attribution: '© PDOK | <a href="https://www.pdok.nl" target="_blank">PDOK.nl</a>'
      });

      // Add OpenStreetMap as base layer (fallback and for better visibility)
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | © PDOK',
        maxZoom: 25 // Increased from 19 to allow more zoom
      });

      // Add PDOK aerial imagery layer (satellite view - default)
      // Using highest quality settings: PNG format for lossless quality
      const pdokAerialLayer = L.tileLayer.wms('https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0?', {
        layers: 'Actueel_ortho25',
        format: 'image/png', // PNG for best quality (lossless, no compression artifacts)
        transparent: false,
        maxZoom: 25, // Allow maximum zoom
        srs: 'EPSG:3857', // Web Mercator projection
        version: '1.1.1', // WMS version
        attribution: '© PDOK | <a href="https://www.pdok.nl" target="_blank">PDOK.nl</a>'
      });

      // Add high-resolution layer option (10cm resolution - best quality)
      // Available in some areas of the Netherlands
      const pdokAerialHRLayer = L.tileLayer.wms('https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0?', {
        layers: 'Actueel_orthoHR', // High resolution (10cm) - highest quality available
        format: 'image/png', // PNG for best quality
        transparent: false,
        maxZoom: 25,
        srs: 'EPSG:3857',
        version: '1.1.1',
        attribution: '© PDOK | <a href="https://www.pdok.nl" target="_blank">PDOK.nl</a>'
      });

      // Add highest quality satellite view as default base layer
      // Use high-res if available, otherwise standard resolution
      pdokAerialHRLayer.addTo(map);
      
      // Add base layers (satellite is default, but user can switch)
      const baseMaps = {
        'Satellite HR (10cm - Best Quality)': pdokAerialHRLayer,
        'Satellite (25cm)': pdokAerialLayer,
        'OpenStreetMap': osmLayer
      };

      const overlayMaps = {
        'PDOK BGT': pdokBgtLayer
      };

      // Add layer control
      L.control.layers(baseMaps, overlayMaps).addTo(map);

      // Add marker for the location (no popup)
      const marker = L.marker([lat, lon]).addTo(map);
      markerRef.current = marker;

      mapInstanceRef.current = map;
      
      // Invalidate map size to ensure it fills the container properly
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } else if (mapInstanceRef.current) {
      // Update map if it already exists
      mapInstanceRef.current.setView([lat, lon], address ? 19 : 17); // Zoom level: 19 for address search, 17 for default view
      
      // Remove old marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      
      // Add new marker (no popup)
      const marker = L.marker([lat, lon]).addTo(mapInstanceRef.current);
      markerRef.current = marker;
      
      // Invalidate map size to ensure it fills the container properly
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      // Don't remove map on cleanup, only remove markers
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [address, coordinates]);

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>Location</h3>
        {address && <p className="map-address">{address}</p>}
        {!address && coordinates && (
          <p className="map-address">Default location</p>
        )}
      </div>
      <div className="map-wrapper" ref={mapRef}></div>
    </div>
  );
};

export default PdokMap;

