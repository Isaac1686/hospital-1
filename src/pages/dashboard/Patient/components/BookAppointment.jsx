import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Notification from '../../../../components/Notification.jsx';

const BookAppointment = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorType: '',
    date: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: ''
  });
  const [postponeFormData, setPostponeFormData] = useState({
    date: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  const showNotification = (message, type = 'success', queueData = null) => {
    setNotification({
      message,
      type,
      queueData
    });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Check for edit appointment data passed from PatientDashboard
    const editAppointmentData = location.state?.editAppointment;

    fetchDoctors();
    fetchAppointments();

    // If editing, populate form with existing appointment data
    if (editAppointmentData) {
      setFormData({
        doctorId: editAppointmentData.doctor_id,
        doctorType: editAppointmentData.doctor?.role === 'medical_doctor' ? 'medical' : 'specialist',
        date: editAppointmentData.date
      });
      setSelectedAppointment(editAppointmentData);
    }

    setTimeout(() => setLoading(false), 500);
  }, [navigate]);

  const fetchDoctors = async () => {
    try {
      // API call to fetch doctors from backend
      const response = await fetch('http://localhost:8000/api/doctors', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const responseJson = await response.json();

        // Extract the doctors array from the response
        const data = responseJson.data || [];

        // Transform the data to match frontend expectations
        const transformedDoctors = data.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          type: doctor.role === 'specialist' ? 'specialist' : 'medical',
          specialty: doctor.specialty,
          available: true
        }));

        setDoctors(transformedDoctors);
      } else {
        // Fallback to empty array on error
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Fallback to empty array on error
      setDoctors([]);
    }
  };

  const fetchAppointments = async () => {
    try {
      // API call to fetch appointments (without auth for testing)
      const response = await fetch('http://localhost:8000/api/appointments', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Transform the data to match frontend expectations
        const transformedAppointments = data.map(apt => ({
          id: apt.id,
          doctorId: apt.doctor_id,
          doctorName: apt.doctor?.name || 'Unknown Doctor',
          doctorSpecialty: apt.doctor?.category || 'General',
          date: apt.created_at ? new Date(apt.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          time: apt.created_at ? new Date(apt.created_at).toTimeString().substring(0, 5) : '',
          status: apt.status
        }));

        setAppointments(transformedAppointments);
      } else {
        console.error('Failed to fetch appointments');
        // Set empty array on error
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Set empty array on error
      setAppointments([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear doctor selection when doctor type changes
    if (name === 'doctorType') {
      setFormData(prev => ({
        ...prev,
        doctorId: ''
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.doctorType) {
      newErrors.doctorType = 'Please select a doctor type';
    }

    if (!formData.doctorId) {
      newErrors.doctorId = 'Please select a doctor';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Front-end check to prevent duplicate bookings for same doctor/date.
      const duplicateCheckResponse = await fetch(
        `http://localhost:8000/api/appointments?patient_id=${user?.id}&doctor_id=${formData.doctorId}&appointment_date=${formData.date}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (duplicateCheckResponse.ok) {
        const duplicateAppointments = await duplicateCheckResponse.json();
        const hasDuplicate = Array.isArray(duplicateAppointments) && duplicateAppointments.some(
          (apt) => apt.status === 'scheduled'
        );

        if (hasDuplicate) {
          showNotification(
            'You already made an appointment with this doctor at the selected date. You cannot make it twice.',
            'error'
          );
          setIsSubmitting(false);
          return;
        }
      }

      // API call to book appointment (without auth for testing)
      const response = await fetch('http://localhost:8000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          doctor_id: formData.doctorId,
          patient_id: user?.id,
          appointment_date: formData.date
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Get queue position after booking
        try {
          const queueResponse = await fetch(`http://localhost:8000/api/queue/position?patient_id=${user?.id}&doctor_id=${formData.doctorId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (queueResponse.ok) {
            const queueData = await queueResponse.json();
            const priorityLevel = user?.age >= 50 ? 'Priority (50+ years)' : 'Normal';
            showNotification(
              `Appointment booked successfully! Queue Position: #${queueData.queue_position}, Priority Level: ${priorityLevel}, Estimated Wait Time: ${queueData.estimated_wait_time} minutes`,
              'success',
              queueData
            );
          } else {
            showNotification('Appointment booked successfully!', 'success');
          }
        } catch (queueError) {
          console.error('Error fetching queue position:', queueError);
          showNotification('Appointment booked successfully!', 'success');
        }

        // Delay navigation to allow user to see the notification
        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 3000);
      } else {
        if (data.errors) {
          const frontendErrors = {};
          Object.keys(data.errors).forEach(key => {
            frontendErrors[key] = data.errors[key][0];
          });
          setErrors(frontendErrors);
        } else {
          setErrors({ general: data.message || 'Failed to book appointment' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Failed to book appointment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableTimes = () => {
    return [
      '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
      '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
      '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
    ];
  };

  const convertTo24HourFormat = (time12h) => {
    if (!time12h) return '';

    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');

    let hours24 = parseInt(hours);

    if (period === 'PM' && hours24 !== 12) {
      hours24 += 12;
    } else if (period === 'AM' && hours24 === 12) {
      hours24 = 0;
    }

    return `${hours24.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditFormData({
      date: appointment.date
    });
    setShowEditModal(true);
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

  const confirmEdit = async () => {
    try {
      // API call to update appointment (without auth for testing)
      const response = await fetch(`http://localhost:8000/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          date: editFormData.date
        })
      });

      if (response.ok) {
        // Update local state
        setAppointments(prev => prev.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, date: editFormData.date }
            : apt
        ));
        setShowEditModal(false);
        setSelectedAppointment(null);
        alert('Appointment updated successfully!');
      } else {
        alert('Failed to update appointment');
      }
    } catch (error) {
      alert('Failed to update appointment. Please try again.');
    }
  };

  const confirmPostpone = async () => {
    try {
      // API call to postpone appointment (without auth for testing)
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
      // API call to cancel appointment (without auth for testing)
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

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointment booking...</p>
        </div>
      </div>
    );
  }

  const filteredDoctors = doctors.filter(doctor => {
    if (formData.doctorType === 'specialist') {
      return doctor.type === 'specialist';
    } else if (formData.doctorType === 'medical') {
      return doctor.type === 'medical';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
              <p className="text-sm text-gray-600">Schedule an appointment with your preferred doctor</p>
            </div>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointment Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Appointment Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Doctor Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Type</label>
                <select
                  name="doctorType"
                  value={formData.doctorType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Doctor Type</option>
                  <option value="specialist">Specialist Doctor</option>
                  <option value="medical">Medical Doctor</option>
                </select>
                {errors.doctorType && (
                  <p className="mt-1 text-sm text-red-600">{errors.doctorType}</p>
                )}
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  disabled={!formData.doctorType}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Doctor</option>
                  {filteredDoctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.doctorId}</p>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {errors.general}
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking Appointment...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Doctor Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Doctors</h2>

            <div className="space-y-4">
              {!formData.doctorType && (
                <>
                  {/* Specialist Doctors Section */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      Specialist Doctors
                    </h3>
                    <div className="space-y-2">
                      {doctors.filter(d => d.type === 'specialist').length > 0 ? (
                        doctors.filter(d => d.type === 'specialist').map(doctor => (
                          <div key={doctor.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{doctor.name}</p>
                              <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${doctor.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No specialist doctors available</p>
                      )}
                    </div>
                  </div>

                  {/* Medical Doctors Section */}
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Medical Doctors
                    </h3>
                    <div className="space-y-2">
                      {doctors.filter(d => d.type === 'medical').length > 0 ? (
                        doctors.filter(d => d.type === 'medical').map(doctor => (
                          <div key={doctor.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{doctor.name}</p>
                              <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${doctor.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No medical doctors available</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {formData.doctorType === 'specialist' && (
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Specialist Doctors
                  </h3>
                  <div className="space-y-2">
                    {filteredDoctors.length > 0 ? (
                      filteredDoctors.map(doctor => (
                        <div key={doctor.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <div>
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${doctor.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No specialist doctors available</p>
                    )}
                  </div>
                </div>
              )}

              {formData.doctorType === 'medical' && (
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Medical Doctors
                  </h3>
                  <div className="space-y-2">
                    {filteredDoctors.length > 0 ? (
                      filteredDoctors.map(doctor => (
                        <div key={doctor.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <div>
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${doctor.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No medical doctors available</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Availability Status</h4>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span>Unavailable</span>
                </div>
              </div>
              {formData.doctorType && (
                <p className="text-xs text-gray-600 mt-3">
                  💡 Showing {formData.doctorType === 'specialist' ? 'Specialist' : 'Medical'} doctors. Clear the selection to see all doctors.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Existing Appointments Section */}

      </main>

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Appointment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    min={getMinDate()}
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
                  Are you sure you want to cancel your appointment with {selectedAppointment.doctorName} on {new Date(selectedAppointment.date).toLocaleDateString()}?
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

      {/* Notification Component */}
      <Notification notification={notification} onClose={hideNotification} />
    </div>
  );
};

export default BookAppointment;