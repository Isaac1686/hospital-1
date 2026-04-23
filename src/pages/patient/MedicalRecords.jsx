import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MedicalRecords = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    
    fetchMedicalRecords();
    setTimeout(() => setLoading(false), 500);
  }, [navigate]);

  const fetchMedicalRecords = async () => {
    // Mock medical records data
    const mockRecords = [
      {
        id: 1,
        date: '2026-04-09',
        doctor: 'Dr. Michael Chen',
        specialty: 'Cardiology',
        diagnosis: 'Hypertension',
        treatment: 'Prescribed medication for blood pressure control',
        medications: ['Lisinopril 10mg', 'Hydrochlorothiazide 25mg'],
        notes: 'Patient responded well to treatment',
        followUpDate: '2026-04-23'
      },
      {
        id: 2,
        date: '2026-03-28',
        doctor: 'Dr. Sarah Johnson',
        specialty: 'General Practice',
        diagnosis: 'Common Cold',
        treatment: 'Rest and fluids, prescribed decongestant',
        medications: ['Paracetamol 500mg', 'Nasal decongestant spray'],
        notes: 'Patient recovered fully',
        followUpDate: null
      },
      {
        id: 3,
        date: '2026-02-15',
        doctor: 'Dr. Emily Davis',
        specialty: 'Pediatrics',
        diagnosis: 'Seasonal Allergies',
        treatment: 'Antihistamine medication prescribed',
        medications: ['Cetirizine 10mg', 'Fluticasone nasal spray'],
        notes: 'Symptoms improved with treatment',
        followUpDate: '2026-03-01'
      }
    ];
    
    setMedicalRecords(mockRecords);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddRecord = () => {
    navigate('/patient/add-medical-record');
  };

  const handleBackToDashboard = () => {
    navigate('/patient/dashboard');
  };

  const handleViewRecord = (recordId) => {
    // Navigate to detailed view of a specific record
    navigate(`/patient/medical-record/${recordId}`);
  };

  const handlePrintRecord = (recordId) => {
    // Simulate printing functionality
    window.print();
  };

  const handleEditRecord = (recordId) => {
    // Navigate to edit medical record
    navigate(`/patient/edit-medical-record/${recordId}`);
  };

  const handleDownloadRecord = (recordId) => {
    // Simulate download functionality
    const record = medicalRecords.find(r => r.id === recordId);
    if (record) {
      const dataStr = JSON.stringify(record, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `medical-record-${recordId}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleShareRecord = (recordId) => {
    // Simulate share functionality
    const record = medicalRecords.find(r => r.id === recordId);
    if (record) {
      const shareText = `Medical Record - ${record.date}\nDoctor: ${record.doctor}\nDiagnosis: ${record.diagnosis}\nTreatment: ${record.treatment}`;
      if (navigator.share) {
        navigator.share({
          title: 'Medical Record',
          text: shareText
        });
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(shareText);
        alert('Medical record details copied to clipboard!');
      }
    }
  };

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.treatment.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return matchesSearch && new Date(record.date) >= thirtyDaysAgo;
    }
    if (filter === 'chronic') {
      return matchesSearch && (
        record.diagnosis.toLowerCase().includes('diabetes') ||
        record.diagnosis.toLowerCase().includes('hypertension') ||
        record.diagnosis.toLowerCase().includes('asthma')
      );
    }
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
              <p className="text-sm text-gray-600">Your complete medical history</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBackToDashboard}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Records</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by diagnosis, doctor, or treatment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Records</option>
                <option value="recent">Recent (Last 30 Days)</option>
                <option value="chronic">Chronic Conditions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Medical Records ({filteredRecords.length})
              </h2>
              <div className="text-sm text-gray-500">
                {filter === 'all' && 'Showing all records'}
                {filter === 'recent' && 'Showing records from last 30 days'}
                {filter === 'chronic' && 'Showing chronic condition records'}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treatment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow-up
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.doctor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.specialty}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.diagnosis}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.treatment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {record.medications.map((med, index) => (
                          <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {med}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.followUpDate ? formatDate(record.followUpDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleViewRecord(record.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditRecord(record.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Record"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePrintRecord(record.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Print Record"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownloadRecord(record.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Download Record"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShareRecord(record.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Share Record"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 2.943-9.543 7a9.97 9.97 0 011.827 3.342M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredRecords.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="mt-2">No medical records Found</p>
                  <p className="text-sm">
                    {searchTerm ? `No records found matching "${searchTerm}"` : 'No medical records available'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MedicalRecords;
