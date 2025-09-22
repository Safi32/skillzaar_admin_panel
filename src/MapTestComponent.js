import React from 'react';

// Test component to verify map functionality
const MapTestComponent = () => {
  const testWorkerData = {
    id: 'test-worker-1',
    name: 'Test Worker',
    phone: '+92-300-1234567',
    city: 'Islamabad',
    coordinates: { lat: 33.6844, lng: 73.0479 },
    profileImage: 'https://ui-avatars.com/api/?name=Test+Worker&background=4CAF50&color=fff&size=80&bold=true',
    skills: ['Plumbing', 'Electrical'],
    rating: 4.5,
    jobAssigned: false
  };

  const handleTestClick = () => {
    console.log('Test worker data:', testWorkerData);
    // You can use this data to test marker creation
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      zIndex: 1000
    }}>
      <h4>Map Test</h4>
      <p>Test Worker Data:</p>
      <pre style={{ fontSize: '12px' }}>
        {JSON.stringify(testWorkerData, null, 2)}
      </pre>
      <button onClick={handleTestClick}>Test Marker Creation</button>
    </div>
  );
};

export default MapTestComponent;
