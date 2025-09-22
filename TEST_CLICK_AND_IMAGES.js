// Test script to verify click functionality and profile images
// Run this in browser console to test

const testClickAndImages = () => {
  console.log('🧪 Testing click functionality and profile images...');
  
  // Test 1: Check if markers are clickable
  console.log('1. Checking for clickable markers...');
  const markers = document.querySelectorAll('[title]');
  console.log(`Found ${markers.length} markers with titles`);
  
  // Test 2: Check if profile images are loading
  console.log('2. Checking profile images...');
  const images = document.querySelectorAll('img[src*="firebasestorage"]');
  console.log(`Found ${images.length} Firebase Storage images`);
  
  images.forEach((img, index) => {
    console.log(`Image ${index + 1}:`, img.src);
    img.onload = () => console.log(`✅ Image ${index + 1} loaded successfully`);
    img.onerror = () => console.log(`❌ Image ${index + 1} failed to load`);
  });
  
  // Test 3: Check for modal elements
  console.log('3. Checking for modal elements...');
  const modals = document.querySelectorAll('[role="dialog"], .modal, .job-assignment-modal');
  console.log(`Found ${modals.length} modal elements`);
  
  // Test 4: Check for click events
  console.log('4. Adding test click listeners...');
  markers.forEach((marker, index) => {
    marker.addEventListener('click', () => {
      console.log(`🎯 Test click on marker ${index + 1}:`, marker.title);
    });
  });
  
  console.log('✅ Test setup complete! Try clicking on markers and check console for logs.');
};

// Run the test
testClickAndImages();
