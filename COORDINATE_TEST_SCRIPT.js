// Test script to verify coordinate extraction from SkilledWorkers collection
// Run this in browser console to test your Firebase data structure

const testCoordinateExtraction = async () => {
  try {
    // Import Firebase modules
    const { getFirestore, collection, getDocs, query, where } = await import('firebase/firestore');
    const { initializeApp } = await import('firebase/app');
    
    // Your Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyALzdd7qQdemxo4BHN--GRkLZ0GFlbEwLA",
      authDomain: "skillzaar-bcb0f.firebaseapp.com",
      projectId: "skillzaar-bcb0f",
      storageBucket: "skillzaar-bcb0f.firebasestorage.app",
      messagingSenderId: "18417914632",
      appId: "1:18417914632:web:9c08693103ccd713d892bd"
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🔍 Testing SkilledWorkers collection...');
    
    // Get all SkilledWorkers
    const skilledWorkersQuery = query(collection(db, 'SkilledWorkers'), where('approvalStatus', '==', 'approved'));
    const skilledWorkersSnapshot = await getDocs(skilledWorkersQuery);
    
    console.log(`📊 Found ${skilledWorkersSnapshot.docs.length} approved workers`);
    
    skilledWorkersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n👤 Worker ${index + 1}: ${data.name || 'Unknown'}`);
      console.log('📋 Raw data:', data);
      
      // Test coordinate extraction
      let coordinates = null;
      if (data.latitude && data.longitude) {
        coordinates = { lat: data.latitude, lng: data.longitude };
        console.log('✅ Found coordinates in latitude/longitude fields:', coordinates);
      } else if (data.lat && data.lng) {
        coordinates = { lat: data.lat, lng: data.lng };
        console.log('✅ Found coordinates in lat/lng fields:', coordinates);
      } else if (data.location && data.location.latitude && data.location.longitude) {
        coordinates = { lat: data.location.latitude, lng: data.location.longitude };
        console.log('✅ Found coordinates in location.latitude/longitude fields:', coordinates);
      } else if (data.coordinates && data.coordinates.lat && data.coordinates.lng) {
        coordinates = { lat: data.coordinates.lat, lng: data.coordinates.lng };
        console.log('✅ Found coordinates in coordinates.lat/lng fields:', coordinates);
      } else if (data.geoLocation && data.geoLocation.lat && data.geoLocation.lng) {
        coordinates = { lat: data.geoLocation.lat, lng: data.geoLocation.lng };
        console.log('✅ Found coordinates in geoLocation.lat/lng fields:', coordinates);
      } else {
        console.log('❌ No coordinates found in any expected fields');
        console.log('🔍 Available fields:', Object.keys(data));
      }
    });
    
    console.log('\n🎯 Test completed! Check the results above.');
    
  } catch (error) {
    console.error('❌ Error testing coordinates:', error);
  }
};

// Run the test
console.log('🚀 Starting coordinate extraction test...');
testCoordinateExtraction();
