import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import app from './firebase';

const JobAssignmentModal = ({ user, isOpen, onClose, onJobAssigned }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: '',
    urgency: 'medium',
    pay: '',
    category: user?.role || 'General'
  });

  // Fetch available jobs from Firebase
  useEffect(() => {
    if (isOpen) {
      fetchAvailableJobs();
    }
  }, [isOpen]);

  const fetchAvailableJobs = async () => {
    try {
      const db = getFirestore(app);
      const jobsQuery = query(
        collection(db, 'Jobs'),
        where('status', '==', 'pending'),
        where('assignedWorkerId', '==', null)
      );
      
      const snapshot = await getDocs(jobsQuery);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleJobAssignment = async (jobId) => {
    if (!user || !jobId) return;

    // Check if worker already has a job assigned
    if (user.jobAssigned || user.assignedJobId) {
      alert('This worker already has a job assigned! Please select another worker.');
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      
      // Update job with assigned worker
      const jobRef = doc(db, 'Jobs', jobId);
      await updateDoc(jobRef, {
        assignedWorkerId: user.id,
        assignedWorkerName: user.name,
        status: 'assigned',
        assignedAt: new Date()
      });

      // Update worker with assigned job
      const workerRef = doc(db, 'SkilledWorkers', user.id);
      await updateDoc(workerRef, {
        jobAssigned: true,
        assignedJobId: jobId,
        jobAssignedAt: new Date()
      });

      onJobAssigned(user.id, jobId);
      onClose();
      alert(`Job assigned to ${user.name} successfully!`);
    } catch (error) {
      console.error('Error assigning job:', error);
      alert('Error assigning job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description || !newJob.location) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      
      const jobData = {
        ...newJob,
        status: 'assigned',
        assignedWorkerId: user.id,
        assignedWorkerName: user.name,
        createdBy: 'admin',
        createdAt: new Date(),
        assignedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'Jobs'), jobData);

      // Update worker with assigned job
      const workerRef = doc(db, 'SkilledWorkers', user.id);
      await updateDoc(workerRef, {
        jobAssigned: true,
        assignedJobId: docRef.id,
        jobAssignedAt: new Date()
      });

      onJobAssigned(user.id, docRef.id);
      onClose();
      alert(`New job created and assigned to ${user.name} successfully!`);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error creating job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Assign Job to {user.name}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Worker Info */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Worker Information</h4>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <img 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4CAF50&color=fff&size=80&bold=true`}
              alt={user.name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                marginRight: '15px',
                border: `3px solid ${user.jobAssigned ? '#ff4444' : '#4CAF50'}`,
                objectFit: 'cover'
              }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '20px' }}>{user.name}</h3>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '16px' }}>{user.role}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: '#ffc107', fontSize: '16px' }}>⭐ {user.rating}/5.0</span>
                <span style={{ 
                  color: user.jobAssigned ? '#ff4444' : '#4CAF50', 
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: user.jobAssigned ? '#ffebee' : '#e8f5e8',
                  fontSize: '12px'
                }}>
                  {user.jobAssigned ? 'Job Assigned' : 'Available'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <p style={{ margin: '5px 0' }}><strong>📍 Location:</strong> {user.location || user.city || 'Rawalpindi-Islamabad'}</p>
            <p style={{ margin: '5px 0' }}><strong>📞 Phone:</strong> {user.phone || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>📧 Email:</strong> {user.email || 'N/A'}</p>
            <p style={{ margin: '5px 0' }}><strong>🆔 ID:</strong> {user.id}</p>
          </div>
        </div>

        {/* Available Jobs */}
        <div style={{ marginBottom: '20px' }}>
          <h4>Available Jobs</h4>
          {jobs.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No available jobs at the moment</p>
          ) : (
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    background: selectedJob?.id === job.id ? '#e3f2fd' : 'white'
                  }}
                  onClick={() => setSelectedJob(job)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h5 style={{ margin: '0 0 5px 0' }}>{job.title}</h5>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>{job.description}</p>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                        📍 {job.location} • {job.urgency} • ₨{job.pay}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobAssignment(job.id);
                      }}
                      disabled={loading}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {loading ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create New Job */}
        <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
          <h4>Create New Job</h4>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Job Title *</label>
              <input
                type="text"
                value={newJob.title}
                onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                placeholder="Enter job title"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description *</label>
              <textarea
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  height: '80px',
                  resize: 'vertical'
                }}
                placeholder="Enter job description"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location *</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pay (PKR)</label>
                <input
                  type="number"
                  value={newJob.pay}
                  onChange={(e) => setNewJob({...newJob, pay: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  placeholder="Enter pay amount"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Urgency</label>
                <select
                  value={newJob.urgency}
                  onChange={(e) => setNewJob({...newJob, urgency: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
                <input
                  type="text"
                  value={newJob.category}
                  onChange={(e) => setNewJob({...newJob, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  placeholder="Job category"
                />
              </div>
            </div>
            <button
              onClick={handleCreateJob}
              disabled={loading}
              style={{
                background: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Creating...' : 'Create & Assign Job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAssignmentModal;
