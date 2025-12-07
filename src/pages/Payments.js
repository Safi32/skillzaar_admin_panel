import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import app from '../firebase';

function Payments() {
  const [activeTab, setActiveTab] = useState('history');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedJobs: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const db = getFirestore(app);

      // Fetch completed jobs for Payment History
      const completedJobsQuery = query(
        collection(db, 'Job'),
        where('status', '==', 'completed')
      );

      // Fetch assigned jobs for Pending Payments (estimated)
      const assignedJobsQuery = query(
        collection(db, 'Job'),
        where('status', '==', 'assigned')
      );

      const [completedSnapshot, assignedSnapshot] = await Promise.all([
        getDocs(completedJobsQuery),
        getDocs(assignedJobsQuery)
      ]);

      let revenue = 0;
      const historyData = completedSnapshot.docs.map(doc => {
        const data = doc.data();
        // Parse budget: remove non-numeric chars except dot
        const budgetStr = (data.budget || data.price || '0').toString();
        const amount = parseFloat(budgetStr.replace(/[^0-9.]/g, '')) || 0;
        revenue += amount;

        return {
          id: doc.id,
          title: data.title_en || 'Untitled Job',
          workerName: data.assignedWorkerName || 'Unknown Worker',
          serviceType: data.serviceType || 'General',
          date: data.completedAt ? new Date(data.completedAt.toDate()).toLocaleDateString() : 'N/A',
          timestamp: data.completedAt ? data.completedAt.toDate() : new Date(0), // For sorting
          amount: amount,
          status: 'Completed'
        };
      });

      // Sort by date descending (client-side)
      historyData.sort((a, b) => b.timestamp - a.timestamp);

      let pending = 0;
      assignedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const budgetStr = (data.budget || data.price || '0').toString();
        const amount = parseFloat(budgetStr.replace(/[^0-9.]/g, '')) || 0;
        pending += amount;
      });

      setPayments(historyData);
      setStats({
        totalRevenue: revenue,
        completedJobs: completedSnapshot.size,
        pendingAmount: pending
      });
      setLoading(false);

    } catch (error) {
      console.error("Error fetching payments:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('PKR', 'Rs');
  };

  return (
    <div className="payments-management">
      <h2>Payment Management</h2>
      <div className="payments-tabs">
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Payment History
        </button>
        <button
          className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription Status
        </button>
      </div>

      <div className="payments-content">
        <div className="payment-summary">
          <div className="summary-card">
            <h3>Total Revenue</h3>
            <p className="amount">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="summary-card">
            <h3>Completed Jobs</h3>
            <p className="amount">{stats.completedJobs}</p>
          </div>
          <div className="summary-card">
            <h3>Pending Payments</h3>
            <p className="amount">{formatCurrency(stats.pendingAmount)}</p>
          </div>
        </div>

        {activeTab === 'history' ? (
          <div className="payments-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading payments...</div>
            ) : payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No payment history found</div>
            ) : (
              payments.map(payment => (
                <div className="payment-item" key={payment.id}>
                  <div className="payment-info">
                    <h4>{payment.workerName}</h4>
                    <p>{payment.serviceType} • {payment.title}</p>
                    <p className="payment-date">{payment.date}</p>
                  </div>
                  <div className="payment-amount">
                    <span className="amount">{formatCurrency(payment.amount)}</span>
                    <span className="status active">{payment.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="subscription-content" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>Subscription management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;


