import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const LaboratoryDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [stats, setStats] = useState({
    pendingTests: 0,
    completedTests: 0,
    inProgress: 0,
    totalPatients: 0,
    totalTests: 0
  });
  const [recentTests, setRecentTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [labTasks, setLabTasks] = useState([]);
  const today = new Date().toISOString().split('T')[0];
  const [showQueue, setShowQueue] = useState(false);

  const loadLabTasks = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/laboratory?scheduled_date=${today}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Unable to fetch laboratory tasks.');
      }

      const data = await response.json();
      const tasks = data || [];
      setLabTasks(tasks);

      const uniquePatients = new Set(tasks.map((task) => task.patient?.id || task.patient_id)).size;
      const pendingCount = tasks.filter((task) => task.status === 'pending').length;
      const inProgressCount = tasks.filter((task) => task.status === 'in-progress').length;
      const completedCount = tasks.filter((task) => task.status === 'completed').length;

      setStats({
        pendingTests: pendingCount,
        completedTests: completedCount,
        inProgress: inProgressCount,
        totalPatients: uniquePatients,
        totalTests: tasks.length
      });

      setRecentTests(tasks.slice(0, 5).map((task) => ({
        id: task.id,
        patientName: task.patient?.name || 'Unknown',
        testType: task.test_type || 'Laboratory task',
        status: task.status || 'pending',
        date: task.scheduled_date ? new Date(task.scheduled_date).toLocaleDateString() : task.appointment?.appointment_date ? new Date(task.appointment.appointment_date).toLocaleDateString() : 'N/A'
      })));
    } catch (error) {
      console.error('Error loading lab tasks:', error);
    }
  }, [today]);

  const loadQueue = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/queue/laboratory?date=${today}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  }, [today]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const currentUser = JSON.parse(storedUser);
    setUser(currentUser);

    if (!['laboratory', 'laboratorist'].includes(currentUser.role)) {
      setAuthError('You must be logged in as laboratory staff to access this dashboard.');
      setIsLoading(false);
      return;
    }

    loadLabTasks()
      .catch((error) => console.error('Error loading lab tasks:', error))
      .finally(() => setIsLoading(false));
  }, [navigate, loadLabTasks]);

  useEffect(() => {
    if (!showQueue) {
      return;
    }

    loadQueue();
  }, [showQueue, loadQueue]);

  useEffect(() => {
    const handleWindowFocus = () => {
      loadLabTasks();
      if (showQueue) {
        loadQueue();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [showQueue, loadLabTasks, loadQueue]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadLabTasks();
      if (showQueue) {
        loadQueue();
      }
    }, 20000);

    return () => clearInterval(intervalId);
  }, [showQueue, loadLabTasks, loadQueue]);

  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');

    // Navigate to login page
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitLabResult = async (task) => {
    if (!user || !['laboratory', 'laboratorist'].includes(user.role)) {
      alert('Only laboratory staff can submit lab results.');
      return;
    }

    const labResults = window.prompt(
      `Enter lab results for ${task.patient?.name || 'patient'}:`
    );
    if (!labResults) return;

    const appointmentId = task.appointment_id || task.appointment?.id;
    if (!appointmentId) {
      alert('Unable to determine appointment ID.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          assigned_department: 'medical',
          lab_results: labResults
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit lab results');
      }
      // Update task status to completed instead of filtering it out
      setLabTasks((prev) =>
        prev.map((item) =>
          item.appointment_id === appointmentId
            ? { ...item, status: 'completed' }
            : item
        )
      );
      alert('Lab results submitted and sent to medical doctor. Status marked as Complete.');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Unable to submit lab results.');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
      case 'scheduled':
        return 'Scheduled';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const formatTime = (time) => {
    if (!time) {
      return 'TBD';
    }

    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleGenerateReport = () => {
    const reportDate = new Date(today).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laboratory Report - ${reportDate}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; }
          h2 { color: #4F46E5; margin-top: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #F3F4F6; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; }
          .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1F2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          thead { background: #4F46E5; color: white; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
          tbody tr:nth-child(even) { background: #F9FAFB; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 15px; }
          .print-only { display: none; }
          @media print { .print-only { display: block; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laboratory Dashboard Report</h1>
          <p><strong>Date:</strong> ${reportDate}</p>
          <p><strong>Laboratory Staff:</strong> ${user?.name || 'N/A'}</p>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Tests</div>
            <div class="stat-value">${stats.totalTests}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Tests</div>
            <div class="stat-value" style="color: #CA8A04;">${stats.pendingTests}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">In Progress</div>
            <div class="stat-value" style="color: #2563EB;">${stats.inProgress}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Completed</div>
            <div class="stat-value" style="color: #16A34A;">${stats.completedTests}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Patients</div>
            <div class="stat-value">${stats.totalPatients}</div>
          </div>
        </div>

        <h2>Laboratory Tasks</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient Name</th>
              <th>Queue #</th>
              <th>Doctor</th>
              <th>Status</th>
              <th>Appointment Date</th>
            </tr>
          </thead>
          <tbody>
            ${labTasks.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: #999;">No laboratory tasks for this date.</td></tr>' :
        labTasks.map((task) => `
                <tr>
                  <td>#${task.id}</td>
                  <td>${task.patient?.name || task.patient_name || 'Unknown'}</td>
                  <td>#${task.queue_number || '—'}</td>
                  <td>${task.doctor?.name || task.doctor_name || 'N/A'}</td>
                  <td>${task.status || 'scheduled'}</td>
                  <td>${task.appointment_date ? new Date(task.appointment_date).toLocaleDateString() : '—'}</td>
                </tr>
              `).join('')
      }
          </tbody>
        </table>

        <div class="footer">
          <p>Report generated on ${new Date().toLocaleString()}</p>
          <p>Hospital Management System - Laboratory Report</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Laboratory Dashboard...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-lg">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-4 text-gray-600">{authError}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laboratory Dashboard</h1>
              <p className="text-sm text-gray-600">Manage laboratory tests and results</p>
              <p className="mt-2 text-sm text-gray-500">Showing data for: <span className="font-semibold text-gray-700">{new Date(today).toLocaleDateString()}</span></p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`px-4 py-2 rounded-md transition-colors ${showQueue
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
              >
                {showQueue ? 'Hide Queue' : 'Show Queue'}
              </button>
              <button
                onClick={handleGenerateReport}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Generate Report
              </button>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Age-Based Queue Section */}
        {showQueue && (
          <>
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Age-Based Patient Queue</h2>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      Total: <span className="font-semibold">{queue.length}</span>
                    </span>
                    <span className="text-red-600">
                      Priority (50+): <span className="font-semibold">{queue.filter(p => p.priority_level === 'high').length}</span>
                    </span>
                    <span className="text-blue-600">
                      Normal: <span className="font-semibold">{queue.filter(p => p.priority_level === 'normal').length}</span>
                    </span>
                  </div>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">📋</div>
                  <p className="text-gray-500 text-lg">No patients in queue for this date</p>
                  <p className="text-gray-400 text-sm mt-2">Patients will appear here when appointments are scheduled</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Priority Queue (50+) */}
                    <div>
                      <h3 className="text-md font-semibold text-red-600 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Priority Queue (Age 50+) - Queue Numbers 1-10
                      </h3>
                      <div className="space-y-3">
                        {queue.filter(p => p.priority_level === 'high').slice(0, 10).map((patient) => (
                          <div key={patient.appointment_id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <span className="text-red-600 font-bold">#{patient.queue_number}</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{patient.patient.name}</h4>
                                  <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                                    <span className="font-semibold">Age: {patient.patient.age}</span>
                                    <span>📞 {patient.patient.phone_number}</span>
                                    <span>🕐 {formatTime(patient.appointment_time)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Priority
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Normal Queue (<50) */}
                    <div>
                      <h3 className="text-md font-semibold text-blue-600 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Normal Queue (Age &lt;50) - Queue Numbers 11+
                      </h3>
                      <div className="space-y-3">
                        {queue.filter(p => p.priority_level === 'normal').map((patient) => (
                          <div key={patient.appointment_id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold">#{patient.queue_number}</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{patient.patient.name}</h4>
                                  <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                                    <span className="font-semibold">Age: {patient.patient.age}</span>
                                    <span>📞 {patient.patient.phone_number}</span>
                                    <span>🕐 {formatTime(patient.appointment_time)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Normal
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Queue Legend */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Queue Priority System</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                        <div>
                          <span className="font-medium text-red-600">Priority Patients (50+ years)</span>
                          <p className="text-gray-600">Queue numbers 1-10 - Served first</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                        <div>
                          <span className="font-medium text-blue-600">Normal Patients (&lt;50 years)</span>
                          <p className="text-gray-600">Queue numbers 11+ - Served after priority</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Recent Tests Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Laboratory Task Queue</h2>
            <p className="text-sm text-gray-600">Tasks assigned from medical doctors</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queue #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No laboratory tasks assigned yet.</td>
                  </tr>
                ) : (
                  labTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{task.appointment?.id || task.appointment_id || task.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{task.queue_number || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.patient?.name || 'Unknown patient'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.appointment?.doctor?.name || task.doctor?.name || 'Doctor not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.scheduled_date ? new Date(task.scheduled_date).toLocaleDateString() : task.appointment?.appointment_date ? new Date(task.appointment.appointment_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          View
                        </button>
                        {task.status === 'completed' ? (
                          <span className="text-green-600 font-semibold">Complete</span>
                        ) : (
                          <button
                            onClick={() => handleSubmitLabResult(task)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Submit Results
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Add New Test</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-900">View All Tests</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Generate Report</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Categories</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Blood Tests</span>
                <span className="text-sm font-medium text-gray-900">15</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Urine Tests</span>
                <span className="text-sm font-medium text-gray-900">8</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Radiology</span>
                <span className="text-sm font-medium text-gray-900">12</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Pathology</span>
                <span className="text-sm font-medium text-gray-900">6</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div >
  );
};

export default LaboratoryDashboard;
