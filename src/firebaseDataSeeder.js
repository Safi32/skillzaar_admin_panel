// Firebase Data Seeder for Testing
import { getFirestore, collection, addDoc, GeoPoint } from 'firebase/firestore';
import app from './firebase';

const seedSkilledWorkers = async () => {
  const db = getFirestore(app);
  
  const sampleWorkers = [
    {
      Name: 'Safiullah Ahmed',
      email: 'safiullah@skillzaar.com',
      phoneNumber: '+92-300-1234567',
      ProfilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      categories: ['Electrician', 'Electrical Services'],
      averageRating: 4.8,
      City: 'Islamabad',
      currentAddress: 'F-8, Islamabad',
      currentLocation: new GeoPoint(33.6844 + 0.05, 73.0479 + 0.05),
      status: 'available',
      jobAssigned: false,
      experience: '5 years',
      workingRadiusKm: 15,
      rate: '1500',
      approvalStatus: 'approved',
      isApproved: true,
      availability: true,
      isOnline: true,
      description: 'Professional electrician with 5 years experience'
    },
    {
      Name: 'Fatima Sheikh',
      email: 'fatima@skillzaar.com',
      phoneNumber: '+92-301-2345678',
      ProfilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      categories: ['Plumber', 'Plumbing Services'],
      averageRating: 4.6,
      City: 'Rawalpindi',
      currentAddress: 'Cantt, Rawalpindi',
      currentLocation: new GeoPoint(33.6844 - 0.03, 73.0479 - 0.03),
      status: 'available',
      jobAssigned: false,
      experience: '3 years',
      workingRadiusKm: 12,
      rate: '1200',
      approvalStatus: 'approved',
      isApproved: true,
      availability: true,
      isOnline: true,
      description: 'Expert plumber specializing in residential repairs'
    },
    {
      Name: 'Usman Tariq',
      email: 'usman@skillzaar.com',
      phoneNumber: '+92-302-3456789',
      ProfilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      categories: ['Carpenter', 'Furniture'],
      averageRating: 4.9,
      City: 'Islamabad',
      currentAddress: 'F-7, Islamabad',
      currentLocation: new GeoPoint(33.6844 + 0.02, 73.0479 - 0.02),
      status: 'busy',
      jobAssigned: true,
      experience: '7 years',
      workingRadiusKm: 20,
      rate: '1800',
      approvalStatus: 'approved',
      isApproved: true,
      availability: false,
      isOnline: true,
      description: 'Master carpenter with custom furniture expertise'
    }
  ];

  try {
    console.log('🌱 Seeding skilled workers...');
    for (const worker of sampleWorkers) {
      const docRef = await addDoc(collection(db, 'SkilledWorkers'), worker);
      console.log('✅ Added worker:', worker.Name, 'with ID:', docRef.id);
    }
    console.log('🎉 All workers seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding workers:', error);
  }
};

const seedJobs = async () => {
  const db = getFirestore(app);
  
  const sampleJobs = [
    {
      title: 'Electrical Panel Upgrade',
      description: 'Upgrade electrical panel in commercial building',
      location: 'Blue Area, Islamabad',
      pay: '12000',
      urgency: 'high',
      category: 'Electrician',
      status: 'pending',
      assignedWorkerId: null,
      createdBy: 'admin',
      createdAt: new Date()
    },
    {
      title: 'Wiring Installation',
      description: 'Install new wiring for office renovation',
      location: 'F-7, Islamabad',
      pay: '8000',
      urgency: 'medium',
      category: 'Electrician',
      status: 'pending',
      assignedWorkerId: null,
      createdBy: 'admin',
      createdAt: new Date()
    },
    {
      title: 'Emergency Electrical Repair',
      description: 'Fix electrical emergency in residential area',
      location: 'DHA, Islamabad',
      pay: '6000',
      urgency: 'urgent',
      category: 'Electrician',
      status: 'pending',
      assignedWorkerId: null,
      createdBy: 'admin',
      createdAt: new Date()
    }
  ];

  try {
    console.log('🌱 Seeding jobs...');
    for (const job of sampleJobs) {
      const docRef = await addDoc(collection(db, 'Jobs'), job);
      console.log('✅ Added job:', job.title, 'with ID:', docRef.id);
    }
    console.log('🎉 All jobs seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
  }
};

// Export functions for use in console or components
export { seedSkilledWorkers, seedJobs };

// Auto-run if this file is imported
if (typeof window !== 'undefined') {
  console.log('🌱 Data seeder loaded. Use seedSkilledWorkers() and seedJobs() in console to add sample data.');
}
