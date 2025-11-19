import { useEffect, useState } from "react";
import app from "../firebase";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

function Dashboard() {
  const [stats, setStats] = useState({
    jobs: { total: 0, pending: 0, approved: 0, assigned: 0, completed: 0 },
    workers: { total: 0, active: 0, online: 0, verified: 0 },
    recentJobs: [],
    recentWorkers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const db = getFirestore(app);
        
        // Fetch jobs data
        const jobsSnapshot = await getDocs(collection(db, "Job"));
        const jobs = jobsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Fetch workers data
        const workersSnapshot = await getDocs(collection(db, "SkilledWorkers"));
        const workers = workersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Get recent jobs (last 5)
        const recentJobsQuery = query(
          collection(db, "Job"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentJobsSnapshot = await getDocs(recentJobsQuery);
        const recentJobs = recentJobsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Get recent workers (last 5)
        const recentWorkersQuery = query(
          collection(db, "SkilledWorkers"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentWorkersSnapshot = await getDocs(recentWorkersQuery);
        const recentWorkers = recentWorkersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        setStats({
          jobs: {
            total: jobs.length,
            pending: jobs.filter((j) => j.status === "pending").length,
            approved: jobs.filter((j) => j.status === "approved").length,
            assigned: jobs.filter((j) => j.status === "assigned").length,
            completed: jobs.filter((j) => j.status === "completed").length,
          },
          workers: {
            total: workers.length,
            active: workers.filter((w) => w.isActive).length,
            online: workers.filter((w) => w.isOnline).length,
            verified: workers.filter((w) => w.isVerified).length,
          },
          recentJobs,
          recentWorkers
        });
      } catch (e) {
        console.error("Error fetching dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          color: '#1f2937', 
          margin: '0 0 8px 0' 
        }}>
          Dashboard Overview
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px', 
          margin: '0' 
        }}>
          Real-time insights into your platform's performance
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        {/* Job Stats */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '600', marginBottom: '8px' }}>
            📋 PENDING JOBS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
            {stats.jobs.pending}
          </div>
        </div>

        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#065f46', fontWeight: '600', marginBottom: '8px' }}>
            ✅ APPROVED JOBS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
            {stats.jobs.approved}
          </div>
        </div>

        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600', marginBottom: '8px' }}>
            🔄 ONGOING JOBS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
            {stats.jobs.assigned}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f3e8ff',
          border: '1px solid #8b5cf6',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#6b21a8', fontWeight: '600', marginBottom: '8px' }}>
            🎯 TOTAL JOBS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>
            {stats.jobs.total}
          </div>
        </div>

        <div style={{
          backgroundColor: '#fce7f3',
          border: '1px solid #ec4899',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#be185d', fontWeight: '600', marginBottom: '8px' }}>
            ✅ COMPLETED JOBS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ec4899' }}>
            {stats.jobs.completed}
          </div>
        </div>
      </div>

      {/* Worker Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        <div style={{
          backgroundColor: '#e0f2fe',
          border: '1px solid #0ea5e9',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#0c4a6e', fontWeight: '600', marginBottom: '8px' }}>
            👷 TOTAL WORKERS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0ea5e9' }}>
            {stats.workers.total}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#166534', fontWeight: '600', marginBottom: '8px' }}>
            🟢 ACTIVE WORKERS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>
            {stats.workers.active}
          </div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '600', marginBottom: '8px' }}>
            📱 ONLINE NOW
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
            {stats.workers.online}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600', marginBottom: '8px' }}>
            ✅ VERIFIED WORKERS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
            {stats.workers.verified}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '30px',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        {/* Recent Jobs */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937', 
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Recent Jobs
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {stats.recentJobs.length > 0 ? (
              stats.recentJobs.map((job, index) => (
                <div key={job.id} style={{
                  padding: '12px',
                  borderBottom: index < stats.recentJobs.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '14px' }}>
                      {job.title_en || 'Untitled Job'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {job.serviceType || 'Service'}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: 
                      job.status === 'pending' ? '#fef3c7' :
                      job.status === 'approved' ? '#d1fae5' :
                      job.status === 'assigned' ? '#dbeafe' :
                      job.status === 'completed' ? '#fce7f3' : '#f3f4f6',
                    color: 
                      job.status === 'pending' ? '#92400e' :
                      job.status === 'approved' ? '#065f46' :
                      job.status === 'assigned' ? '#1e40af' :
                      job.status === 'completed' ? '#be185d' : '#6b7280'
                  }}>
                    {job.status?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                No recent jobs found
              </div>
            )}
          </div>
        </div>

        {/* Recent Workers */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1f2937', 
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👷 Recent Workers
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {stats.recentWorkers.length > 0 ? (
              stats.recentWorkers.map((worker, index) => (
                <div key={worker.id} style={{
                  padding: '12px',
                  borderBottom: index < stats.recentWorkers.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '14px' }}>
                      {worker.Name || worker.displayName || 'Unknown Worker'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {worker.City || worker.city || 'Unknown City'}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: worker.isActive ? '#d1fae5' : '#f3f4f6',
                    color: worker.isActive ? '#065f46' : '#6b7280'
                  }}>
                    {worker.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                No recent workers found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;


