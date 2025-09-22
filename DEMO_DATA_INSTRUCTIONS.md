# Demo Data Testing Instructions

## 🚀 How to Test the Real-time Map with Demo Data

### 1. **Seed Demo Data**
Open your browser console (F12) and run:
```javascript
// Import the seeder
import { seedAllData } from './src/demoDataSeeder.js';

// Seed all demo data
seedAllData();
```

### 2. **What You'll See**
- **10 Skilled Workers** with real profile images
- **6 Sample Jobs** for Rawalpindi-Islamabad area
- **Real-time Map** focused on twin cities
- **Interactive Markers** with user photos
- **Click Functionality** for job assignment

### 3. **Demo Workers Include:**
- **Ahmed Khan** - Electrician (F-8, Islamabad) - Available
- **Fatima Sheikh** - Plumber (Cantt, Rawalpindi) - Available  
- **Usman Tariq** - Carpenter (F-7, Islamabad) - Available
- **Hira Khan** - Painter (Saddar, Rawalpindi) - Available
- **Muhammad Hassan** - Electrician (Blue Area, Islamabad) - Available
- **Ayesha Ali** - Plumber (Chaklala, Rawalpindi) - Available
- **Ali Raza** - Carpenter (DHA, Islamabad) - Available
- **Sara Ahmed** - Painter (F-6, Islamabad) - Available
- **Hassan Ali** - Electrician (Cantt, Rawalpindi) - **Job Assigned**
- **Zainab Khan** - Plumber (F-8, Islamabad) - Available

### 4. **Features to Test:**
- ✅ **Click on markers** to see worker details
- ✅ **View profile images** in info windows
- ✅ **Assign jobs** through the modal
- ✅ **Real-time updates** when jobs are assigned
- ✅ **Map controls** (zoom, reset view)
- ✅ **Location-specific** markers for twin cities

### 5. **Map Areas Covered:**
- F-6, F-7, F-8 (Islamabad)
- Blue Area, DHA (Islamabad)
- Cantt, Saddar, Chaklala (Rawalpindi)

### 6. **Job Assignment Flow:**
1. Click on any worker marker
2. View detailed worker information with photo
3. See available jobs or create new job
4. Assign job to worker
5. Watch real-time updates on map

## 🎯 **Ready to Test!**
The map is now fully functional with real-time worker locations, images, and job assignment capabilities focused on Rawalpindi-Islamabad area!
