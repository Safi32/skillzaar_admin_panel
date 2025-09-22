import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from './firebase';
 
import './App.css';

function AdminJobApprovalScreen({ onJobAction, onRefresh }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [notification, setNotification] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    console.log('AdminJobApprovalScreen mounted, fetching jobs...');
    console.log('Firebase app:', app);
    console.log('Firebase app name:', app.name);
    fetchJobs();
    
    // Set up auto-refresh every 30 seconds to get real-time updates
    const interval = setInterval(() => {
      console.log('Auto-refreshing jobs...');
      fetchJobs();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const db = getFirestore(app);
      console.log('Fetching jobs from collection: Job');
      
      const jobsSnapshot = await getDocs(collection(db, 'Job'));
      console.log('Total documents in Job collection:', jobsSnapshot.docs.length);
      
      const allJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('All jobs from Firebase:', allJobs);
      
      const jobsList = allJobs.filter(job => {
        console.log(`Job ${job.id} status: "${job.status}" (type: ${typeof job.status})`);
        console.log(`Job ${job.id} title: "${job.title_en}"`);
        console.log(`Job ${job.id} full data:`, job);
        return job.status && job.status.toLowerCase() === 'pending';
      });
      
      console.log('Filtered pending jobs:', jobsList);
      console.log('Setting jobs state with:', jobsList.length, 'jobs');
      
      // Debug: Check if Electrician job is found
      const electricianJob = allJobs.find(job => job.title_en === 'Electrician');
      if (electricianJob) {
        console.log('✅ Found Electrician job:', electricianJob);
      } else {
        console.log('❌ Electrician job not found in allJobs');
      }
      
      setJobs(jobsList);
      setLastRefresh(new Date());
      
      // Show notification if no jobs found
      if (jobsList.length === 0 && allJobs.length > 0) {
        setNotification({
          type: 'info',
          message: 'No pending jobs found. All jobs have been processed.',
          action: 'info'
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setNotification({
        type: 'error',
        message: `Failed to fetch jobs: ${error.message}`,
        action: 'error'
      });
    }
    setLoading(false);
  };


  const handleAction = async (jobId, action) => {
    // Show confirmation dialog
    const confirmMessage = action === 'approved' 
      ? 'Are you sure you want to approve this job?'
      : 'Are you sure you want to reject this job?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const db = getFirestore(app);
      const jobRef = doc(db, 'Job', jobId);
      
      // Update the job status in Firestore
      await updateDoc(jobRef, {
        status: action,
        adminActionAt: serverTimestamp(),
        adminAction: action === 'approved' ? 'approved' : 'rejected',
        adminId: 'admin', 
        adminName: 'Admin User'  
      });

      if (onJobAction) {
        await onJobAction(jobId, action);
      }

      setJobs(jobs => jobs.filter(job => job.id !== jobId));
      
      if (onRefresh) {
        onRefresh();
      }

      // Show success notification
      setNotification({
        type: 'success',
        message: `Job ${action} successfully!`,
        action: action
      });
      
    } catch (error) {
      console.error('Error handling job action:', error);
      setNotification({
        type: 'error',
        message: `Error ${action} job: ${error.message}`,
        action: action
      });
    }
    setActionLoading(prev => ({ ...prev, [jobId]: false }));
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };


  return (
    <div className="dashboard-container fade-in">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`} style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '500',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'info' ? '#3b82f6' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <span role="img" aria-label={notification.type}>
            {notification.type === 'success' ? '✅' : notification.type === 'info' ? 'ℹ️' : '❌'}
          </span>
          {notification.message}
        </div>
      )}

      <header className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 className="tab-title">Job Approval Requests</h1>
            <p className="tab-description">
              Approve or reject jobs posted by job posters 
              {jobs.length > 0 && (
                <span style={{ 
                  color: '#f59e0b', 
                  fontWeight: '600',
                  marginLeft: '8px'
                }}>
                  ({jobs.length} pending)
                </span>
              )}
              {lastRefresh && (
                <span style={{ 
                  color: '#6b7280', 
                  fontSize: '12px',
                  marginLeft: '8px',
                  fontStyle: 'italic'
                }}>
                  • Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            
            <button 
              onClick={fetchJobs}
              disabled={loading}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span role="img" aria-label="refresh">🔄</span>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>Loading jobs...</div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>Please wait while we fetch pending job requests</div>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div style={{ fontSize: '24px', color: '#6b7280', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>No jobs pending approval!</div>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>All job requests have been processed</div>
          <div style={{ 
            fontSize: '12px', 
            color: '#9ca3af', 
            padding: '12px', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'inline-block'
          }}>
            💡 <strong>Real-time updates:</strong> New job requests will appear here automatically when posted by users
          </div>
        </div>
      ) : (
        jobs.map((job, i) => (
          <div key={job.id} className="job-approval-card fade-in" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
            <div className="job-info">
              <img src={job.image || 'https://via.placeholder.com/80'} alt={job.title_en || 'Job'} className="job-image" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginRight: 16 }} />
              <div style={{ flex: 1 }}>
                <div className="job-title"><strong>{job.title_en || 'Untitled Job'}</strong></div>
                <div className="job-poster">📱 Phone: {job.posterPhone || 'No phone'}</div>
                <div className="job-poster">🆔 Poster ID: {job.jobPosterId || 'Unknown'}</div>
                <div className="job-location">📍 Location: {job.location || 'No location'}</div>
                <div className="job-description" style={{ 
                  maxHeight: '60px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  marginBottom: '8px'
                }}>
                  {job.description_en || 'No description'}
                </div>
                {job.description_ur && (
                  <div className="job-description-ur" style={{ 
                    maxHeight: '40px', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    marginBottom: '8px'
                  }}>
                    🇵🇰 {job.description_ur}
                  </div>
                )}
                <div className="job-date">📅 Posted on: {job.createdAt ? (job.createdAt.toDate ? new Date(job.createdAt.toDate()).toLocaleString() : new Date(job.createdAt).toLocaleString()) : 'Unknown date'}</div>
                <div className="job-status" style={{ 
                  color: '#ff6b35', 
                  fontWeight: 'bold', 
                  fontSize: '14px',
                  marginTop: '8px',
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  border: '1px solid #ffeaa7'
                }}>
                  Status: Pending Approval
                </div>
              </div>
            </div>
            <div className="job-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="view-details-btn" 
                onClick={() => handleViewDetails(job)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span role="img" aria-label="view">👁️</span> View Details
              </button>
              <button 
                className="approve-btn" 
                disabled={actionLoading[job.id]} 
                onClick={() => handleAction(job.id, 'approved')}
                style={{ 
                  marginBottom: '0px',
                  background: actionLoading[job.id] ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: actionLoading[job.id] ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span role="img" aria-label="approve">✔️</span> {actionLoading[job.id] ? 'Approving...' : 'Approve'}
              </button>
              <button 
                className="reject-btn" 
                disabled={actionLoading[job.id]} 
                onClick={() => handleAction(job.id, 'rejected')}
                style={{
                  background: actionLoading[job.id] ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: actionLoading[job.id] ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span role="img" aria-label="reject">❌</span> {actionLoading[job.id] ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        ))
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              className="close-btn"
              onClick={() => setShowJobDetails(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              &times;
            </button>
            
            <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>
              Job Details
            </h2>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <img 
                src={selectedJob.image || 'https://via.placeholder.com/150'} 
                alt={selectedJob.title_en || 'Job'} 
                style={{ 
                  width: 150, 
                  height: 150, 
                  objectFit: 'cover', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }} 
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '8px', color: '#1f2937' }}>
                  {selectedJob.title_en || 'Untitled Job'}
                </h3>
                <div style={{ marginBottom: '8px' }}>
                  <strong>📱 Phone:</strong> {selectedJob.posterPhone || 'No phone'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>🆔 Poster ID:</strong> {selectedJob.jobPosterId || 'Unknown'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>📍 Location:</strong> {selectedJob.location || 'No location'}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>📅 Posted on:</strong> {selectedJob.createdAt ? new Date(selectedJob.createdAt.toDate()).toLocaleString() : 'Unknown date'}
                </div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  border: '1px solid #ffeaa7',
                  color: '#ff6b35',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  Status: Pending Approval
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px', color: '#1f2937' }}>Description (English):</h4>
              <p style={{ 
                padding: '12px', 
                backgroundColor: '#f9fafb', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                lineHeight: '1.5'
              }}>
                {selectedJob.description_en || 'No description available'}
              </p>
            </div>
            
            {selectedJob.description_ur && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '8px', color: '#1f2937' }}>Description (Urdu):</h4>
                <p style={{ 
                  padding: '12px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  lineHeight: '1.5',
                  direction: 'rtl',
                  textAlign: 'right'
                }}>
                  {selectedJob.description_ur}
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowJobDetails(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowJobDetails(false);
                  handleAction(selectedJob.id, 'approved');
                }}
                disabled={actionLoading[selectedJob.id]}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: actionLoading[selectedJob.id] ? '#9ca3af' : '#10b981',
                  color: 'white',
                  cursor: actionLoading[selectedJob.id] ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {actionLoading[selectedJob.id] ? 'Approving...' : 'Approve Job'}
              </button>
              <button
                onClick={() => {
                  setShowJobDetails(false);
                  handleAction(selectedJob.id, 'rejected');
                }}
                disabled={actionLoading[selectedJob.id]}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: actionLoading[selectedJob.id] ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  cursor: actionLoading[selectedJob.id] ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {actionLoading[selectedJob.id] ? 'Rejecting...' : 'Reject Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminJobApprovalScreen; 