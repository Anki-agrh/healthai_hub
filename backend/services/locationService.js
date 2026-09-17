const axios = require('axios');

/**
 * Converts a city name into Latitude and Longitude
 */
async function getCoordsFromCity(cityName) {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: cityName, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'HealthAI-Hub-Production-App/1.0' } 
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
 * Finds hospitals/doctors within a 15km radius using multiple Overpass API instances
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

  // List of fallback Overpass API endpoints to bypass cloud IP bans
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, {
        params: { data: query },
        headers: { 'User-Agent': 'HealthAI-Hub-Production-App/1.0 (Contact: support@healthai.com)' },
        timeout: 8000 // 8 second timeout per endpoint
      });
      
      if (response.data && response.data.elements && response.data.elements.length > 0) {
        return response.data.elements.map(el => ({
          id: el.id,
          name: el.tags.name || "Clinic/Hospital",
          address: el.tags["addr:street"] || "Address not listed",
          lat: el.lat,
          lng: el.lon,
          distance: calculateDistance(lat, lng, el.lat, el.lon).toFixed(2)
        }));
      }
    } catch (error) {
      console.warn(`Overpass API Failed at ${endpoint}: ${error.message}. Trying next...`);
      continue;
    }
  }

  console.error("All Overpass API endpoints failed or returned no results.");
  return [];
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

module.exports = { 
  getCoordsFromCity, 
  getNearbyDoctors 
};