import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
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
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'assigned', 'all'

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
  }, [activeTab]); // Re-fetch when tab changes

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

      // Filter jobs based on active tab
      let jobsList = [];
      if (activeTab === 'pending') {
        jobsList = allJobs.filter(job => job.status && job.status.toLowerCase() === 'pending');
      } else if (activeTab === 'assigned') {
        jobsList = allJobs.filter(job => job.status && job.status.toLowerCase() === 'assigned');
      } else {
        jobsList = allJobs; // Show all jobs
      }

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

  // Function to handle job completion
  const handleJobCompletion = async (jobId) => {
    if (!window.confirm('Mark this job as completed?')) return;

    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const db = getFirestore(app);
      const jobRef = doc(db, 'Job', jobId);

      // Update job status to completed
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        adminAction: 'completed',
        adminActionAt: serverTimestamp()
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
          completedAt: serverTimestamp()
        });

        // Update worker to free them up
        const assignedJobData = assignedJobDoc.data();
        if (assignedJobData.workerId) {
          const workerRef = doc(db, 'SkilledWorkers', assignedJobData.workerId);
          await updateDoc(workerRef, {
            jobAssigned: false,
            assignedJobId: null,
            currentJobId: null,
            status: 'available'
          });
        }
      }

      // Remove job from current list
      setJobs(jobs => jobs.filter(job => job.id !== jobId));

      setNotification({
        type: 'success',
        message: 'Job completed successfully!',
        action: 'completed'
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error completing job:', error);
      setNotification({
        type: 'error',
        message: `Error completing job: ${error.message}`,
        action: 'error'
      });
    }
    setActionLoading(prev => ({ ...prev, [jobId]: false }));
  };

  // Function to handle job cancellation
  const handleJobCancel = async (jobId) => {
    if (!window.confirm('Cancel this job and free the worker?')) return;

    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const db = getFirestore(app);
      const jobRef = doc(db, 'Job', jobId);

      // Update job status to cancelled and clear assignment
      await updateDoc(jobRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        assignedWorkerId: null,
        assignedWorkerName: null,
        adminAction: 'cancelled',
        adminActionAt: serverTimestamp()
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
          assignmentStatus: 'cancelled',
          cancelledAt: serverTimestamp()
        });

        // Update worker to free them up
        const assignedJobData = assignedJobDoc.data();
        if (assignedJobData.workerId) {
          const workerRef = doc(db, 'SkilledWorkers', assignedJobData.workerId);
          await updateDoc(workerRef, {
            jobAssigned: false,
            assignedJobId: null,
            currentJobId: null,
            status: 'available'
          });
        }
      }

      // Remove job from current list
      setJobs(jobs => jobs.filter(job => job.id !== jobId));

      setNotification({
        type: 'success',
        message: 'Job cancelled and worker set to available.',
        action: 'cancelled'
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      setNotification({
        type: 'error',
        message: `Error cancelling job: ${error.message}`,
        action: 'error'
      });
    }
    setActionLoading(prev => ({ ...prev, [jobId]: false }));
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
            <h1 className="tab-title">Job Management</h1>
            <p className="tab-description">
              Manage job requests and assignments
              {jobs.length > 0 && (
                <span style={{
                  color: '#f59e0b',
                  fontWeight: '600',
                  marginLeft: '8px'
                }}>
                  ({jobs.length} {activeTab})
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

            {/* Status Legend */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b'
                }}></div>
                Pending
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  border: '2px solid #dc2626'
                }}></div>
                Ongoing
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  border: '1px solid #10b981'
                }}></div>
                Completed
              </div>
            </div>
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

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'pending' ? '#3b82f6' : 'transparent',
              color: activeTab === 'pending' ? 'white' : '#6b7280',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            📋 Pending Jobs
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'assigned' ? '#3b82f6' : 'transparent',
              color: activeTab === 'assigned' ? 'white' : '#6b7280',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            🔄 Assigned Jobs
          </button>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'all' ? '#3b82f6' : 'transparent',
              color: activeTab === 'all' ? 'white' : '#6b7280',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            📊 All Jobs
          </button>
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
          <div key={job.id} className="job-approval-card fade-in" style={{
            animationDelay: `${0.2 + i * 0.1}s`,
            background:
              job.status === 'assigned' ? '#fef2f2' : // Light red for ongoing jobs
                job.status === 'pending' ? '#f7fafc' : // Default for pending
                  job.status === 'approved' ? '#f0fdf4' : // Light green for approved
                    job.status === 'completed' ? '#f0fdf4' : // Light green for completed
                      '#f7fafc', // Default
            boxShadow:
              job.status === 'assigned' ? '0 4px 12px rgba(220, 38, 38, 0.15)' : // Red shadow for ongoing
                '0 2px 8px rgba(60, 60, 60, 0.06)',
            border:
              job.status === 'assigned' ? '2px solid #fecaca' : // Red border for ongoing
                job.status === 'pending' ? '1px solid #e5e7eb' : // Gray border for pending
                  '1px solid #e5e7eb'
          }}>
            <div className="job-info">
              <img src={job.image || 'https://via.placeholder.com/80'} alt={job.title_en || 'Job'} className="job-image" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginRight: 16 }} />
              <div style={{ flex: 1 }}>
                <div className="job-title"><strong>{job.title_en || 'Untitled Job'}</strong></div>
                <div className="job-poster">📱 Phone: {job.posterPhone || 'No phone'}</div>
                <div className="job-poster">🆔 Poster ID: {job.jobPosterId || 'Unknown'}</div>
                <div className="job-location">📍 Location: {job.location || 'No location'}</div>
                <div className="job-budget">💰 Budget: Rs. {job.budget || 'Not specified'}</div>
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
                {/* Dynamic Status Badge with Color Coding */}
                <div style={{
                  marginTop: '8px',
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor:
                    job.status === 'pending' ? '#fef3c7' :
                      job.status === 'approved' ? '#d1fae5' :
                        job.status === 'assigned' ? '#fee2e2' :
                          job.status === 'completed' ? '#d1fae5' :
                            job.status === 'cancelled' ? '#f3f4f6' : '#f3f4f6',
                  color:
                    job.status === 'pending' ? '#92400e' :
                      job.status === 'approved' ? '#065f46' :
                        job.status === 'assigned' ? '#dc2626' :
                          job.status === 'completed' ? '#065f46' :
                            job.status === 'cancelled' ? '#6b7280' : '#6b7280',
                  border:
                    job.status === 'assigned' ? '2px solid #dc2626' : 'none'
                }}>
                  {job.status === 'pending' ? '⏳ PENDING APPROVAL' :
                    job.status === 'approved' ? '✅ APPROVED' :
                      job.status === 'assigned' ? '🔄 ONGOING JOB' :
                        job.status === 'completed' ? '✅ COMPLETED' :
                          job.status === 'cancelled' ? '❌ CANCELLED' : 'UNKNOWN'}
                </div>

                {/* Show assigned worker info for ongoing jobs */}
                {job.status === 'assigned' && job.assignedWorkerName && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#92400e',
                    fontWeight: '500',
                    border: '1px solid #f59e0b'
                  }}>
                    👷 Assigned to: {job.assignedWorkerName}
                  </div>
                )}
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
              {/* Show different actions based on job status */}
              {job.status === 'pending' ? (
                <>
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
                </>
              ) : job.status === 'assigned' ? (
                <>
                  <button
                    className="complete-btn"
                    disabled={actionLoading[job.id]}
                    onClick={() => handleJobCompletion(job.id)}
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
                    <span role="img" aria-label="complete">✅</span> {actionLoading[job.id] ? 'Completing...' : 'Complete'}
                  </button>
                  <button
                    className="cancel-btn"
                    disabled={actionLoading[job.id]}
                    onClick={() => handleJobCancel(job.id)}
                    style={{
                      background: actionLoading[job.id] ? '#9ca3af' : '#f59e0b',
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
                    <span role="img" aria-label="cancel">🚫</span> {actionLoading[job.id] ? 'Cancelling...' : 'Cancel'}
                  </button>
                </>
              ) : (
                <div style={{
                  padding: '8px 12px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  {job.status?.toUpperCase() || 'UNKNOWN'}
                </div>
              )}
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
                <div style={{ marginBottom: '8px' }}>
                  <strong>💰 Budget:</strong> Rs. {selectedJob.budget || 'Not specified'}
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

              {/* Show different actions based on job status */}
              {selectedJob.status === 'pending' ? (
                <>
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
                </>
              ) : selectedJob.status === 'assigned' ? (
                <>
                  <button
                    onClick={() => {
                      setShowJobDetails(false);
                      handleJobCompletion(selectedJob.id);
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
                    {actionLoading[selectedJob.id] ? 'Completing...' : 'Complete Job'}
                  </button>
                  <button
                    onClick={() => {
                      setShowJobDetails(false);
                      handleJobCancel(selectedJob.id);
                    }}
                    disabled={actionLoading[selectedJob.id]}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      background: actionLoading[selectedJob.id] ? '#9ca3af' : '#f59e0b',
                      color: 'white',
                      cursor: actionLoading[selectedJob.id] ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {actionLoading[selectedJob.id] ? 'Cancelling...' : 'Cancel Job'}
                  </button>
                </>
              ) : (
                <div style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  Status: {selectedJob.status?.toUpperCase() || 'UNKNOWN'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminJobApprovalScreen; 