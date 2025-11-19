import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import app from './firebase';
import { CONFIG, PAKISTAN_CITIES } from './config';
import JobAssignmentModal from './JobAssignmentModal';

// Global variable to track if Google Maps is loaded
let isGoogleMapsLoaded = false;
let googleMapsLoadPromise = null;

// Function to load Google Maps script
const loadGoogleMaps = () => {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }
  
  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
};

const MapComponent = ({ users, onUserClick, onJobAssignment }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  // Initialize map
  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      try {
        await loadGoogleMaps();
        
        if (isMounted && mapRef.current && window.google) {
          const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: CONFIG.PAKISTAN_CENTER,
            zoom: CONFIG.DEFAULT_ZOOM,
            mapTypeId: 'roadmap',
            styles: [
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
              },
              {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry.fill',
                stylers: [{ color: '#ffffff' }, { lightness: 17 }]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
              },
              {
                featureType: 'road.arterial',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }, { lightness: 18 }]
              },
              {
                featureType: 'road.local',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }, { lightness: 16 }]
              },
              {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
              },
              {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#dedede' }, { lightness: 21 }]
              }
            ]
          });

          if (isMounted) {
            setMap(mapInstance);
          }
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Create markers for users
  useEffect(() => {
    if (!map || !window.google) {
      console.log('Map or Google Maps not ready:', { map: !!map, google: !!window.google });
      return;
    }

    console.log('Creating markers for users:', users.length);

    // Clear existing markers
    markers.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });

    const newMarkers = users.map((user, index) => {
      // Get coordinates for user - prioritize stored coordinates, then city, then random
      let coordinates;
      
      if (user.coordinates && user.coordinates.lat && user.coordinates.lng) {
        // Use stored coordinates from Firebase
        coordinates = user.coordinates;
        console.log(`Using stored coordinates for ${user.name}:`, coordinates);
      } else if (user.city && PAKISTAN_CITIES[user.city.toLowerCase()]) {
        // Use city coordinates
        coordinates = PAKISTAN_CITIES[user.city.toLowerCase()];
        console.log(`Using city coordinates for ${user.name}:`, coordinates);
      } else {
        // Generate random coordinates within Rawalpindi-Islamabad area
        coordinates = {
          lat: CONFIG.PAKISTAN_CENTER.lat + (Math.random() - 0.2) * 0.5, // Smaller range for twin cities
          lng: CONFIG.PAKISTAN_CENTER.lng + (Math.random() - 0.2) * 0.5
        };
        console.log(`Using random coordinates for ${user.name}:`, coordinates);
      }

      // Create custom marker with user image (perfectly circular, no blinking)
      let markerIcon;
      try {
        // Get the profile image URL
        const imageUrl = user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4CAF50&color=fff&size=50&bold=true`;
        
        console.log(`🖼️ Creating marker for ${user.name} with image:`, imageUrl);
        
        // Create a perfectly circular marker using SVG
        const uniqueId = `circleClip_${user.id}_${Date.now()}`;
        const svgIcon = `
          <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="${uniqueId}">
                <circle cx="30" cy="30" r="25"/>
              </clipPath>
            </defs>
            <!-- White background circle -->
            <circle cx="30" cy="30" r="25" fill="white" stroke="#4CAF50" stroke-width="3"/>
            <!-- User image with circular clipping -->
            <image href="${imageUrl}" x="5" y="5" width="50" height="50" clip-path="url(#${uniqueId})" onerror="this.style.display='none'"/>
          </svg>
        `;
        
        markerIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
          scaledSize: new window.google.maps.Size(60, 60),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(30, 30) // Center the circular image
        };
        
        console.log(`✅ Created circular marker icon for ${user.name}`);
      } catch (error) {
        console.log('❌ Error creating custom icon, using fallback:', error);
        // Fallback to simple circular avatar
        markerIcon = {
          url: user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4CAF50&color=fff&size=50&bold=true`,
          scaledSize: new window.google.maps.Size(50, 50),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(25, 25)
        };
      }

      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: map,
        title: user.name,
        icon: markerIcon,
        // Completely remove animation to stop blinking
        // animation: undefined, // Don't set animation property at all
        // Add name label below the marker (like Indrive)
        label: {
          text: user.name.split(' ')[0], // Show only first name to avoid overflow
          color: '#333',
          fontSize: '12px',
          fontWeight: 'bold',
          className: 'marker-label'
        }
      });

      console.log(`Created marker for ${user.name} at:`, coordinates);

      // Add click listener
      marker.addListener('click', () => {
        console.log(`🎯 Marker clicked for ${user.name}`);
        console.log('👤 User data:', user);
        console.log('🔧 Setting selected user and opening modal...');
        
        // Set the selected user
        setSelectedUser(user);
        
        // Open the job assignment modal
        setShowJobModal(true);
        
        // Call the parent click handler
        if (onUserClick) {
          onUserClick(user);
        }
        
        console.log('✅ Modal should be open now');
        console.log('📊 Modal state:', { selectedUser: !!user, showJobModal: true });
      });

      // Create info window with user image and details
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 15px; font-family: Arial, sans-serif; min-width: 250px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <img src="${user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4CAF50&color=fff&size=50&bold=true`}" 
                   style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px; border: 2px solid ${user.jobAssigned ? '#ff4444' : '#4CAF50'};" 
                   alt="${user.name}">
              <div>
                <h3 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">${user.name}</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">${user.role}</p>
              </div>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 10px;">
              <p style="margin: 4px 0; color: #666; font-size: 13px;">
                <strong>⭐ Rating:</strong> ${user.rating}/5.0
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 13px;">
                <strong>📍 Location:</strong> ${user.location || user.city || 'Rawalpindi-Islamabad'}
              </p>
              <p style="margin: 4px 0; color: #666; font-size: 13px;">
                <strong>📞 Phone:</strong> ${user.phone || 'N/A'}
              </p>
              <p style="margin: 8px 0 0 0; color: ${user.jobAssigned ? '#ff4444' : '#4CAF50'}; font-weight: bold; font-size: 14px; text-align: center; padding: 5px; background: ${user.jobAssigned ? '#ffebee' : '#e8f5e8'}; border-radius: 5px;">
                ${user.jobAssigned ? '🔴 Job Assigned' : '🟢 Available for Jobs'}
              </p>
              <p style="margin: 8px 0 0 0; color: #666; font-size: 12px; text-align: center;">
                Click marker to assign job
              </p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);
    console.log(`Total markers created: ${newMarkers.length}`);
    
    // Add a test marker at the center to verify map is working
    if (newMarkers.length === 0) {
      console.log('No user markers, adding test marker at center');
      const testMarker = new window.google.maps.Marker({
        position: CONFIG.PAKISTAN_CENTER,
        map: map,
        title: 'Test Marker - Map Center',
        label: {
          text: 'TEST',
          color: '#ff0000',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      });
      console.log('Test marker added at center:', CONFIG.PAKISTAN_CENTER);
    }

    // Cleanup function
    return () => {
      newMarkers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
    };
  }, [map, users, markers, onUserClick]);

  const handleJobAssignment = (userId, jobId) => {
    onJobAssignment(userId, jobId);
    setShowJobModal(false);
    setSelectedUser(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
      
      {/* Map Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Map Controls</h4>
        <button
          onClick={() => map && map.setCenter(CONFIG.PAKISTAN_CENTER) && map.setZoom(CONFIG.DEFAULT_ZOOM)}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginRight: '5px'
          }}
        >
          Reset View
        </button>
        <button
          onClick={() => map && map.setZoom(map.getZoom() + 1)}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginRight: '5px'
          }}
        >
          Zoom In
        </button>
        <button
          onClick={() => map && map.setZoom(map.getZoom() - 1)}
          style={{
            background: '#FF9800',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Zoom Out
        </button>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Legend</h4>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#4CAF50',
            marginRight: '8px'
          }}></div>
          <span style={{ fontSize: '12px' }}>Available Workers</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ff4444',
            marginRight: '8px'
          }}></div>
          <span style={{ fontSize: '12px' }}>Assigned Workers</span>
        </div>
      </div>

      {/* Job Assignment Modal */}
      {selectedUser && (
        <div>
          {console.log('🎭 Rendering JobAssignmentModal with user:', selectedUser.name, 'isOpen:', showJobModal)}
          <JobAssignmentModal
            user={selectedUser}
            isOpen={showJobModal}
            onClose={() => {
              console.log('❌ Closing modal...');
              setShowJobModal(false);
              setSelectedUser(null);
            }}
            onJobAssigned={handleJobAssignment}
          />
        </div>
      )}
    </div>
  );
};

const RealTimeMap = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time data fetching from Firebase
  useEffect(() => {
    const db = getFirestore(app);
    
    console.log('🔄 Setting up real-time listener for SkilledWorkers...');
    
    // Set up real-time listener for SkilledWorkers collection
    const skilledWorkersQuery = collection(db, 'SkilledWorkers');
    const unsubscribe = onSnapshot(skilledWorkersQuery, (snapshot) => {
      console.log('📡 Real-time update received:', snapshot.docs.length, 'workers');
      
      const allWorkers = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('👷 Processing worker:', data.Name || 'Unknown');
        
        // Extract coordinates from various possible field names
        let coordinates = null;
        if (data.currentLatitude && data.currentLongitude) {
          coordinates = { lat: data.currentLatitude, lng: data.currentLongitude };
        } else if (data.latitude && data.longitude) {
          coordinates = { lat: data.latitude, lng: data.longitude };
        } else if (data.lat && data.lng) {
          coordinates = { lat: data.lat, lng: data.lng };
        } else if (data.location && data.location.latitude && data.location.longitude) {
          coordinates = { lat: data.location.latitude, lng: data.location.longitude };
        } else if (data.coordinates && data.coordinates.lat && data.coordinates.lng) {
          coordinates = { lat: data.coordinates.lat, lng: data.coordinates.lng };
        } else if (data.geoLocation && data.geoLocation.lat && data.geoLocation.lng) {
          coordinates = { lat: data.geoLocation.lat, lng: data.geoLocation.lng };
        } else if (data.currentLocation && data.currentLocation.latitude && data.currentLocation.longitude) {
          coordinates = { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude };
        }
        
        // If no coordinates found, generate random ones within Rawalpindi-Islamabad area
        if (!coordinates) {
          coordinates = {
            lat: CONFIG.PAKISTAN_CENTER.lat + (Math.random() - 0.5) * 0.3,
            lng: CONFIG.PAKISTAN_CENTER.lng + (Math.random() - 0.5) * 0.3
          };
          console.log('📍 Generated random coordinates for', data.Name, ':', coordinates);
        }
        
        console.log('📍 Coordinates for', data.Name, ':', coordinates);
        
        allWorkers.push({
          id: doc.id,
          ...data,
          userType: 'skilled_worker',
          // Map fields to match your data structure
          name: data.Name || data.displayName || data.name || 'Unknown',
          role: data.categories && data.categories.length > 0 ? data.categories[0] : 'General',
          rating: data.averageRating || data.rating || 4.0,
          phone: data.phoneNumber || data.userPhone || data.phone || 'N/A',
          email: data.email || 'N/A',
          city: data.City || data.city || 'Rawalpindi-Islamabad',
          location: data.currentAddress || data.City || 'Rawalpindi-Islamabad',
          profileImage: data.ProfilePicture || data.profileImage || data.profilePicture || data.image || data.avatar || data.photo,
          jobAssigned: data.status === 'busy' || data.jobAssigned || data.approvalStatus === 'assigned' || false,
          assignedJobId: data.assignedJobId || null,
          jobAssignedAt: data.jobAssignedAt || null,
          // Store coordinates for marker positioning
          coordinates: coordinates,
          // Additional fields from your data
          age: data.Age || data.age,
          experience: data.experience,
          availability: data.availability !== false,
          isOnline: data.isOnline || false,
          workingRadiusKm: data.workingRadiusKm || data.workingRadius || 10,
          rate: data.rate,
          // Approval status
          approvalStatus: data.approvalStatus || 'pending',
          isApproved: data.isApproved || false,
          // Skills
          skills: data.categories || data.skills || [],
          // Description
          description: data.description || 'Skilled worker'
        });
      });
      
      console.log('✅ Processed', allWorkers.length, 'skilled workers');
      console.log('👥 Workers data:', allWorkers);
      
      setUsers(allWorkers);
      setLoading(false);
      
    }, (error) => {
      console.error('❌ Error in real-time listener:', error);
      setError(error.message);
      setLoading(false);
    });
    
    // Cleanup listener on unmount
    return () => {
      console.log('🧹 Cleaning up real-time listener');
      unsubscribe();
    };
  }, []);

  const handleUserClick = (user) => {
    console.log('User clicked in RealTimeMap:', user);
    console.log('User details:', {
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
      location: user.location,
      profileImage: user.profileImage
    });
  };

  const handleJobAssignment = (userId, jobId) => {
    console.log('Job assigned:', userId, jobId);
    // Update local state
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, jobAssigned: true, assignedJobId: jobId }
          : user
      )
    );
  };

  // Only render if we have a valid API key
  if (!CONFIG.GOOGLE_MAPS_API_KEY || CONFIG.GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY") {
    return (
      <div className="map-error">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔑</div>
          <div>Google Maps API Key Required</div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            Please add your Google Maps API key to the environment variables
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {loading ? (
        <div className="map-loading">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>👷</div>
            <div>Loading workers data...</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Fetching real-time worker locations
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="map-error">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
            <div>Error: {error}</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Check your Firebase connection
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            marginBottom: '10px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>
              Real-time Worker Locations - Rawalpindi & Islamabad
            </h3>
            <p style={{ margin: '0', color: '#6c757d' }}>
              {users.length} skilled workers available • Click on markers to view details and assign jobs
            </p>
          </div>
          <MapComponent 
            users={users} 
            onUserClick={handleUserClick}
            onJobAssignment={handleJobAssignment}
          />
          {console.log('🗺️ Rendering MapComponent with users:', users.length, 'click handler:', !!handleUserClick)}
        </div>
      )}
    </div>
  );
};

export default RealTimeMap;
