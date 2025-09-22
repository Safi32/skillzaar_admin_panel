# Map View Feature Documentation

## Overview
The Map View feature provides a comprehensive interface for administrators to view, manage, and assign jobs to skilled workers using an interactive Google Maps interface.

## Features

### 1. Interactive Map Display
- **Google Maps Integration**: Uses Google Maps API with custom styling
- **Worker Markers**: Each worker appears as a circular marker with their profile picture
- **Real-time Updates**: Automatically updates when workers are added or job statuses change
- **Custom Icons**: Profile pictures are displayed as circular markers with color-coded borders
  - Green border: Available workers
  - Red border: Workers with assigned jobs

### 2. Worker Details Modal
When clicking on a worker marker, a detailed modal displays:

#### Worker Information
- **Profile Picture**: Large circular avatar
- **Basic Details**: Name, role, rating, contact information
- **Professional Details**: Experience, skills, hourly rate
- **Status Indicators**: Available/Assigned status with color coding

#### Job History
- **Recent Jobs**: Displays last 10 jobs assigned to the worker
- **Job Details**: Title, description, location, pay, status, date
- **Status Colors**: Different colors for assigned, completed, pending jobs

#### Job Assignment Form
- **Create New Job**: Form to create and immediately assign jobs
- **Required Fields**: Job title, description, location
- **Optional Fields**: Pay amount, urgency level, category, job date
- **Real-time Assignment**: Jobs are immediately assigned to the selected worker

### 3. Real-time Data Management
- **Firebase Integration**: Uses Firestore for real-time data synchronization
- **Custom Hooks**: 
  - `useWorkers()`: Manages worker data with real-time updates
  - `useJobs()`: Fetches job history for specific workers
- **Error Handling**: Comprehensive error states and loading indicators
- **Fallback Data**: Demo data when no real workers are available

### 4. Map Controls
- **Reset View**: Returns to default center and zoom
- **Zoom Controls**: Zoom in/out buttons
- **Legend**: Visual guide for marker colors
- **Responsive Design**: Adapts to different screen sizes

## Technical Implementation

### Components Structure
```
MapView/
├── MapView.js (Main component)
├── MapView.css (Styling)
├── useWorkers (Custom hook)
├── useJobs (Custom hook)
├── MapComponent (Map rendering)
└── WorkerDetailsModal (Worker details & job assignment)
```

### Key Features

#### 1. Custom Hooks
```javascript
// Worker data management
const { workers, loading, error } = useWorkers();

// Job history for specific worker
const { jobs, loading, error } = useJobs(workerId);
```

#### 2. Real-time Updates
- Uses Firebase `onSnapshot` for real-time data
- Automatically updates markers when worker data changes
- Handles connection errors gracefully

#### 3. Google Maps Integration
- Dynamic script loading
- Custom marker icons with profile pictures
- Responsive map controls
- Custom map styling

#### 4. Job Assignment System
- Creates new jobs in Firestore `Jobs` collection
- Updates worker status in `SkilledWorkers` collection
- Real-time UI updates after assignment

### Data Structure

#### Worker Object
```javascript
{
  id: string,
  name: string,
  role: string,
  rating: number,
  phone: string,
  email: string,
  city: string,
  location: string,
  profileImage: string,
  jobAssigned: boolean,
  assignedJobId: string | null,
  coordinates: { lat: number, lng: number },
  skills: string[],
  experience: string,
  rate: string,
  // ... other fields
}
```

#### Job Object
```javascript
{
  id: string,
  title: string,
  description: string,
  location: string,
  urgency: 'low' | 'medium' | 'high' | 'urgent',
  pay: string,
  category: string,
  status: 'assigned' | 'completed' | 'pending',
  assignedWorkerId: string,
  assignedWorkerName: string,
  createdAt: Date,
  assignedAt: Date
}
```

## Usage

### 1. Accessing Map View
- Click on "Map View" in the admin panel sidebar
- The map loads with all available workers

### 2. Viewing Worker Details
- Click on any worker marker
- Modal opens with complete worker information
- View job history and current status

### 3. Assigning Jobs
- Click "Assign New Job" in the worker modal
- Fill in job details (title, description, location required)
- Click "Create & Assign Job"
- Job is immediately assigned to the worker

### 4. Map Navigation
- Use zoom controls to navigate
- Click "Reset View" to return to default view
- Legend shows marker color meanings

## Configuration

### Environment Variables
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Firebase Collections
- `SkilledWorkers`: Worker profiles and status
- `Jobs`: Job assignments and history

## Styling
- **Pure CSS**: No external CSS frameworks
- **Responsive Design**: Mobile-friendly layout
- **Modern UI**: Clean, professional appearance
- **Color Coding**: Intuitive status indicators
- **Animations**: Smooth transitions and hover effects

## Error Handling
- **API Key Validation**: Checks for valid Google Maps API key
- **Firebase Connection**: Handles connection errors gracefully
- **Loading States**: Shows loading indicators during data fetch
- **Fallback Data**: Demo data when no real data available

## Browser Support
- Modern browsers with ES6+ support
- Google Maps API compatibility
- Responsive design for mobile devices

## Performance Optimizations
- **Lazy Loading**: Google Maps script loaded only when needed
- **Marker Management**: Efficient marker creation and cleanup
- **Real-time Updates**: Optimized Firebase listeners
- **Memory Management**: Proper cleanup of event listeners

## Future Enhancements
- **Filtering**: Filter workers by skills, availability, location
- **Search**: Search for specific workers or jobs
- **Bulk Operations**: Assign multiple jobs at once
- **Analytics**: Worker performance metrics
- **Notifications**: Real-time notifications for job assignments
