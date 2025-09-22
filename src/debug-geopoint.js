// Debug script to test GeoPoint processing
// This can be run in the browser console to test coordinate extraction

export const testGeoPointProcessing = (currentLocation) => {
  console.log('Testing GeoPoint processing for:', currentLocation);
  
  let coordinates = null;
  
  // Handle Firebase GeoPoint object - this is the most common case
  if (currentLocation.latitude !== undefined && currentLocation.longitude !== undefined) {
    coordinates = { 
      lat: currentLocation.latitude, 
      lng: currentLocation.longitude 
    };
    console.log('✅ Extracted coordinates from GeoPoint:', coordinates);
  }
  // Handle GeoPoint with toJSON method
  else if (currentLocation.toJSON && typeof currentLocation.toJSON === 'function') {
    const geoData = currentLocation.toJSON();
    coordinates = {
      lat: geoData.latitude,
      lng: geoData.longitude
    };
    console.log('✅ Extracted coordinates from toJSON:', coordinates);
  }
  // Handle GeoPoint with _lat and _long properties
  else if (currentLocation._lat !== undefined && currentLocation._long !== undefined) {
    coordinates = {
      lat: currentLocation._lat,
      lng: currentLocation._long
    };
    console.log('✅ Extracted coordinates from _lat/_long:', coordinates);
  } 
  // Handle array format [lat, lng]
  else if (Array.isArray(currentLocation) && currentLocation.length >= 2) {
    coordinates = { 
      lat: currentLocation[0], 
      lng: currentLocation[1] 
    };
    console.log('✅ Extracted coordinates from array:', coordinates);
  } 
  // Handle object format {lat, lng}
  else if (typeof currentLocation === 'object' && currentLocation.lat !== undefined && currentLocation.lng !== undefined) {
    coordinates = { 
      lat: currentLocation.lat, 
      lng: currentLocation.lng 
    };
    console.log('✅ Extracted coordinates from object:', coordinates);
  }
  // Handle string format like "33.5589628° N, 73.1509421° E"
  else if (typeof currentLocation === 'string') {
    const match = currentLocation.match(/(\d+\.?\d*).*?(\d+\.?\d*)/);
    if (match) {
      coordinates = {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
      console.log('✅ Extracted coordinates from string:', coordinates);
    }
  }
  // Last resort: try to extract from toString representation
  else {
    const locationStr = currentLocation.toString();
    const match = locationStr.match(/(\d+\.?\d*).*?(\d+\.?\d*)/);
    if (match) {
      coordinates = {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
      console.log('✅ Extracted coordinates from toString:', coordinates);
    }
  }
  
  if (!coordinates) {
    console.log('❌ No valid coordinates found');
    console.log('GeoPoint type:', typeof currentLocation);
    console.log('GeoPoint keys:', Object.keys(currentLocation || {}));
    console.log('GeoPoint value:', currentLocation);
  }
  
  return coordinates;
};

// Example usage in browser console:
// testGeoPointProcessing(workerData.currentLocation);
