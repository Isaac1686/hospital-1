import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QueueManagement = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [queue, setQueue] = useState([]);
  const [allQueues, setAllQueues] = useState([]);
  const [showAllQueues, setShowAllQueues] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    if (JSON.parse(userData).role === 'admin') {
      fetchAllQueues();
      setShowAllQueues(true);
    } else {
      fetchDoctorQueue();
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (user && !showAllQueues) {
      fetchDoctorQueue();
    } else if (user && showAllQueues) {
      fetchAllQueues();
    }
  }, [selectedDate, user, showAllQueues]);

  const fetchDoctorQueue = async () => {
    try {
      setError('');
      const response = await fetch(`http://localhost:8000/api/queue/doctor?doctor_id=${user?.id}&date=${selectedDate}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
      } else {
        setError('Failed to fetch queue data');
        setQueue([]);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      setError('Failed to connect to server');
      setQueue([]);
    }
  };

  const fetchAllQueues = async () => {
    try {
      setError('');
      const response = await fetch(`http://localhost:8000/api/queue/all?date=${selectedDate}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllQueues(data.queues || []);
      } else {
        setError('Failed to fetch queue data');
        setAllQueues([]);
      }
    } catch (error) {
      console.error('Error fetching all queues:', error);
      setError('Failed to connect to server');
      setAllQueues([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (showAllQueues) {
      await fetchAllQueues();
    } else {
      await fetchDoctorQueue();
    }
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    return priority === 'high' ? 'text-red-600 bg-red-50 border-red-200' : 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getPriorityBadge = (priority) => {
    return priority === 'high' ? 'Priority (50+)' : 'Normal';
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateEstimatedWaitTime = (position) => {
    // Start with 0 minutes if no patients, otherwise 5 minutes base + 15 minutes per additional patient
    return position > 0 ? 5 + (position - 1) * 15 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading queue management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
              <p className="text-sm text-gray-600">
                {showAllQueues ? 'All Doctor Queues' : `${user?.name}'s Queue`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAllQueues(!showAllQueues)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {showAllQueues ? 'My Queue' : 'All Queues'}
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
              <button
                onClick={() => navigate('/specialist/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Single Doctor Queue */}
        {!showAllQueues && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Patient Queue for {selectedDate}
              </h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">
                  Total Patients: <span className="font-semibold">{queue.length}</span>
                </span>
                <span className="text-red-600">
                  Priority (50+): <span className="font-semibold">{queue.filter(p => p.priority_level === 'high').length}</span>
                </span>
                <span className="text-blue-600">
                  Normal: <span className="font-semibold">{queue.filter(p => p.priority_level === 'normal').length}</span>
                </span>
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-4">📋</div>
                <p className="text-gray-500 text-lg">No patients in queue for this date</p>
                <p className="text-gray-400 text-sm mt-2">Patients will appear here when appointments are scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((patient, index) => (
                  <div
                    key={patient.appointment_id}
                    className={`border rounded-lg p-4 ${getPriorityColor(patient.priority_level)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">#{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {patient.patient.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Age: {patient.patient.age}</span>
                            <span>📞 {patient.patient.phone_number}</span>
                            <span>🕐 {formatTime(patient.appointment_time)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.priority_level === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                              {getPriorityBadge(patient.priority_level)}
                            </span>
                          </div>
                          {patient.reason && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Reason:</strong> {patient.reason}
                            </p>
                          )}
                          {patient.symptoms && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Symptoms:</strong> {patient.symptoms}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Est. Wait Time
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {calculateEstimatedWaitTime(index + 1)} min
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Doctors Queues */}
        {showAllQueues && (
          <div className="space-y-6">
            {allQueues.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">📋</div>
                <p className="text-gray-500 text-lg">No queues available for this date</p>
              </div>
            ) : (
              allQueues.map((doctorQueue) => (
                <div key={doctorQueue.doctor.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {doctorQueue.doctor.name} ({doctorQueue.doctor.role === 'medical_doctor' ? 'Medical' : 'Specialist'})
                    </h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        Total: <span className="font-semibold">{doctorQueue.total_patients}</span>
                      </span>
                      <span className="text-red-600">
                        Priority: <span className="font-semibold">{doctorQueue.priority_patients}</span>
                      </span>
                      <span className="text-blue-600">
                        Normal: <span className="font-semibold">{doctorQueue.normal_patients}</span>
                      </span>
                    </div>
                  </div>

                  {doctorQueue.queue.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No patients in queue
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {doctorQueue.queue.slice(0, 5).map((patient, index) => (
                        <div
                          key={patient.appointment_id}
                          className={`border rounded-lg p-3 ${getPriorityColor(patient.priority_level)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 text-sm font-semibold">#{index + 1}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{patient.patient.name}</span>
                                <span className="text-gray-600 text-sm ml-2">
                                  ({patient.patient.age} years)
                                </span>
                                <span className="text-gray-500 text-sm ml-2">
                                  🕐 {formatTime(patient.appointment_time)}
                                </span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${patient.priority_level === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                  {getPriorityBadge(patient.priority_level)}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {calculateEstimatedWaitTime(index + 1)} min
                            </div>
                          </div>
                        </div>
                      ))}
                      {doctorQueue.queue.length > 5 && (
                        <div className="text-center text-sm text-gray-500 pt-2">
                          ... and {doctorQueue.queue.length - 5} more patients
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Queue Legend */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Priority System</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <div>
                <span className="font-medium text-red-600">Priority Patients (50+ years)</span>
                <p className="text-sm text-gray-600">Patients aged 50 and above receive priority attention</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <div>
                <span className="font-medium text-blue-600">Normal Patients (&lt;50 years)</span>
                <p className="text-sm text-gray-600">Patients under 50 years are served after priority patients</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This queue system automatically prioritizes patients based on age to reduce wait times for elderly patients and improve overall hospital efficiency.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QueueManagement;
