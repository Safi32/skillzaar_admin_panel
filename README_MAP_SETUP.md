# Real-time Map Setup for Skillzaar Admin Panel

## Overview
This implementation provides a real-time map view for Pakistan with live worker locations and job assignment functionality. The map uses Google Maps API and Firebase for real-time data synchronization.

## Features
- 🗺️ **Real-time Pakistan Map**: Focused on Pakistan with major cities
- 👷 **Live Worker Locations**: Real-time tracking of skilled workers
- 📍 **Interactive Markers**: Click to view worker details and assign jobs
- 🔄 **Real-time Updates**: Live data synchronization with Firebase
- 📱 **Job Assignment**: Create and assign jobs directly from the map
- 🔔 **Notifications**: Real-time notifications for job assignments
- 📊 **Admin Controls**: Map controls, zoom, and view management

## Setup Instructions

### 1. Google Maps API Key Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security
6. Add the API key to your environment variables

### 2. Environment Configuration
Create a `.env` file in your project root:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Firebase Configuration
Ensure your Firebase project has the following collections:
- `SkilledWorkers` - For worker data
- `Jobs` - For job postings and assignments
- `User` - For user management

### 4. Required Firebase Collections Structure

#### SkilledWorkers Collection
```javascript
{
  name: "Worker Name",
  email: "worker@email.com",
  role: "Electrician", // or other skilled roles
  phone: "+92-300-1234567",
  rating: 4.8,
  city: "karachi", // or other Pakistani cities
  location: "Karachi, Pakistan",
  approvalStatus: "approved",
  jobAssigned: false,
  assignedJobId: null,
  jobAssignedAt: null
}
```

#### Jobs Collection
```javascript
{
  title: "Job Title",
  description: "Job Description",
  location: "Job Location",
  urgency: "medium", // low, medium, high, urgent
  pay: "5000",
  category: "Electrician",
  status: "pending", // pending, assigned, completed
  assignedWorkerId: null,
  assignedWorkerName: null,
  createdBy: "admin",
  createdAt: timestamp,
  assignedAt: null
}
```

### 5. Installation
The required packages are already installed:
```bash
npm install @googlemaps/react-wrapper @googlemaps/js-api-loader
```

### 6. Usage
The map component is automatically integrated into the admin panel. Navigate to the "Map View" tab to access the real-time map.

## Features Explained

### Real-time Data Sync
- Uses Firebase `onSnapshot` for real-time updates
- Automatically updates worker locations and job assignments
- No page refresh required for live data

### Map Controls
- **Reset View**: Returns to Pakistan overview
- **Zoom In/Out**: Adjust map zoom level
- **Legend**: Shows available vs assigned workers

### Job Assignment
- Click on any worker marker to open assignment modal
- View available jobs from Firebase
- Create new jobs and assign immediately
- Real-time updates across all admin users

### Notifications
- Real-time notifications for job assignments
- Auto-dismiss after 5 seconds
- Shows recent activity

## Customization

### Adding New Cities
Update the `PAKISTAN_CITIES` object in `src/config.js`:
```javascript
export const PAKISTAN_CITIES = {
  // ... existing cities
  newcity: { lat: 30.1234, lng: 70.5678, name: 'New City' }
};
```

### Styling
Map styles can be customized in the `MapComponent` initialization in `src/RealTimeMap.js`.

### Real-time Update Frequency
Adjust the update interval in `src/config.js`:
```javascript
export const CONFIG = {
  REALTIME_UPDATE_INTERVAL: 5000, // 5 seconds
  // ... other config
};
```

## Security Considerations

1. **API Key Security**: Restrict your Google Maps API key to specific domains
2. **Firebase Rules**: Implement proper security rules for your collections
3. **Data Validation**: Validate all data before saving to Firebase

## Troubleshooting

### Map Not Loading
- Check if Google Maps API key is correctly set
- Verify API key has required permissions
- Check browser console for errors

### Real-time Updates Not Working
- Verify Firebase connection
- Check Firebase security rules
- Ensure collections exist with proper structure

### Performance Issues
- Reduce update frequency if needed
- Implement pagination for large datasets
- Use Firebase indexes for better query performance

## Production Deployment

1. Set up proper environment variables
2. Configure Firebase security rules
3. Set up proper Google Maps API key restrictions
4. Test real-time functionality thoroughly
5. Monitor Firebase usage and costs

## Support
For issues or questions, check the Firebase console logs and browser developer tools for detailed error messages.
