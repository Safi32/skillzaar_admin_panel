import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import app from './firebase';

const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    const db = getFirestore(app);
    
    // Listen to real-time updates for job assignments from both Job and AssignedJobs collections
    const unsubscribeJobs = onSnapshot(
      query(
        collection(db, 'Job'),
        where('status', '==', 'assigned'),
        orderBy('assignedAt', 'desc'),
        limit(5)
      ),
      (snapshot) => {
        const jobNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'job_assigned',
          source: 'Job'
        }));
        
        setNotifications(prev => {
          const combined = [...jobNotifications];
          setPreviousCount(combined.length);
          return combined;
        });
        
        // Show notification for new assignments
        if (jobNotifications.length > 0) {
          setIsVisible(true);
          setTimeout(() => setIsVisible(false), 5000);
        }
      }
    );

    // Also listen to AssignedJobs collection for more detailed notifications
    const unsubscribeAssignedJobs = onSnapshot(
      query(
        collection(db, 'AssignedJobs'),
        where('assignmentStatus', '==', 'assigned'),
        orderBy('assignedAt', 'desc'),
        limit(5)
      ),
      (snapshot) => {
        const assignedJobNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'job_assigned',
          source: 'AssignedJobs'
        }));
        
        setNotifications(prev => {
          const combined = [...assignedJobNotifications];
          setPreviousCount(combined.length);
          return combined;
        });
        
        // Show notification for new assignments
        if (assignedJobNotifications.length > 0) {
          setIsVisible(true);
          setTimeout(() => setIsVisible(false), 5000);
        }
      }
    );

    return () => {
      unsubscribeJobs();
      unsubscribeAssignedJobs();
    };
  }, []);

  if (!isVisible || notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 3000,
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        background: '#4CAF50',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px 8px 0 0',
        fontWeight: 'bold',
        fontSize: '14px'
      }}>
        🔔 Real-time Updates
      </div>
      <div style={{ padding: '10px' }}>
        {notifications.slice(0, 3).map(notification => (
          <div key={notification.id} style={{
            padding: '8px 0',
            borderBottom: '1px solid #eee',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              🎯 Job Assigned
            </div>
            <div style={{ color: '#666' }}>
              <strong>{notification.assignedWorkerName || notification.workerName}</strong> assigned to <strong>{notification.jobTitle || notification.title_en || notification.title}</strong>
            </div>
            <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
              📍 {notification.jobLocation || notification.Location || 'Location N/A'}
            </div>
            <div style={{ color: '#999', fontSize: '10px', marginTop: '2px' }}>
              {notification.assignedAt?.toDate?.()?.toLocaleTimeString() || 'Just now'}
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default RealTimeNotifications;
