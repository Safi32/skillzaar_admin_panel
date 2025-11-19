import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from './firebase';

const WorkerLogin = ({ onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value;
    // Format phone number for Pakistan
    if (value.startsWith('0')) {
      value = '+92' + value.substring(1);
    } else if (!value.startsWith('+92')) {
      value = '+92' + value;
    }
    setPhoneNumber(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate phone number format
      const phoneRegex = /^(\+92|0)[0-9]{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Please enter a valid Pakistan phone number');
      }

      // Search for worker in SkilledWorkers collection
      const db = getFirestore(app);
      const workersQuery = query(
        collection(db, 'SkilledWorkers'),
        where('phoneNumber', '==', phoneNumber)
      );
      
      const snapshot = await getDocs(workersQuery);
      
      if (snapshot.empty) {
        throw new Error('No worker found with this phone number');
      }

      // Get worker data
      const workerDoc = snapshot.docs[0];
      const workerData = {
        id: workerDoc.id,
        ...workerDoc.data()
      };

      console.log('Worker logged in:', workerData);
      
      // Call parent login handler
      if (onLogin) {
        onLogin(workerData);
      }

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="worker-login-container">
      <div className="worker-login-header">
        <h2>Worker Login</h2>
        <p>Enter your phone number to access your account</p>
      </div>

      {error && (
        <div className="error-message">
          <span>❌</span>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="worker-login-form">
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number (Pakistan) *</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            required
            placeholder="+92-300-1234567"
            pattern="^(\+92|0)[0-9]{10}$"
            title="Enter valid Pakistan phone number (e.g., +92-300-1234567 or 0300-1234567)"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login with Phone Number'}
          </button>
        </div>
      </form>

      <div className="login-info">
        <p>📱 Workers login using their registered phone number</p>
        <p>🔒 No password required - phone number is your unique identifier</p>
      </div>
    </div>
  );
};

export default WorkerLogin;
