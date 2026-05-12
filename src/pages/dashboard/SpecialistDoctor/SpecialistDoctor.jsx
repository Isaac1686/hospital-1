import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SpecialistDoctorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalPatients: 89,
        appointmentsToday: 6
      });
      
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Navigate to login page
    navigate('/login');
  };

  const handleViewPatientRecords = () => {
    // Navigate to patient records page
    navigate('/patients');
  };

  const handleSpecializationClick = (specialization) => {
    // Navigate to specialization-specific patients
    navigate(`/patients?specialization=${specialization.toLowerCase()}`);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Specialist Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Specialist Dashboard</h1>
              <p className="text-sm text-gray-600">Manage specialist consultations and referrals</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center transition-colors duration-200"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
              </div>
            </div>
          </div>

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
                            <button 
                onClick={handleViewPatientRecords}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002 2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-900">View Patient Records</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Specializations</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSpecializationClick('Cardiology')}
                  className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200 cursor-pointer"
                >
                  <p className="text-2xl font-bold text-red-600">Cardiology</p>
                  <p className="text-sm text-gray-600">12 patients</p>
                </button>
                <button 
                  onClick={() => handleSpecializationClick('Neurology')}
                  className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 cursor-pointer"
                >
                  <p className="text-2xl font-bold text-blue-600">Neurology</p>
                  <p className="text-sm text-gray-600">8 patients</p>
                </button>
                <button 
                  onClick={() => handleSpecializationClick('Orthopedics')}
                  className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 cursor-pointer"
                >
                  <p className="text-2xl font-bold text-green-600">Orthopedics</p>
                  <p className="text-sm text-gray-600">15 patients</p>
                </button>
                <button 
                  onClick={() => handleSpecializationClick('Pediatrics')}
                  className="text-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200 cursor-pointer"
                >
                  <p className="text-2xl font-bold text-yellow-600">Pediatrics</p>
                  <p className="text-sm text-gray-600">10 patients</p>
                </button>
                <button 
                  onClick={() => handleSpecializationClick('Dermatology')}
                  className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 cursor-pointer"
                >
                  <p className="text-2xl font-bold text-purple-600">Dermatology</p>
                  <p className="text-sm text-gray-600">6 patients</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistDoctorDashboard;
