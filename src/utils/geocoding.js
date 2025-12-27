/**
 * Geocodes an address to get coordinates
 * Uses Nominatim (OpenStreetMap) geocoding service
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lon: number}>} - Coordinates
 */
export const geocodeAddress = async (address) => {
  try {
    // Using Nominatim (OpenStreetMap) geocoding service
    // This is free and works well for addresses
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SolarPanelApp/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      throw new Error('Address not found');
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

