// Test script specifically for your SkilledWorkers data structure
// Run this in browser console to verify the field mapping

const testYourDataStructure = async () => {
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
    
    console.log('🔍 Testing your SkilledWorkers data structure...');
    
    // Get all SkilledWorkers
    const skilledWorkersQuery = query(collection(db, 'SkilledWorkers'), where('approvalStatus', '==', 'approved'));
    const skilledWorkersSnapshot = await getDocs(skilledWorkersQuery);
    
    console.log(`📊 Found ${skilledWorkersSnapshot.docs.length} approved workers`);
    
    skilledWorkersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n👤 Worker ${index + 1}: ${data.Name || data.displayName || 'Unknown'}`);
      
      // Test coordinate extraction
      let coordinates = null;
      if (data.currentLatitude && data.currentLongitude) {
        coordinates = { lat: data.currentLatitude, lng: data.currentLongitude };
        console.log('✅ Found coordinates in currentLatitude/currentLongitude:', coordinates);
      } else {
        console.log('❌ No coordinates found in currentLatitude/currentLongitude');
      }
      
      // Test profile image
      const profileImage = data.ProfilePicture || data.profileImage || data.profilePicture || data.image || data.avatar || data.photo;
      if (profileImage) {
        console.log('✅ Found profile image:', profileImage);
      } else {
        console.log('❌ No profile image found');
      }
      
      // Test other important fields
      console.log('📋 Field mapping test:');
      console.log('  Name:', data.Name || data.displayName || '❌ Not found');
      console.log('  Role:', data.categories && data.categories.length > 0 ? data.categories[0] : '❌ Not found');
      console.log('  Rating:', data.averageRating || data.rating || '❌ Not found');
      console.log('  Phone:', data.phoneNumber || data.userPhone || '❌ Not found');
      console.log('  City:', data.City || '❌ Not found');
      console.log('  Address:', data.currentAddress || '❌ Not found');
      console.log('  Availability:', data.availability !== undefined ? data.availability : '❌ Not found');
      console.log('  Is Online:', data.isOnline !== undefined ? data.isOnline : '❌ Not found');
      console.log('  Rate:', data.rate || '❌ Not found');
      console.log('  Experience:', data.experience || '❌ Not found');
      console.log('  Age:', data.Age || '❌ Not found');
    });
    
    console.log('\n🎯 Test completed! Check the field mapping results above.');
    
  } catch (error) {
    console.error('❌ Error testing data structure:', error);
  }
};

// Run the test
console.log('🚀 Starting data structure test...');
testYourDataStructure();
