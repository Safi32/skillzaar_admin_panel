import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from './firebase';

const CreateSkilledWorker = () => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    cnic: '',
    age: '',
    city: '',
    workingRadius: '',
    categories: [],
    description: '',
    rate: ''
  });

  const [files, setFiles] = useState({
    profilePicture: null,
    cnicFront: null,
    cnicBack: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const skillCategories = [
    'Cleaning Services',
    'Plumbing Services',
    'Carpentry & Furniture',
    'Painting & Finishing',
    'Masonry & Metalwork',
    'Roofing Services',
    'Glass & Installation',
    'Outdoor & Gardening',
    'Electrical Services',
    'Appliance Deep Cleaning',
    'Labour & Moving',
    'Car Care Services',
    'Water & Utility',
    'Catering & Events',
    'Residential & Commercial Construction',
    'Design & Planning',
    'Renovation & Finishing',
    'Specialized Works',
    'Outdoor Construction'
  ];

  const cities = [
    'Islamabad', 'Rawalpindi', 'Karachi', 'Lahore', 'Peshawar',
    'Quetta', 'Multan', 'Faisalabad', 'Sialkot', 'Gujranwala'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };




  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, value]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat !== value)
      }));
    }
  };


  const uploadFile = async (file, path) => {
    if (!file) return null;
    
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.phoneNumber || !formData.cnic || 
          !formData.age || !formData.city || !formData.workingRadius ||
          formData.categories.length === 0) {
        throw new Error('Please fill in all required fields and select at least one service category');
      }

      if (!files.profilePicture || !files.cnicFront || !files.cnicBack) {
        throw new Error('Please upload all required files');
      }

      // Validate phone number format
      const phoneRegex = /^(\+92|0)[0-9]{10}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        throw new Error('Please enter a valid Pakistan phone number');
      }

      // Format phone number
      let phoneNumber = formData.phoneNumber;
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+92' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('+92')) {
        phoneNumber = '+92' + phoneNumber;
      }

      console.log('Creating skilled worker...');

      // Upload files to Firebase Storage
      const timestamp = Date.now();
      const [profilePictureURL, cnicFrontURL, cnicBackURL] = await Promise.all([
        uploadFile(files.profilePicture, `skilled_workers/${timestamp}/profile`),
        uploadFile(files.cnicFront, `skilled_workers/${timestamp}/cnic_front`),
        uploadFile(files.cnicBack, `skilled_workers/${timestamp}/cnic_back`)
      ]);

      // Save worker data to Firestore
      const db = getFirestore(app);
      const workerData = {
        // Basic Information
        Name: formData.name,
        phoneNumber: phoneNumber,
        userPhone: phoneNumber,
        Age: parseInt(formData.age),
        age: parseInt(formData.age),
        City: formData.city,
        city: formData.city,
        workingRadiusKm: parseInt(formData.workingRadius),
        workingRadius: parseInt(formData.workingRadius),
        
        // CNIC Information
        cnic: formData.cnic,
        CNICFront: cnicFrontURL,
        CNICBack: cnicBackURL,
        
        // Profile Information
        ProfilePicture: profilePictureURL,
        profileImage: profilePictureURL,
        displayName: formData.name,
        description: formData.description || 'Skilled worker',
        rate: formData.rate || '0',
        
        // Skills and Categories
        categories: formData.categories,
        skills: formData.categories,
        
        // System Information
        skilledWorkerId: `skilled_worker_${phoneNumber.replace(/[^0-9]/g, '')}_${timestamp}`,
        userType: 'admin_created',
        isActive: true,
        isOnline: false,
        isVerified: true,
        phoneVerified: true,
        isApproved: true,
        approvalStatus: 'approved',
        adminAction: 'created',
        adminActionAt: new Date(),
        adminId: 'admin_panel',
        adminName: 'Admin Panel',
        
        // Status and Stats
        status: 'approved',
        availability: true,
        completed: true,
        portfolioCompleted: true,
        profileCompleted: true,
        profileCompletedAt: new Date(),
        
        // Ratings and Experience
        averageRating: 0,
        rating: 0,
        ratingCount: 0,
        experience: '0',
        
        // Stats
        stats: {
          jobsApplied: 0,
          jobsCompleted: 0,
          rating: 0,
          totalEarned: 0
        },
        
        // Settings
        settings: {
          emailNotifications: true,
          notifications: true,
          smsNotifications: true
        },
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        lastUpdated: new Date(),
        timestamp: new Date(),
        
        // Location (will be updated when worker sets location)
        currentAddress: '',
        currentLatitude: 0,
        currentLongitude: 0,
        currentLocation: null,
        lastLocationUpdate: null,
        locationUpdatedAt: null
      };

      await addDoc(collection(db, 'SkilledWorkers'), workerData);
      
      setSuccess('Skilled worker created successfully! Data saved to Firestore. Worker is automatically approved and ready to work.');
      
      // Reset form
      setFormData({
        name: '',
        phoneNumber: '',
        cnic: '',
        age: '',
        city: '',
        workingRadius: '',
        categories: [],
        description: '',
        rate: ''
      });
      setFiles({
        profilePicture: null,
        cnicFront: null,
        cnicBack: null
      });

    } catch (error) {
      console.error('Error creating skilled worker:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-worker-container">
      <div className="create-worker-header">
        <h2>Create New Skilled Worker</h2>
        <p>Add a new skilled worker to the system</p>
        <div className="admin-created-notice">
          <span className="notice-icon">👨‍💼</span>
          <span className="notice-text">Admin-created workers are automatically approved and ready to work</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌</span>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <span>✅</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-worker-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (Pakistan) *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                placeholder="+92-300-1234567"
                pattern="^(\+92|0)[0-9]{10}$"
                title="Enter valid Pakistan phone number (e.g., +92-300-1234567 or 0300-1234567)"
              />
            </div>
          </div>


          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cnic">CNIC Number *</label>
              <input
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                required
                placeholder="12345-1234567-1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="age">Age *</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
                min="18"
                max="65"
                placeholder="25"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="workingRadius">Working Radius (km) *</label>
              <input
                type="number"
                id="workingRadius"
                name="workingRadius"
                value={formData.workingRadius}
                onChange={handleInputChange}
                required
                min="1"
                max="50"
                placeholder="10"
              />
            </div>
          </div>
        </div>


        <div className="form-section">
          <h3>Skills & Categories *</h3>
          <p className="form-help-text">Select all services this worker can provide (at least one required)</p>
          <div className="categories-grid">
            {skillCategories.map(category => (
              <label key={category} className="category-checkbox">
                <input
                  type="checkbox"
                  value={category}
                  checked={formData.categories.includes(category)}
                  onChange={handleCategoryChange}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>File Uploads *</h3>
          <div className="file-upload-row">
            <div className="file-upload-group">
              <label htmlFor="profilePicture">Profile Picture *</label>
              <input
                type="file"
                id="profilePicture"
                name="profilePicture"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              {files.profilePicture && (
                <div className="file-preview">
                  <img 
                    src={URL.createObjectURL(files.profilePicture)} 
                    alt="Profile preview" 
                    style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%'}}
                  />
                </div>
              )}
            </div>

            <div className="file-upload-group">
              <label htmlFor="cnicFront">CNIC Front *</label>
              <input
                type="file"
                id="cnicFront"
                name="cnicFront"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              {files.cnicFront && (
                <div className="file-preview">
                  <img 
                    src={URL.createObjectURL(files.cnicFront)} 
                    alt="CNIC Front preview" 
                    style={{width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}
                  />
                </div>
              )}
            </div>

            <div className="file-upload-group">
              <label htmlFor="cnicBack">CNIC Back *</label>
              <input
                type="file"
                id="cnicBack"
                name="cnicBack"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              {files.cnicBack && (
                <div className="file-preview">
                  <img 
                    src={URL.createObjectURL(files.cnicBack)} 
                    alt="CNIC Back preview" 
                    style={{width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description about skills and experience"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="rate">Hourly Rate (PKR)</label>
              <input
                type="number"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                placeholder="500"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Worker...' : 'Create Skilled Worker'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSkilledWorker;
