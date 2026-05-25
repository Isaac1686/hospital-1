import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [postponeFormData, setPostponeFormData] = useState({
    date: ''
  });
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
          // Transform the data and fetch queue positions for scheduled appointments
          const transformedAppointments = await Promise.all(appointmentsData.map(async (apt) => {
            let queuePosition = null;

            // Only fetch queue position for scheduled appointments
            if (apt.status === 'scheduled') {
              try {
                const queueResponse = await fetch(`http://localhost:8000/api/queue/position?patient_id=${userId}&doctor_id=${apt.doctor_id}&date=${apt.appointment_date}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                });

                if (queueResponse.ok) {
                  const queueData = await queueResponse.json();
                  if (queueData.in_queue) {
                    queuePosition = queueData.queue_position;
                  }
                }
              } catch (queueError) {
                console.error('Error fetching queue position:', queueError);
              }
            }

            // Check if appointment date has passed
            const appointmentDate = apt.appointment_date ? new Date(apt.appointment_date) : new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const appointmentDateOnly = new Date(appointmentDate);
            appointmentDateOnly.setHours(0, 0, 0, 0);

            let status = apt.status;
            // If appointment date has passed and status is still scheduled, mark as expired
            if (appointmentDateOnly < today && apt.status === 'scheduled') {
              status = 'expired';
            }

            return {
              id: apt.id,
              doctor: `Dr. ${apt.doctor?.name || 'Unknown Doctor'}`,
              specialty: apt.doctor?.role === 'medical_doctor' ? 'General Practitioner' : 'Specialist',
              date: apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString() : new Date().toLocaleDateString(),
              time: apt.appointment_date ? formatTime(new Date(apt.appointment_date).toTimeString().substring(0, 5)) : '',
              status: status,
              queuePosition: queuePosition,
              doctor_id: apt.doctor_id
            };
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

  const handleEditAppointment = (appointment) => {
    // Navigate to appointment booking page with edit data
    navigate('/patient/book-appointment', { state: { editAppointment: appointment } });
  };

  const handlePostponeAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setPostponeFormData({
      date: ''
    });
    setShowPostponeModal(true);
  };

  const handleCancelAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const confirmPostpone = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${selectedAppointment.id}/postpone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          date: postponeFormData.date
        })
      });

      if (response.ok) {
        // Update local state
        setAppointments(prev => prev.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, date: postponeFormData.date }
            : apt
        ));
        setShowPostponeModal(false);
        setSelectedAppointment(null);
        alert('Appointment postponed successfully!');
      } else {
        alert('Failed to postpone appointment');
      }
    } catch (error) {
      alert('Failed to postpone appointment. Please try again.');
    }
  };

  const confirmCancel = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${selectedAppointment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from local state
        setAppointments(prev => prev.filter(apt => apt.id !== selectedAppointment.id));
        setShowCancelModal(false);
        setSelectedAppointment(null);
        alert('Appointment cancelled successfully!');
      } else {
        alert('Failed to cancel appointment');
      }
    } catch (error) {
      alert('Failed to cancel appointment. Please try again.');
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 mx-auto absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Patient Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 ml-4">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleBookAppointment}
              className="group bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative text-center">
                <div className="bg-white/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Book Appointment</h3>
                <p className="text-blue-100 text-sm mt-2">Schedule with a doctor</p>
              </div>
            </button>

            <button
              onClick={handleViewRecords}
              className="group bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative text-center">
                <div className="bg-white/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">View Records</h3>
                <p className="text-emerald-100 text-sm mt-2">Access medical history</p>
              </div>
            </button>

          </div>
        </div>

        {/* Appointments Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">Your Appointments</h2>
            </div>
            <button
              onClick={refreshAppointments}
              className="inline-flex items-center px-4 py-3 border border-gray-200 shadow-sm text-sm leading-4 font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          {appointments.length > 0 ? (
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-gray-100">
              <div className="space-y-6">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 bg-gradient-to-r from-white to-blue-50/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full p-2 mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">{appointment.doctor}</h3>
                          <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full ${appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                appointment.status === 'expired' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                                  'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                            {appointment.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 font-medium">{appointment.specialty}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center bg-gray-50 rounded-lg p-3">
                            <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span className="font-medium text-gray-700">{new Date(appointment.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center bg-gray-50 rounded-lg p-3">
                            <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="font-medium text-gray-700">{appointment.time}</span>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">

                          {appointment.queuePosition && (
                            <div className="mt-3 inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                              </svg>
                              Queue Position: #{appointment.queuePosition}
                            </div>
                          )}
                          {/* Action Buttons */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleEditAppointment(appointment)}
                              disabled={appointment.status === 'expired'}
                              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${appointment.status === 'expired' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2z"></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handlePostponeAppointment(appointment)}
                              disabled={appointment.status === 'expired'}
                              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${appointment.status === 'expired' ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'}`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Postpone
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(appointment)}
                              disabled={appointment.status === 'expired'}
                              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${appointment.status === 'expired' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-12 text-center border border-gray-100">
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No appointments yet</h3>
                <p className="text-gray-600 mb-8">Book your first appointment to get started with your healthcare journey</p>
                <button
                  onClick={handleBookAppointment}
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:-translate-y-1 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Book Your First Appointment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Patient Information Card */}
        <div className="mt-12 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 ml-4">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-600 mb-2">Full Name</p>
              <p className="text-lg font-medium text-gray-900">{user?.full_name || user?.fullName || user?.name || 'Not available'}</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-600 mb-2">Email Address</p>
              <p className="text-lg font-medium text-gray-900">{user?.email || 'Not available'}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-purple-600 mb-2">Phone Number</p>
              <p className="text-lg font-medium text-gray-900">{user?.phone_number || user?.phoneNumber || user?.phone || 'Not available'}</p>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-600 mb-2">Patient ID</p>
              <p className="text-lg font-medium text-gray-900">PT-{Math.floor(Math.random() * 100000)}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Postpone Appointment Modal */}
      {showPostponeModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Postpone Appointment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Current appointment: {new Date(selectedAppointment.date).toLocaleDateString()}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                  <input
                    type="date"
                    value={postponeFormData.date}
                    onChange={(e) => setPostponeFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPostponeModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPostpone}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Postpone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Appointment</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to cancel your appointment with {selectedAppointment.doctor} on {new Date(selectedAppointment.date).toLocaleDateString()}?
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  No, Keep It
                </button>
                <button
                  onClick={confirmCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
