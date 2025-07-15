
import './App.css';
import { useState, useEffect } from 'react';

function AnimatedCounter({ target, duration = 1200 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target.replace(/,/g, ''));
    if (start === end) return;
    const increment = end / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end.toLocaleString());
        clearInterval(timer);
      } else {
        setCount(Math.floor(current).toLocaleString());
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}</span>;
}

const pendingUsers = [
  {
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    role: 'Electrician',
    cnic: '42101-1234567-8',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Sara Khan',
    email: 'sara.khan@email.com',
    role: 'Plumber',
    cnic: '42101-9876543-2',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

const approvedUsers = [
  {
    name: 'Bilal Ahmed',
    email: 'bilal.ahmed@email.com',
    role: 'Carpenter',
    cnic: '42101-1122334-5',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    name: 'Ayesha Noor',
    email: 'ayesha.noor@email.com',
    role: 'Painter',
    cnic: '42101-5566778-9',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
];

const paymentHistory = [
  {
    name: 'Ahmed Hassan',
    amount: 'Rs. 2,000',
    date: '2025-07-10',
    status: 'Completed',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Sara Khan',
    amount: 'Rs. 1,500',
    date: '2025-07-09',
    status: 'Pending',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('pending');
  const stats = [
    { label: 'Total Users', value: '1,247', icon: '👥', color: 'green', glow: true },
    { label: 'Pending Approval', value: '23', icon: '⏳', color: 'orange' },
    { label: 'Active Subscriptions', value: '892', icon: '✅', color: 'green', glow: true },
    { label: 'Suspended Users', value: '12', icon: '❌', color: 'red' },
  ];

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <h1 className="tab-title">Admin Dashboard</h1>
        <p className="tab-description">Manage skilled worker registrations and users</p>
      </header>
      <div className="dashboard-search-row fade-in" style={{ animationDelay: '0.1s' }}>
        <input className="dashboard-search" placeholder="Search users..." />
        <button className="dashboard-filter-btn">🔍</button>
      </div>
      <div className="dashboard-stats">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card stat-${stat.color} fade-in`} style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
            <div className={`stat-icon${stat.glow ? ' glow-green' : ''}`}>{stat.icon}</div>
            <div className="stat-value">
              <AnimatedCounter target={stat.value} />
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-tabs tab-btns-flex fade-in" style={{ animationDelay: '0.7s' }}>
        <button className={`tab-btn-left${activeTab === 'pending' ? ' active' : ''}`} onClick={() => setActiveTab('pending')}>
          <span className="tab-btn-content"><span role="img" aria-label="pending">🕒</span> Pending Registrations</span>
        </button>
        <button className={`tab-btn-center${activeTab === 'approved' ? ' active' : ''}`} onClick={() => setActiveTab('approved')}>
          <span className="tab-btn-content"><span role="img" aria-label="approved">✅</span> Approved Users</span>
        </button>
        <button className={`tab-btn-right${activeTab === 'payments' ? ' active' : ''}`} onClick={() => setActiveTab('payments')}>
          <span className="tab-btn-content"><span role="img" aria-label="payments">💳</span> Payment History</span>
        </button>
      </div>
      <div className="tab-content-area">
        {activeTab === 'pending' && (
          <>
            <section className="tab-card pending-card fade-in" style={{ animationDelay: '0.8s' }}>
              <h2 className="tab-title">Pending User Registrations</h2>
              <p className="tab-description">Review and approve skilled worker applications</p>
              {pendingUsers.map((user, i) => (
                <div key={i} className="pending-user-card user-card fade-in" style={{ animationDelay: `${0.9 + i * 0.1}s` }}>
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                    <span className="user-role">{user.role}</span>
                    <span className="user-cnic">CNIC: {user.cnic}</span>
                  </div>
                  <div className="user-actions user-actions-col">
                    <button className="view-btn"><span role="img" aria-label="view">👁️</span> View Details</button>
                    <button className="approve-btn"><span role="img" aria-label="approve">✔️</span> Approve</button>
                    <button className="reject-btn"><span role="img" aria-label="reject">❌</span> Reject</button>
                  </div>
                </div>
              ))}
            </section>
            <div className="tab-section-separator"><span className="separator-icon">★</span></div>
          </>
        )}
        {activeTab === 'approved' && (
          <>
            <section className="tab-card approved-card fade-in" style={{ animationDelay: '0.8s' }}>
              <h2 className="tab-title">Approved Users</h2>
              <p className="tab-description">List of users who have been approved</p>
              {approvedUsers.map((user, i) => (
                <div key={i} className="approved-user-card user-card fade-in" style={{ animationDelay: `${0.9 + i * 0.1}s` }}>
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                    <span className="user-role">{user.role}</span>
                    <span className="user-cnic">CNIC: {user.cnic}</span>
                  </div>
                  <div className="user-actions">
                    <button className="view-btn"><span role="img" aria-label="view">👁️</span> View Details</button>
                  </div>
                </div>
              ))}
            </section>
            <div className="tab-section-separator"><span className="separator-icon">★</span></div>
          </>
        )}
        {activeTab === 'payments' && (
          <section className="tab-card payment-card fade-in" style={{ animationDelay: '0.8s' }}>
            <h2 className="tab-title">Payment History</h2>
            <p className="tab-description">Recent payment transactions</p>
            {paymentHistory.map((payment, i) => (
              <div key={i} className="payment-history-card user-card fade-in" style={{ animationDelay: `${0.9 + i * 0.1}s` }}>
                <img src={payment.avatar} alt={payment.name} className="user-avatar" />
                <div className="user-info">
                  <div className="user-name">{payment.name}</div>
                  <div className="user-email">{payment.amount} • {payment.date}</div>
                  <span className={`payment-status ${payment.status.toLowerCase()}`}>{payment.status}</span>
                </div>
                <div className="user-actions">
                  <button className="view-btn"><span role="img" aria-label="view">👁️</span> View Details</button>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
