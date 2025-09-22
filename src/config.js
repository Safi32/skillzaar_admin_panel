// Configuration file for API keys and settings
export const CONFIG = {
  // Google Maps API Key - Replace with your actual API key
  GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyALzdd7qQdemxo4BHN--GRkLZ0GFlbEwLA",
  
  // Rawalpindi-Islamabad map settings
  PAKISTAN_CENTER: {
    lat: 33.6844, // Islamabad center
    lng: 73.0479
  },
  
  // Real-time update interval (in milliseconds)
  REALTIME_UPDATE_INTERVAL: 5000, // 5 seconds
  
  // Map zoom levels for Rawalpindi-Islamabad
  DEFAULT_ZOOM: 11, // Closer zoom for twin cities
  CITY_ZOOM: 13,
  DETAILED_ZOOM: 15
};

// Rawalpindi-Islamabad area locations with coordinates
export const PAKISTAN_CITIES = {
  islamabad: { lat: 33.6844, lng: 73.0479, name: 'Islamabad' },
  rawalpindi: { lat: 33.5651, lng: 73.0169, name: 'Rawalpindi' },
  'islamabad-f8': { lat: 33.6844, lng: 73.0479, name: 'F-8, Islamabad' },
  'islamabad-f7': { lat: 33.6944, lng: 73.0379, name: 'F-7, Islamabad' },
  'islamabad-f6': { lat: 33.7044, lng: 73.0279, name: 'F-6, Islamabad' },
  'rawalpindi-cantt': { lat: 33.5751, lng: 73.0069, name: 'Cantt, Rawalpindi' },
  'rawalpindi-saddar': { lat: 33.5551, lng: 73.0269, name: 'Saddar, Rawalpindi' },
  'rawalpindi-chaklala': { lat: 33.5451, lng: 73.0369, name: 'Chaklala, Rawalpindi' },
  'islamabad-blue-area': { lat: 33.6744, lng: 73.0579, name: 'Blue Area, Islamabad' },
  'islamabad-dha': { lat: 33.6644, lng: 73.0679, name: 'DHA, Islamabad' }
};
