import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MedicalDoctorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalPatients: 156,
        appointmentsToday: 8
      });
      
      setRecentAppointments([
        { id: 1, patientName: 'John Doe', time: '09:00 AM', type: 'Regular Checkup', status: 'confirmed' },
        { id: 2, patientName: 'Jane Smith', time: '10:30 AM', type: 'Follow-up', status: 'confirmed' },
        { id: 3, patientName: 'Robert Johnson', time: '11:15 AM', type: 'Emergency', status: 'in-progress' },
        { id: 4, patientName: 'Emily Davis', time: '02:00 PM', type: 'Consultation', status: 'pending' },
        { id: 5, patientName: 'Michael Wilson', time: '03:30 PM', type: 'Regular Checkup', status: 'confirmed' }
      ]);
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

  const handleGeneratePrescription = () => {
    // Navigate to prescription generation page
    navigate('/prescriptions/generate');
  };

  const handleViewPatientRecords = () => {
    // Navigate to patient records page
    navigate('/patients');
  };

  const handleViewAppointment = (appointmentId) => {
    // Navigate to specific appointment details
    navigate(`/appointments/${appointmentId}`);
  };

  const handleStartAppointment = (appointmentId) => {
    // Update appointment status to in-progress
    setRecentAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'in-progress' }
          : apt
      )
    );
  };

  const handleCompleteAppointment = (appointmentId) => {
    // Update appointment status to completed
    setRecentAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'completed' }
          : apt
      )
    );
  };

  const handleViewPatient = (patientName) => {
    // Navigate to specific patient details
    navigate(`/patients?search=${encodeURIComponent(patientName)}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'Regular Checkup':
        return 'bg-blue-100 text-blue-800';
      case 'Follow-up':
        return 'bg-green-100 text-green-800';
      case 'Consultation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Medical Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Medical Dashboard</h1>
              <p className="text-sm text-gray-600">Manage patients and appointments</p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
              </div>
            </div>
          </div>


        </div>

        {/* Recent Appointments Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Today's Appointments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appointment.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(appointment.type)}`}>
                        {appointment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewAppointment(appointment.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        View
                      </button>
                      {appointment.status === 'confirmed' && (
                        <button 
                          onClick={() => handleStartAppointment(appointment.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Start
                        </button>
                      )}
                      {appointment.status === 'in-progress' && (
                        <button 
                          onClick={() => handleCompleteAppointment(appointment.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions and Patient List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              <button 
                onClick={handleGeneratePrescription}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Generate Prescription</span>
                </div>
              </button>
              <button 
                onClick={handleViewPatientRecords}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-900">View Patient Records</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Patients</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">JD</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">John Doe</p>
                      <p className="text-xs text-gray-500">Last visit: 2 days ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewPatient('John Doe')}
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    View
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">JS</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Jane Smith</p>
                      <p className="text-xs text-gray-500">Last visit: 1 week ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewPatient('Jane Smith')}
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    View
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-yellow-600">RJ</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Robert Johnson</p>
                      <p className="text-xs text-gray-500">Last visit: 2 weeks ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewPatient('Robert Johnson')}
                    className="text-indigo-600 hover:text-indigo-900 text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalDoctorDashboard;
