import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, getDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import app from './firebase';
import { CONFIG } from './config';
 
const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getFirestore(app);
    const jobsQuery = collection(db, 'Job');
    
    const unsubscribe = onSnapshot(jobsQuery, 
      (snapshot) => {
        const allJobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setJobs(allJobs);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching jobs:', error);
        setError(error.message);
      setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  return { jobs, loading, error };
};

 
const useWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
        const db = getFirestore(app);
    const workersQuery = collection(db, 'SkilledWorkers');
    
    const unsubscribe = onSnapshot(workersQuery, 
      (snapshot) => {
        const allWorkers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setWorkers(allWorkers);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching workers:', error);
        setError(error.message);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  return { workers, loading, error };
};


// Job Details Modal Component
const JobDetailsModal = ({ job, isOpen, onClose, onAssign }) => {
  if (!isOpen || !job) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content job-details-modal">
        <div className="modal-header">
          <h2>Job Details</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="job-details-content">
          <div className="job-image-section">
            {job.Image && (
              <img 
                src={job.Image} 
                alt={job.title_en || 'Job Image'} 
                className="job-image"
              />
            )}
          </div>
          
          <div className="job-info-section">
            <h3>{job.title_en || 'Job Title'}</h3>
            <p className="job-service-type">{job.serviceType || 'Service Type'}</p>
            
            <div className="job-details-grid">
            <div className="detail-item">
              <span className="detail-label">📍 Location:</span>
                <span className="detail-value">{job.Location || job.Address || 'N/A'}</span>
          </div>

            <div className="detail-item">
                <span className="detail-label">💰 Price:</span>
                <span className="detail-value">{job.currency} {job.price || 'N/A'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">📱 Poster Phone:</span>
                <span className="detail-value">{job.posterPhone || 'N/A'}</span>
            </div>

            <div className="detail-item">
                <span className="detail-label">📅 Created:</span>
                <span className="detail-value">
                  {job.createdAt ? new Date(job.createdAt.toDate ? job.createdAt.toDate() : job.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">✅ Status:</span>
                <span className={`status-badge ${job.status}`}>{job.status || 'N/A'}</span>
            </div>

            <div className="detail-item">
                <span className="detail-label">👨‍💼 Admin Action:</span>
                <span className={`status-badge ${job.adminAction}`}>{job.adminAction || 'N/A'}</span>
              </div>
            </div>
            
            <div className="job-description">
              <h4>Description (English)</h4>
              <p>{job.description_en || 'No description available'}</p>
        </div>

            {job.description_ur && (
              <div className="job-description">
                <h4>Description (Urdu)</h4>
                <p>{job.description_ur}</p>
                  </div>
            )}
            </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
          {job.status === 'assigned' ? (
            <button 
              className="complete-btn" 
              onClick={() => {
                if (window.confirm('Are you sure you want to mark this job as completed?')) {
                  // Call completion handler - we'll need to pass this from parent
                  window.completeJob?.(job.id);
                  onClose();
                }
              }}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Complete Job
            </button>
          ) : (
            <button className="assign-btn" onClick={() => onAssign(job)}>
              Assign Job
            </button>
          )}
        </div>
      </div>
            </div>
  );
};

// Job Assignment Modal Component
const JobAssignmentModal = ({ job, workers, isOpen, onClose, onAssign }) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const handleAssign = () => {
    if (!selectedWorkerId) {
      alert('Please select a worker to assign this job to');
      return;
    }

    const selectedWorker = workers.find(w => w.id === selectedWorkerId);
    if (selectedWorker) {
      onAssign(job.id, selectedWorkerId, selectedWorker, assignmentNotes);
      onClose();
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content job-assignment-modal">
        <div className="modal-header">
          <h2>Assign Job to Worker</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="job-assignment-content">
          <div className="job-summary">
            <h3>{job.title_en || 'Job Title'}</h3>
            <p><strong>Service Type:</strong> {job.serviceType || 'N/A'}</p>
            <p><strong>Location:</strong> {job.Location || job.Address || 'N/A'}</p>
            <p><strong>Price:</strong> {job.currency} {job.price || 'N/A'}</p>
          </div>

          <div className="worker-selection">
            <h4>Select Worker</h4>
            <select 
              value={selectedWorkerId} 
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="worker-select"
            >
              <option value="">Choose a worker...</option>
              {workers.filter(worker => !worker.jobAssigned && !worker.assignedJobId).map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.Name || worker.displayName || worker.name || 'Unknown Worker'} - {worker.categories?.[0] || 'General'}
                </option>
              ))}
            </select>
          </div>

          {selectedWorkerId && (
            <div className="selected-worker-details">
              {(() => {
                const selectedWorker = workers.find(w => w.id === selectedWorkerId);
                return selectedWorker ? (
                  <div className="worker-card">
                    <div className="worker-info">
                      <img 
                        src={selectedWorker.ProfilePicture || selectedWorker.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedWorker.Name || 'Worker')}&background=4CAF50&color=fff&size=60&bold=true`}
                        alt={selectedWorker.Name || 'Worker'}
                        className="worker-avatar"
                      />
                      <div className="worker-details">
                        <h5>{selectedWorker.Name || selectedWorker.displayName || selectedWorker.name || 'Unknown Worker'}</h5>
                        <p><strong>Phone:</strong> {selectedWorker.phoneNumber || selectedWorker.phone || 'N/A'}</p>
                        <p><strong>City:</strong> {selectedWorker.City || selectedWorker.city || 'N/A'}</p>
                        <p><strong>Skills:</strong> {selectedWorker.categories?.join(', ') || selectedWorker.skills?.join(', ') || 'N/A'}</p>
                        <p><strong>Status:</strong> <span className={`status-badge ${selectedWorker.approvalStatus || 'pending'}`}>{selectedWorker.approvalStatus || 'pending'}</span></p>
                </div>
                </div>
              </div>
                ) : null;
              })()}
            </div>
          )}

          <div className="assignment-notes">
            <h4>Assignment Notes (Optional)</h4>
                <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Add any special instructions or notes for this assignment..."
                  rows="3"
              className="notes-textarea"
                />
              </div>

          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="assign-btn" onClick={handleAssign}>
              Assign Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map Component with Job Markers
const MapComponent = ({ jobs, onJobClick }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      try {
        if (!window.google || !window.google.maps) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places,geometry&v=weekly`;
          script.async = true;
          script.defer = true;
          
          await new Promise((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = (error) => reject(error);
            document.head.appendChild(script);
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (isMounted && mapRef.current && window.google && window.google.maps) {
          const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: CONFIG.PAKISTAN_CENTER,
            zoom: CONFIG.DEFAULT_ZOOM,
            mapTypeId: 'roadmap'
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

  // Create job markers
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Filter jobs with valid coordinates and available status
    const jobsWithCoordinates = jobs.filter(job => {
      return job.Latitude && job.Longitude && 
             typeof job.Latitude === 'number' && 
             typeof job.Longitude === 'number' &&
             job.status !== 'assigned' &&
             job.status !== 'completed' &&
             job.status !== 'cancelled' &&
             !job.assignedWorkerId;
    });

    console.log('🗺️ Creating markers for jobs:', jobsWithCoordinates.length);

    const newMarkers = jobsWithCoordinates.map((job) => {
      const position = {
        lat: job.Latitude,
        lng: job.Longitude
      };

      // Create custom job marker
      const markerIcon = {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20)
      };

        const marker = new window.google.maps.Marker({
        position: position,
          map: map,
        title: job.title_en || 'Job',
        icon: markerIcon
      });

      // Create info window content
      const infoWindowContent = `
        <div style="padding: 10px; min-width: 200px;">
          <div style="margin-bottom: 10px;">
            <h3 style="margin: 0; color: #333; font-size: 16px;">${job.title_en || 'Job'}</h3>
            <p style="margin: 0; color: #666; font-size: 12px;">${job.serviceType || 'Service'}</p>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>📍 Location:</strong> ${job.Location || job.Address || 'N/A'}<br>
            <strong>💰 Price:</strong> ${job.currency} ${job.price || 'N/A'}<br>
            <strong>📱 Phone:</strong> ${job.posterPhone || 'N/A'}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>📝 Description:</strong><br>
            <span style="color: #666; font-size: 12px;">${job.description_en || 'No description'}</span>
          </div>
          <div style="text-align: center; margin-top: 10px;">
            <button onclick="window.openJobDetails('${job.id}')" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              View Details
            </button>
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent
        });

        // Add click listener
        marker.addListener('click', () => {
        // Close any existing info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });
        
        // Open info window
        infoWindow.open(map, marker);
        
        // Trigger job click
        onJobClick(job);
      });

      marker.infoWindow = infoWindow;
        return marker;
    });

    markersRef.current = newMarkers;

    // Auto-center map on jobs if we have any
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      
      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 15) map.setZoom(15);
          window.google.maps.event.removeListener(listener);
        });
      }
    }

    return () => {
      newMarkers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
    };
  }, [map, jobs, onJobClick]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
    </div>
  );
};

// Main MapView Component
const MapView = () => {
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();
  const { workers, loading: workersLoading, error: workersError } = useWorkers();
  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedJobForAssignment, setSelectedJobForAssignment] = useState(null);

  // Global function for info window button
  useEffect(() => {
    window.openJobDetails = (jobId) => {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setSelectedJob(job);
        setIsJobModalOpen(true);
      }
    };
    
    // Global function for job completion
    window.completeJob = (jobId) => {
      handleJobCompletion(jobId);
    };
  }, [jobs]);


  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  const handleAssignJob = (job) => {
    setSelectedJobForAssignment(job);
    setIsAssignmentModalOpen(true);
  };

  async function getFcmToken(userId) {
    try {
      const db = getFirestore(app);
      const docRef = doc(db, "Tokens", userId); 
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.fcmToken || null;
      } else {
        console.log("No such user!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  }

  const handleJobAssignment = async (jobId, workerId, worker, notes) => {
    try {

      const db = getFirestore(app);
      const fcmToken = await getFcmToken(workerId);
      console.log("FCM Token:", fcmToken);
      // Find the job details
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        alert('Job not found!');
        return;
      }

      // Check if job is already assigned
      if (job.status === 'assigned' || job.assignedWorkerId) {
        alert('This job has already been assigned to another worker!');
        return;
      }

      // Check if worker already has a job assigned
      if (worker.jobAssigned || worker.assignedJobId) {
        alert('This worker already has a job assigned! Please select another worker.');
        return;
      }

      // Create assigned job document
      const assignedJobData = {
        // Job Details
        jobId: jobId,
        jobTitle: job.title_en || 'Job Title',
        jobTitleUrdu: job.title_ur || job.title_en || 'Job Title',
        jobDescription: job.description_en || 'No description',
        jobDescriptionUrdu: job.description_ur || job.description_en || 'No description',
        jobServiceType: job.serviceType || 'General',
        jobLocation: job.Location || job.Address || 'N/A',
        jobLocationAddress: job.Address || job.Location || 'N/A',
        jobLocationCoordinates: {
          latitude: job.Latitude || null,
          longitude: job.Longitude || null
        },
        jobPrice: job.price || 0,
        jobCurrency: job.currency || 'PKR',
        jobImage: job.Image || null,
        jobCreatedAt: job.createdAt,
        jobStatus: job.status || 'pending',
        jobAdminAction: job.adminAction || 'pending',
        
        // Job Poster Details
        jobPosterId: job.jobPosterId || 'unknown',
        jobPosterPhone: job.posterPhone || 'N/A',
        jobPosterName: 'Job Poster', // You might want to fetch this from JobPosters collection
        
        // Skilled Worker Details
        workerId: workerId,
        workerName: worker.Name || worker.displayName || worker.name || 'Unknown Worker',
        workerPhone: worker.phoneNumber || worker.phone || 'N/A',
        workerEmail: worker.email || 'N/A',
        workerCity: worker.City || worker.city || 'N/A',
        workerAddress: worker.currentAddress || worker.City || worker.city || 'N/A',
        workerLocationCoordinates: {
          latitude: worker.currentLocation?.latitude || worker.currentLatitude || worker.latitude || null,
          longitude: worker.currentLocation?.longitude || worker.currentLongitude || worker.longitude || null
        },
        workerAge: worker.Age || worker.age || 'N/A',
        workerCNIC: worker.cnic || 'N/A',
        workerSkills: worker.categories || worker.skills || [],
        workerProfileImage: worker.ProfilePicture || worker.profileImage || null,
        workerRating: worker.averageRating || worker.rating || 0,
        workerExperience: worker.experience || '0',
        workerApprovalStatus: worker.approvalStatus || 'pending',
        workerIsVerified: worker.isVerified || false,
        workerIsActive: worker.isActive !== false,
        
        // Assignment Details
        assignmentNotes: notes || '',
        assignedAt: new Date(),
        assignedBy: 'admin', // Since this is admin panel
        assignedByName: 'Admin User',
        assignmentStatus: 'assigned', // assigned, in_progress, completed, cancelled
        assignmentId: `assignment_${jobId}_${workerId}_${Date.now()}`,
        
        // Location Distance (if both coordinates available)
        distanceBetweenLocations: (() => {
          const jobLat = job.Latitude;
          const jobLng = job.Longitude;
          const workerLat = worker.currentLocation?.latitude || worker.currentLatitude || worker.latitude;
          const workerLng = worker.currentLocation?.longitude || worker.currentLongitude || worker.longitude;
          
          if (jobLat && jobLng && workerLat && workerLng) {
            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in kilometers
            const dLat = (workerLat - jobLat) * Math.PI / 180;
            const dLng = (workerLng - jobLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(jobLat * Math.PI / 180) * Math.cos(workerLat * Math.PI / 180) *
                     Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            return Math.round(distance * 100) / 100; // Round to 2 decimal places
          }
          return null;
        })(),
        
        // System Fields
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // Save to AssignedJobs collection
      const docRef = await addDoc(collection(db, 'AssignedJobs'), assignedJobData);
      
      // Update the original job to mark as assigned
      const jobRef = doc(db, 'Job', jobId);
      await updateDoc(jobRef, {
        status: 'assigned',
        assignedWorkerId: workerId,
        assignedWorkerName: worker.Name || worker.displayName || worker.name,
        assignedAt: new Date(),
        assignedJobId: docRef.id
      });

      // Update worker to mark as assigned
      const workerRef = doc(db, 'SkilledWorkers', workerId);
      await updateDoc(workerRef, {
        jobAssigned: true,
        assignedJobId: docRef.id,
        jobAssignedAt: new Date(),
        currentJobId: jobId
      });

      // Create a notification document for the assigned worker
      try {
        const notifRef = await addDoc(collection(db, 'Notifications'), {
          userId: workerId,
          userType: 'skilled_worker',
          title: 'Job Assigned',
          body: 'Open the app to view details.',
          type: 'job_assigned',
          assignedJobId: docRef.id,
          data: {
            jobId,
            assignmentId: docRef.id,
            jobTitle: assignedJobData.jobTitle,
            jobLocation: assignedJobData.jobLocation,
            workerName: assignedJobData.workerName
          },
          read: false,
          createdAt: serverTimestamp()
        });

        // Store notificationId on the assignment for traceability
        await updateDoc(doc(db, 'AssignedJobs', docRef.id), {
          notificationId: notifRef.id
        });
      } catch (notifDocErr) {
        console.warn('Failed to create Notifications document:', notifDocErr);
      }

      // Send push notification with assigned job details to the worker app
      try {
        let fcmToken = worker.fcmToken || worker.pushToken || worker.notificationToken;
        if (!fcmToken) {
          try {
            const workerSnap = await getDoc(doc(db, 'Tokens', workerId));
            if (workerSnap.exists()) {
              fcmToken = workerSnap.data()?.fcmToken;
            }
          } catch (readTokenErr) {
            console.warn('Could not read fcmToken from Firestore:', readTokenErr);
          }
        }
        if (fcmToken) {
          // const res = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/createNotificationAndSend`, {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({
          //     userId: workerId,
          //     userType: 'skilled_worker',
          //     title: 'Job Assigned',
          //     body: 'Open the app to view details.',
          //     type: 'job_assigned',
          //     assignedJobId: docRef.id,
          //     data: {
          //       jobId,
          //       assignmentId: docRef.id,
          //       jobTitle: assignedJobData.jobTitle,
          //       jobLocation: assignedJobData.jobLocation,
          //       workerName: assignedJobData.workerName
          //     },
          //     fcmToken
          //   })
          // });
          const res = async (userId) => {

            const res = await fetch(
              "https://us-central1-skillzaar-bcb0f.cloudfunctions.net/createNotificationAndSend",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: userId,
                  title: "Job Assigned",
                  body: "Open the app to view details.",
                }),
              }
            );
          
            const data = await res.json();

            console.log("Notification response:", data);
          };
          res(workerId);
console.log("Notification response:", res);
          // if (res.ok) {
          //   const json = await res.json().catch(() => ({}));
          //   const notificationId = json?.id;
          //   // Save trace of notification on AssignedJobs
          //   await updateDoc(doc(db, 'AssignedJobs', docRef.id), {
          //     notificationId: notificationId || null,
          //     notifySent: true,
          //     notifiedAt: new Date()
          //   });
          // } else {
          //   const errorText = await res.text().catch(() => '');
          //   console.warn('Notification API responded with non-OK status', res.status, errorText);
          //   await updateDoc(doc(db, 'AssignedJobs', docRef.id), {
          //     notifySent: false
          //   });
          // }
        } else {
          console.warn('No FCM token found for worker; skipping push. Ensure SkilledWorkers doc has fcmToken.');
          await updateDoc(doc(db, 'AssignedJobs', docRef.id), {
            notifySent: false
          });
        }
      } catch (notifErr) {
        console.error('Failed to send assignment notification:', notifErr);
        try {
          await updateDoc(doc(db, 'AssignedJobs', docRef.id), {
            notifySent: false
          });
        } catch {}
      }

      console.log('Job assigned successfully! Assignment ID:', docRef.id);
      alert(`Job assigned to ${worker.Name || worker.displayName || worker.name}! Assignment saved to AssignedJobs collection.`);
      
    } catch (error) {
      console.error('Error assigning job:', error);
      alert('Error assigning job. Please try again.');
    }
  };

  const handleCloseJobModal = () => {
    setIsJobModalOpen(false);
    setSelectedJob(null);
  };

  const handleCloseAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setSelectedJobForAssignment(null);
  };

  // Function to handle job completion
  const handleJobCompletion = async (jobId) => {
    try {
      const db = getFirestore(app);
      const jobRef = doc(db, 'Job', jobId);
      
      // Update job status to completed
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: new Date()
      });

      // Find and update the assigned job record
      const assignedJobsQuery = query(
        collection(db, 'AssignedJobs'),
        where('jobId', '==', jobId)
      );
      const assignedJobsSnapshot = await getDocs(assignedJobsQuery);
      
      if (!assignedJobsSnapshot.empty) {
        const assignedJobDoc = assignedJobsSnapshot.docs[0];
        await updateDoc(doc(db, 'AssignedJobs', assignedJobDoc.id), {
          assignmentStatus: 'completed',
          completedAt: new Date()
        });

        // Update worker status
        const assignedJobData = assignedJobDoc.data();
        if (assignedJobData.workerId) {
          const workerRef = doc(db, 'SkilledWorkers', assignedJobData.workerId);
          await updateDoc(workerRef, {
            jobAssigned: false,
            assignedJobId: null,
            currentJobId: null,
            jobCompletedAt: new Date()
          });
        }
      }

      console.log('Job marked as completed and removed from map');
      alert('Job completed successfully! It has been removed from the map.');
      
    } catch (error) {
      console.error('Error completing job:', error);
      alert('Error completing job. Please try again.');
    }
  };

  const loading = jobsLoading || workersLoading;
  const error = jobsError || workersError;

  if (loading) {
    return (
      <div className="map-view-container">
        <div className="map-header">
          <h2>Jobs Map View</h2>
          <p>Loading map...</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading map, jobs, and workers data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-view-container">
        <div className="map-header">
          <h2>Jobs Map View</h2>
          <p>Error loading map</p>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h3>❌ Error Loading Map</h3>
            <p>{error}</p>
            <p>Please check your internet connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view-container">
      <div className="map-header">
        <h2>Jobs Map View</h2>
        <p>Real-time map of available jobs ({jobs.length} jobs)</p>
      </div>

      <div className="map-content">
        <MapComponent jobs={jobs} onJobClick={handleJobClick} />
          </div>

      <JobDetailsModal 
        job={selectedJob} 
        isOpen={isJobModalOpen} 
        onClose={handleCloseJobModal}
        onAssign={handleAssignJob}
      />

      <JobAssignmentModal 
        job={selectedJobForAssignment}
        workers={workers}
        isOpen={isAssignmentModalOpen}
        onClose={handleCloseAssignmentModal}
        onAssign={handleJobAssignment}
      />
    </div>
  );
};

export default MapView;