import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    
    // Simulate fetching patient data
    fetchPatientData();
    
    setTimeout(() => setLoading(false), 1000);
  }, [navigate]);

  const fetchPatientData = async () => {
    // Simulate API calls
    try {
      // Mock appointments data
      const mockAppointments = [
        {
          id: 1,
          doctor: 'Dr. Sarah Johnson',
          specialty: 'General Practitioner',
          date: '2026-04-15',
          time: '10:30 AM',
          status: 'upcoming',
          reason: 'Regular checkup'
        },
        {
          id: 2,
          doctor: 'Dr. Michael Chen',
          specialty: 'Cardiologist',
          date: '2026-03-28',
          time: '2:00 PM',
          status: 'completed',
          reason: 'Follow-up consultation'
        }
      ];
      
      // Mock medical records
      const mockRecords = [
        {
          id: 1,
          date: '2026-03-28',
          doctor: 'Dr. Michael Chen',
          diagnosis: 'Hypertension',
          treatment: 'Prescribed medication for blood pressure control',
          notes: 'Patient responded well to treatment'
        },
        {
          id: 2,
          date: '2026-02-15',
          doctor: 'Dr. Sarah Johnson',
          diagnosis: 'Common Cold',
          treatment: 'Rest and fluids, prescribed decongestant',
          notes: 'Patient recovered fully'
        }
      ];
      
      setAppointments(mockAppointments);
      setMedicalRecords(mockRecords);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleBookAppointment = () => {
    // Navigate to appointment booking page
    navigate('/patient/book-appointment');
  };


  const handleViewRecords = () => {
    // Navigate to medical records page
    navigate('/patient/medical-records');
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.fullName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={handleBookAppointment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg shadow-md transition-colors"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="font-medium">Book Appointment</h3>
              </div>
            </button>
            
            <button
              onClick={handleViewRecords}
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-md transition-colors"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-medium">View Records</h3>
              </div>
            </button>
            
          </div>
        </div>


        {/* Patient Information Card */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-gray-900">{user?.full_name || user?.fullName || user?.name || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              <p className="text-gray-900">{user?.email || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="text-gray-900">{user?.phone_number || user?.phoneNumber || user?.phone || 'Not available'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Patient ID</p>
              <p className="text-gray-900">PT-{Math.floor(Math.random() * 100000)}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
