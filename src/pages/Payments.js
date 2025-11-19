function Payments() {
  return (
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
  );
}

export default Payments;


