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

  // Refresh appointments when page gains focus (when user navigates back)
  useEffect(() => {
    const handleFocus = () => {
      fetchPatientData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchPatientData = async () => {
    try {
      // Fetch real appointments for the logged-in patient
      const userId = JSON.parse(localStorage.getItem('user'))?.id;

      if (userId) {
        const appointmentsResponse = await fetch(`http://localhost:8000/api/appointments?patient_id=${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();

          // Transform the data to match frontend expectations
          const transformedAppointments = appointmentsData.map(apt => ({
            id: apt.id,
            doctor: `Dr. ${apt.doctor?.name || 'Unknown Doctor'}`,
            specialty: apt.doctor?.role === 'medical_doctor' ? 'General Practitioner' : 'Specialist',
            date: apt.appointment_date,
            time: apt.appointment_time,
            status: apt.status,
            reason: apt.reason,
            symptoms: apt.symptoms
          }));

          setAppointments(transformedAppointments);
        } else {
          console.error('Failed to fetch appointments');
          setAppointments([]);
        }
      } else {
        setAppointments([]);
      }

      // Fetch medical records (mock for now)
      setMedicalRecords([]);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      setAppointments([]);
      setMedicalRecords([]);
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

  const refreshAppointments = async () => {
    await fetchPatientData();
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';

    // Parse time in HH:MM format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = minutes;

    // Convert to 12-hour format
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

    return `${displayHour}:${minute} ${period}`;
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

        {/* Appointments Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Appointments</h2>
            <button
              onClick={refreshAppointments}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          {appointments.length > 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="font-semibold text-gray-900">{appointment.doctor}</h3>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {appointment.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{appointment.specialty}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            {new Date(appointment.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            {formatTime(appointment.time)}
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-700"><span className="font-medium">Reason:</span> {appointment.reason}</p>
                          {appointment.symptoms && (
                            <p className="text-sm text-gray-700"><span className="font-medium">Symptoms:</span> {appointment.symptoms}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-1">No appointments yet</p>
                <p className="text-sm text-gray-500 mb-4">Book your first appointment to get started</p>
                <button
                  onClick={handleBookAppointment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          )}
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
