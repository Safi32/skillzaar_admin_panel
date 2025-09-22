import "./App.css";
import "./MapView.css";
import { useState, useEffect } from "react";
import app from "./firebase";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import AdminJobApprovalScreen from "./AdminJobApprovalScreen";
import MapView from "./MapView";
import RealTimeNotifications from "./RealTimeNotifications";
import CreateSkilledWorker from "./CreateSkilledWorker";
import PrivacyPolicy from "./privacy_policy";

// Firebase connection check
const db = getFirestore(app);
getDocs(collection(db, "test"))
  .then((snapshot) => {
    console.log("Firestore connected! Docs:", snapshot.docs.length);
  })
  .catch((error) => {
    console.error("Firestore connection error:", error);
  });

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobStats, setJobStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
  });
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerDetailsModal, setShowWorkerDetailsModal] = useState(false);
  const [availableJobs, setAvailableJobs] = useState([]);

  // Fetch job statistics from Firestore
  const fetchJobStats = async () => {
    try {
      console.log("Fetching job statistics from Firestore...");
      const db = getFirestore(app);
      const jobsSnapshot = await getDocs(collection(db, "Job"));
      const jobs = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Jobs data:", jobs);
      console.log("Number of jobs found:", jobs.length);

      const stats = {
        total: jobs.length,
        pending: jobs.filter((job) => job.status === "pending").length,
        approved: jobs.filter((job) => job.status === "approved").length,
      };

      console.log("Job statistics:", stats);
      setJobStats(stats);
    } catch (error) {
      console.error("Error fetching job stats:", error);
    }
  };


  useEffect(() => {
    fetchJobStats();
    fetchAvailableJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Fetch available jobs from Firebase
  const fetchAvailableJobs = async () => {
    try {
      console.log("Fetching available jobs from Firestore...");
      const db = getFirestore(app);
      const jobsSnapshot = await getDocs(collection(db, "Job"));
      const jobs = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("All jobs data:", jobs);

      // Filter for pending jobs that match worker's skills
      const pendingJobs = jobs.filter((job) =>
        job.status === "pending" &&
        (!job.assignedWorkerId || job.assignedWorkerId === null)
      );

      console.log("Available jobs (pending and unassigned):", pendingJobs);
      console.log("Number of available jobs:", pendingJobs.length);

      setAvailableJobs(pendingJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setAvailableJobs([]);
    }
  };

  // Handle job assignment to worker
  const handleJobAssignment = async (workerId, jobId) => {
    try {
      const db = getFirestore(app);
      const workerRef = doc(db, "SkilledWorkers", workerId);
      const jobRef = doc(db, "Job", jobId);

      // Update job with assigned worker
      await updateDoc(jobRef, {
        assignedWorkerId: workerId,
        assignedWorkerName: selectedWorker.name,
        status: "assigned",
        assignedAt: new Date()
      });

      // Update worker with assigned job
      await updateDoc(workerRef, {
        jobAssigned: true,
        assignedJobId: jobId,
        jobAssignedAt: new Date()
      });

      alert(`Job assigned to ${selectedWorker.name} successfully!`);
      setShowWorkerDetailsModal(false);
      setSelectedWorker(null);

      // Refresh available jobs
      await fetchAvailableJobs();
    } catch (error) {
      console.error("Error assigning job:", error);
      alert("Error assigning job. Please try again.");
    }
  };

  return (
    <div className="App">
      <RealTimeNotifications />
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>Skillzaar Admin</h1>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""
                }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-text">Dashboard</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === "jobs" ? "active" : ""}`}
              onClick={() => setActiveTab("jobs")}
            >
              <span className="sidebar-icon">📋</span>
              <span className="sidebar-text">Job Approvals</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === "workers" ? "active" : ""
                }`}
              onClick={() => setActiveTab("workers")}
            >
              <span className="sidebar-icon">👷</span>
              <span className="sidebar-text">Worker Management</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === "create-worker" ? "active" : ""}`}
              onClick={() => setActiveTab("create-worker")}
            >
              <span className="sidebar-icon">➕</span>
              <span className="sidebar-text">Create Worker</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === "payments" ? "active" : ""
                }`}
              onClick={() => setActiveTab("payments")}
            >
              <span className="sidebar-icon">💳</span>
              <span className="sidebar-text">Payments</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === "map" ? "active" : ""}`}
              onClick={() => setActiveTab("map")}
            >
              <span className="sidebar-icon">🗺️</span>
              <span className="sidebar-text">Map View</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === "privacy" ? "active" : ""}`}
              onClick={() => setActiveTab("privacy")}
            >
              <span className="sidebar-icon">🔒</span>
              <span className="sidebar-text">Privacy Policy</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {activeTab === "dashboard" && (
            <div className="dashboard">
              <div className="stats-grid" style={{ marginTop: "20px" }}>
                <div
                  className="stat-card"
                  style={{ backgroundColor: "#fef3c7", borderColor: "#f59e0b" }}
                >
                  <h3>Pending Jobs</h3>
                  <p className="stat-number" style={{ color: "#f59e0b" }}>
                    {jobStats.pending}
                  </p>
                </div>
                <div
                  className="stat-card"
                  style={{ backgroundColor: "#d1fae5", borderColor: "#10b981" }}
                >
                  <h3>Approved Jobs</h3>
                  <p className="stat-number" style={{ color: "#10b981" }}>
                    {jobStats.approved}
                  </p>
                </div>
                <div
                  className="stat-card"
                  style={{ backgroundColor: "#e0e7ff", borderColor: "#3b82f6" }}
                >
                  <h3>Total Jobs</h3>
                  <p className="stat-number" style={{ color: "#3b82f6" }}>
                    {jobStats.total}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <h3 style={{ color: "#1f2937", marginBottom: "16px" }}>
                  Job Approval System
                </h3>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "16px",
                    lineHeight: "1.6",
                  }}
                >
                  📋 Navigate to the <strong>"Job Approvals"</strong> tab to
                  review and approve pending job requests from users.
                  <br />✨ The system automatically fetches real-time data from
                  Firebase and updates every 30 seconds.
                </p>
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "8px",
                    border: "1px solid #0ea5e9",
                    display: "inline-block",
                  }}
                >
                  <div
                    style={{
                      color: "#0369a1",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    🔄 Real-time Features
                  </div>
                  <div style={{ color: "#0c4a6e", fontSize: "14px" }}>
                    • Live data from Firebase Firestore
                    <br />
                    • Auto-refresh every 30 seconds
                    <br />
                    • Instant status updates
                    <br />• Real-time notifications
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <AdminJobApprovalScreen onJobAction={fetchJobStats} />
          )}


          {activeTab === "workers" && (
            <div className="workers-management">
              <h2>Worker Management</h2>
              <div className="workers-tabs">
                <button className="tab-btn active">
                  Pending Registrations
                </button>
                <button className="tab-btn">Active Workers</button>
                <button className="tab-btn">Suspended Workers</button>
              </div>
              <div className="workers-grid">
                <div className="no-workers-message">
                  <p>No workers available. Workers will appear here when they register.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "create-worker" && (
            <CreateSkilledWorker />
          )}


          {activeTab === "payments" && (
            <div className="payments-management">
              <h2>Payment Management</h2>
              <div className="payments-tabs">
                <button className="tab-btn active">Payment History</button>
                <button className="tab-btn">Subscription Status</button>
              </div>
              <div className="payments-content">
                <div className="payment-summary">
                  <div className="summary-card">
                    <h3>Total Revenue</h3>
                    <p className="amount">₨ 125,000</p>
                  </div>
                  <div className="summary-card">
                    <h3>Active Subscriptions</h3>
                    <p className="amount">45</p>
                  </div>
                  <div className="summary-card">
                    <h3>Pending Payments</h3>
                    <p className="amount">₨ 15,000</p>
                  </div>
                </div>
                <div className="payments-list">
                  <div className="payment-item">
                    <div className="payment-info">
                      <h4>Ahmed Khan</h4>
                      <p>Electrician • Monthly Subscription</p>
                      <p className="payment-date">Dec 15, 2024</p>
                    </div>
                    <div className="payment-amount">
                      <span className="amount">₨ 2,500</span>
                      <span className="status active">Active</span>
                    </div>
                  </div>
                  <div className="payment-item">
                    <div className="payment-info">
                      <h4>Fatima Ali</h4>
                      <p>Plumber • Monthly Subscription</p>
                      <p className="payment-date">Dec 14, 2024</p>
                    </div>
                    <div className="payment-amount">
                      <span className="amount">₨ 2,500</span>
                      <span className="status active">Active</span>
                    </div>
                  </div>
                  <div className="payment-item">
                    <div className="payment-info">
                      <h4>Muhammad Hassan</h4>
                      <p>Carpenter • Monthly Subscription</p>
                      <p className="payment-date">Dec 10, 2024</p>
                    </div>
                    <div className="payment-amount">
                      <span className="amount">₨ 2,500</span>
                      <span className="status inactive">Inactive</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "map" && (
            <MapView />
          )}

          {activeTab === "privacy" && (
            <PrivacyPolicy />
          )}
        </main>
      </div>

      {/* Job Assignment Modal - Legacy (kept for compatibility) */}
      {showJobModal && selectedWorker && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setShowJobModal(false)}
            >
              &times;
            </button>
            <h3>Assign Job to {selectedWorker.name}</h3>
            <div className="user-details">
              <span>👤 {selectedWorker.role}</span>
              <span>⭐ {selectedWorker.rating}</span>
              <span>📞 {selectedWorker.phone}</span>
            </div>
            <div className="job-assignment-instruction">
              No jobs available for assignment.
            </div>
          </div>
        </div>
      )}

      {/* Worker Details Modal */}
      {showWorkerDetailsModal && selectedWorker && (
        <div className="modal-overlay">
          <div className="modal-content worker-details-modal">
            <button
              className="close-btn"
              onClick={() => {
                setShowWorkerDetailsModal(false);
                setSelectedWorker(null);
              }}
            >
              &times;
            </button>
            <div className="worker-details-header">
              <div className="worker-profile-section">
                <img
                  src={selectedWorker.profileImage}
                  alt={selectedWorker.name}
                  className="worker-detail-avatar"
                />
                <div className="worker-basic-info">
                  <h3>{selectedWorker.name}</h3>
                  <p className="worker-role">{selectedWorker.role}</p>
                  <p className="worker-location">📍 {selectedWorker.city}</p>
                  <div className="worker-rating">
                    ⭐ {selectedWorker.rating}/5
                  </div>
                </div>
              </div>
            </div>

            <div className="worker-details-section">
              <h4>Contact Information</h4>
              <div className="detail-row">
                <span className="detail-label">📧 Email:</span>
                <span className="detail-value">{selectedWorker.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">📱 Phone:</span>
                <span className="detail-value">{selectedWorker.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">🆔 CNIC:</span>
                <span className="detail-value">{selectedWorker.cnic}</span>
              </div>
            </div>

            <div className="worker-details-section">
              <h4>Professional Details</h4>
              <div className="detail-row">
                <span className="detail-label">💼 Experience:</span>
                <span className="detail-value">{selectedWorker.experience}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">🛠️ Skills:</span>
                <div className="skills-list">
                  {selectedWorker.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="available-jobs-section">
              <h4>Available Jobs for Assignment</h4>
              <div className="jobs-list">
                {availableJobs.length > 0 ? (
                  availableJobs.map((job) => (
                    <div
                      key={job.id}
                      className="job-item"
                      onClick={() => handleJobAssignment(selectedWorker.id, job.id)}
                    >
                      <div className="job-header">
                        <h4>{job.title_en || job.title}</h4>
                        <span className="job-pay">₨ {job.pay || job.salary}</span>
                      </div>
                      <p className="job-description">
                        {job.description_en || job.description}
                      </p>
                      <div className="job-details">
                        <span className="job-location">📍 {job.location}</span>
                        <span className={`job-urgency ${job.urgency || 'medium'}`}>
                          {job.urgency || 'Medium'} Priority
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-jobs-message">
                    <p>No available jobs at the moment.</p>
                    <p>Check back later for new job postings.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
