import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LaboratoryDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingTests: 0,
    completedTests: 0,
    inProgress: 0,
    totalPatients: 0
  });
  const [recentTests, setRecentTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        pendingTests: 12,
        completedTests: 45,
        inProgress: 8,
        totalPatients: 23
      });
      
      setRecentTests([
        { id: 1, patientName: 'John Doe', testType: 'Blood Test', status: 'pending', date: '2026-04-09' },
        { id: 2, patientName: 'Jane Smith', testType: 'Urine Test', status: 'completed', date: '2026-04-09' },
        { id: 3, patientName: 'Robert Johnson', testType: 'X-Ray', status: 'in-progress', date: '2026-04-08' },
        { id: 4, patientName: 'Emily Davis', testType: 'MRI Scan', status: 'completed', date: '2026-04-08' },
        { id: 5, patientName: 'Michael Wilson', testType: 'Blood Test', status: 'pending', date: '2026-04-08' }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (showQueue) {
      fetchQueueData();
    }
  }, [selectedDate, showQueue]);

  const fetchQueueData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      const response = await fetch(`http://localhost:8000/api/queue/doctor?doctor_id=${user.id}&date=${selectedDate}`, {
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
  };

  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Navigate to login page
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laboratory Dashboard</h1>
              <p className="text-sm text-gray-600">Manage laboratory tests and results</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowQueue(!showQueue)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  showQueue 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {showQueue ? 'Hide Queue' : 'Show Queue'}
              </button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                New Test Request
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
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
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Age-Based Patient Queue</h2>
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
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
        )}

        {/* Recent Tests Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Laboratory Tests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{test.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.testType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(test.status)}`}>
                        {getStatusText(test.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        View
                      </button>
                      {test.status === 'pending' && (
                        <button className="text-green-600 hover:text-green-900 mr-3">
                          Start
                        </button>
                      )}
                      {test.status === 'in-progress' && (
                        <button className="text-blue-600 hover:text-blue-900">
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
    </div>
  );
};

export default LaboratoryDashboard;
