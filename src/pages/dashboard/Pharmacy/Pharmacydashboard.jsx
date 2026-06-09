import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMedications: 0,
    lowStock: 0,
    prescriptionsToday: 0,
    pendingOrders: 0
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [pharmacyTasks, setPharmacyTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalMedications: 245,
        lowStock: 8,
        prescriptionsToday: 15,
        pendingOrders: 6
      });


      setIsLoading(false);
    }, 1000);

    const fetchPharmacyTasks = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/appointments?assigned_department=pharmacy', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setPharmacyTasks(data || []);
      } catch (error) {
        console.error('Error loading pharmacy tasks:', error);
      }
    };

    fetchPharmacyTasks();
  }, []);

  const handleCompletePrescription = async (appointment) => {
    // If dosage is not yet set, ask for it now
    if (!appointment.pharmacy_dosage) {
      const dosage = window.prompt(
        'Enter dosage details for this patient (e.g. "1 tablet twice daily", "2 capsules at bedtime"):'
      );
      if (!dosage) return;

      // First, update the appointment with the dosage
      try {
        const response = await fetch(`http://localhost:8000/api/appointments/${appointment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            pharmacy_dosage: dosage
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to update dosage');
        }

        // Update local state with new dosage
        setPharmacyTasks((prev) => prev.map((item) =>
          item.id === appointment.id
            ? { ...item, pharmacy_dosage: dosage }
            : item
        ));
      } catch (error) {
        console.error(error);
        alert(error.message || 'Unable to update dosage.');
        return;
      }
    }

    // Now confirm completion
    const confirmed = window.confirm(
      'Confirm that the patient has completed pharmacy processing and should be marked as complete?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to complete pharmacy task');
      }

      setPharmacyTasks((prev) => prev.map((item) =>
        item.id === appointment.id
          ? { ...item, status: 'completed' }
          : item
      ));
      alert('Pharmacy task completed.');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Unable to complete pharmacy task.');
    }
  };

  const formatDosage = (dosage) => {
    if (dosage === null || dosage === undefined || dosage === '') {
      return 'Not specified';
    }
    if (typeof dosage === 'number') {
      return `${dosage}x/day`;
    }
    return dosage;
  };

  const handleNewPrescription = () => {
    // Navigate to new prescription form
    navigate('/prescriptions/new');
  };

  const handleOrderMedications = () => {
    // Navigate to medication ordering page
    navigate('/medications/order');
  };

  const handleGenerateReport = () => {
    // Navigate to report generation page
    navigate('/reports/generate');
  };

  const handleViewPrescription = (prescriptionId) => {
    // Navigate to specific prescription details
    navigate(`/prescriptions/${prescriptionId}`);
  };

  const handleFillPrescription = (prescriptionId) => {
    // Update prescription status to filled
    setRecentPrescriptions(prev =>
      prev.map(pres =>
        pres.id === prescriptionId
          ? { ...pres, status: 'filled' }
          : pres
      )
    );
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
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'filled':
        return 'Filled';
      case 'pending':
        return 'Pending';
      case 'out-of-stock':
        return 'Out of Stock';
      case 'ordered':
        return 'Ordered';
      default:
        return 'Unknown';
    }
  };

  const getStockLevelColor = (level) => {
    if (level <= 10) return 'text-red-600';
    if (level <= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Pharmacy Dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
              <p className="text-sm text-gray-600">Manage medications and prescriptions</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleNewPrescription}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                New Prescription
              </button>
              <button
                onClick={handleOrderMedications}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Order Medications
              </button>
              <button
                onClick={handleGenerateReport}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
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
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v2m7 4a1 1 0 11-2 0 1 1 0 012 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Medications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMedications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.016V7.984c0-1.349-1.962-3.016-2.502-3.016H6.838c-1.54 0-2.502 1.667-2.502 3.016v6.984c0 1.349 1.962 3.016 2.502 3.016h6.938c1.54 0 2.502-1.667 2.502-3.016V7.984c0-1.349-1.962-3.016-2.502-3.016z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prescriptionsToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v18H3V3zm16 18H5V5h14v16z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>



        {/* Pharmacy Task Queue */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pharmacy Task Queue</h2>
            <p className="text-sm text-gray-600">Tasks assigned to pharmacy from doctor referrals.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pharmacyTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No pharmacy tasks are currently assigned.</td>
                  </tr>
                ) : pharmacyTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{task.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.patient?.name || task.patient_name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.pharmacy_medication || task.pharmacy_notes || 'Not specified'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDosage(task.pharmacy_dosage)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : (task.assigned_department === 'pharmacy' ? 'Pending' : 'Waiting')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(task.pharmacy_assigned_at || task.updated_at || task.created_at || Date.now()).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {task.status === 'completed' ? (
                        <span className="text-green-600 font-semibold">Completed</span>
                      ) : (
                        <button
                          onClick={() => handleCompletePrescription(task)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Confirm Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
