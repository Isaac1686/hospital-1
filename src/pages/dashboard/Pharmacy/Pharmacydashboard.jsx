import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [pharmacyTasks, setPharmacyTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPharmacyTasks = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/appointments?assigned_department=pharmacy', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
        if (!response.ok) {
          console.error('Failed to load pharmacy tasks:', response.statusText);
          return;
        }
        const data = await response.json();
        setPharmacyTasks(data || []);
      } catch (error) {
        console.error('Error loading pharmacy tasks:', error);
      } finally {
        setIsLoading(false);
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

  const handleGenerateReport = () => {
    // Navigate to report generation page, passing current visible tasks
    navigate('/reports/generate', { state: { pharmacyTasks } });
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
