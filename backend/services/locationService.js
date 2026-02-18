const axios = require('axios');

/**
 * Converts a city name into Latitude and Longitude
 */
async function getCoordsFromCity(cityName) {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: cityName, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'HealthAI-Hub-Project' } 
    });
    
    if (response.data.length > 0) {
      return { 
        lat: parseFloat(response.data[0].lat), 
        lng: parseFloat(response.data[0].lon) 
      };
    }
    throw new Error("City not found");
  } catch (error) {
    console.error("Geocoding Error:", error.message);
    throw error;
  }
}

/**
 * Finds hospitals/doctors within a 15km radius using Overpass API
 */
async function getNearbyDoctors(lat, lng) {
  const radius = 15000; // 15km
  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radius}, ${lat}, ${lng});
      node["amenity"="doctors"](around:${radius}, ${lat}, ${lng});
    );
    out body;
  `;

  try {
    const response = await axios.post('https://overpass-api.de/api/interpreter', query);
    
    // Check if elements exist to avoid crashes
    if (!response.data || !response.data.elements) return [];

    return response.data.elements.map(el => ({
      id: el.id,
      name: el.tags.name || "Clinic/Hospital",
      address: el.tags["addr:street"] || "Address not listed",
      lat: el.lat,
      lng: el.lon,
      distance: calculateDistance(lat, lng, el.lat, el.lon).toFixed(2)
    }));
  } catch (error) {
    console.error("Overpass API Error:", error.message);
    return [];
  }
}

/**
 * Helper: Haversine Formula (Mathematical Accuracy)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// CORRECT EXPORT: Export as an object containing all functions
module.exports = { 
  getCoordsFromCity, 
  getNearbyDoctors 
};