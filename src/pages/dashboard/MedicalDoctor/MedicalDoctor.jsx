import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AddPatientModal from '../../components/AddPatientModal';

/** Label for the logged-in doctor (from session user object). */
function getLoggedInDoctorLabel(user) {
  if (!user || typeof user !== 'object') return null;
  const rawName = [user.name, user.full_name, user.fullName].find(
    (v) => typeof v === 'string' && v.trim()
  );
  if (rawName) {
    const trimmed = rawName.trim();
    const withoutHonorific = trimmed.replace(/^(dr\.?|doctor)\s+/i, '').trim();
    const display = withoutHonorific || trimmed;
    return `Dr. ${display}`;
  }
  if (typeof user.email === 'string' && user.email.includes('@')) {
    return `Dr. ${user.email.split('@')[0]}`;
  }
  return null;
}

function formatTimeFromIso(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${m} ${period}`;
}

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MedicalDoctorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0
  });
  const [queueStats, setQueueStats] = useState({
    totalPatients: 0,
    priorityPatients: 0,
    normalPatients: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [availableSpecialists, setAvailableSpecialists] = useState([]);

  const loadDashboard = useCallback(async (doctorId) => {
    setFetchError('');
    try {
      const response = await fetch(
        `http://localhost:8000/api/appointments?doctor_id=${doctorId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load appointments');
      }

      const data = await response.json();
      const patientResponse = await fetch(
        `http://localhost:8000/api/patients?doctor_id=${doctorId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      );
      const patientsData = patientResponse.ok ? await patientResponse.json() : [];
      const todayStr = new Date().toDateString();

      const mapped = [...data]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((apt) => ({
          id: apt.id,
          patientName:
            apt.patient?.name ||
            (typeof apt.patient?.email === 'string'
              ? apt.patient.email.split('@')[0]
              : null) ||
            'Unknown patient',
          patientId: apt.patient_id,
          time: formatTimeFromIso(apt.created_at),
          bookedAt: apt.created_at,
          dateLabel: apt.created_at
            ? new Date(apt.created_at).toLocaleDateString()
            : '',
          type: 'Patient booking',
          status: apt.status
          ,
          assignedDepartment: apt.assigned_department || 'medical',
          labResults: apt.lab_results || '',
          pharmacyNotes: apt.pharmacy_notes || '',
          specialistNotes: apt.specialist_notes || '',
          referredSpecialistId: apt.referred_specialist_id || null
        }))
        .map((item) => {
          // For the medical doctor's view, consider the appointment "complete"
          // when the patient has been routed away from the medical department
          // (e.g., to pharmacy or specialist). Do not change the underlying
          // appointment.status here — this is only a display value.
          const displayStatus = (item.assignedDepartment && item.assignedDepartment !== 'medical' && item.status === 'scheduled')
            ? 'completed'
            : item.status;

          return { ...item, displayStatus };
        });

      setRecentAppointments(mapped);

      const todayList = data.filter(
        (apt) => apt.created_at && new Date(apt.created_at).toDateString() === todayStr
      );

      setStats({
        totalPatients: new Set([
          ...data.map((a) => a.patient_id),
          ...patientsData.map((patient) => patient.id)
        ]).size,
        appointmentsToday: todayList.length,
        pendingReports: data.filter((a) => a.status === 'scheduled').length,
        completedConsultations: data.filter((a) => a.status === 'completed').length
      });

      const byPatient = new Map();
      for (const apt of data) {
        const pid = apt.patient_id;
        const t = apt.created_at ? new Date(apt.created_at).getTime() : 0;
        const prev = byPatient.get(pid);
        if (!prev || t > prev.lastTime) {
          byPatient.set(pid, {
            id: pid,
            name:
              apt.patient?.name ||
              (typeof apt.patient?.email === 'string'
                ? apt.patient.email.split('@')[0]
                : `Patient #${pid}`),
            lastVisit: apt.created_at,
            lastTime: t
          });
        }
      }
      const appointmentPatients = [...byPatient.values()];
      const appointmentPatientIds = new Set(appointmentPatients.map((item) => item.id));
      const createdPatients = patientsData
        .filter((patient) => !appointmentPatientIds.has(patient.id))
        .map((patient) => ({
          id: patient.id,
          name: patient.name,
          lastVisit: patient.created_at || null,
          lastTime: patient.created_at ? new Date(patient.created_at).getTime() : 0
        }));

      setRecentPatients(
        [...appointmentPatients, ...createdPatients]
          .sort((a, b) => b.lastTime - a.lastTime)
          .slice(0, 8)
      );
    } catch (err) {
      console.error(err);
      setFetchError(err.message || 'Could not load appointments');
      setRecentAppointments([]);
      setRecentPatients([]);
      setStats({
        totalPatients: 0,
        appointmentsToday: 0,
        pendingReports: 0,
        completedConsultations: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateAppointment = async (appointmentId, updates) => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update appointment');
      }
      await loadDashboard(user.id);
    } catch (error) {
      console.error('Update appointment error:', error);
      alert(error.message || 'Unable to update appointment.');
    }
  };

  const handleSendToLaboratory = async (appointmentId) => {
    await handleUpdateAppointment(appointmentId, {
      assigned_department: 'laboratory'
    });
    alert('Patient assignment sent to laboratory.');
  };

  const handleSubmitLabResults = async (appointmentId) => {
    const labResults = window.prompt('Enter laboratory results for this patient:');
    if (!labResults) return;
    await handleUpdateAppointment(appointmentId, {
      assigned_department: 'medical',
      lab_results: labResults
    });
    alert('Lab results have been returned to the medical doctor.');
  };

  const handleSendToPharmacy = async (appointmentId) => {
    const medication = window.prompt('Enter medication name (e.g. Amoxicillin 500mg):');
    if (!medication) return;
    const pharmacyNotes = window.prompt('Enter pharmacy instructions or notes:');
    if (!pharmacyNotes) return;

    // Convert ISO timestamp to MySQL-compatible format (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const mysqlTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');

    await handleUpdateAppointment(appointmentId, {
      assigned_department: 'pharmacy',
      pharmacy_notes: pharmacyNotes,
      pharmacy_medication: medication,
      pharmacy_dosage: null,
      pharmacy_assigned_at: mysqlTimestamp
    });
    alert('Patient assignment sent to pharmacy.');
  };

  const handleReferToSpecialist = async (appointmentId) => {
    const specialist = availableSpecialists[0];
    if (!specialist) {
      alert('No specialist available to refer to.');
      return;
    }
    const specialistNotes = window.prompt('Enter specialist referral notes:');
    if (!specialistNotes) return;
    await handleUpdateAppointment(appointmentId, {
      assigned_department: 'specialist',
      specialist_notes: specialistNotes,
      referred_specialist_id: specialist.id
    });
    alert(`Patient referred to specialist ${specialist.name}.`);
  };

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      navigate('/login');
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      navigate('/login');
      return;
    }
    setUser(parsed);
    setIsLoading(true);
    loadDashboard(parsed.id);
    fetchSpecialists();
  }, [navigate, loadDashboard]);

  useEffect(() => {
    if (!user?.id) return;
    const onFocus = () => {
      loadDashboard(user.id);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadDashboard, user?.id]);

  const doctorLabel = getLoggedInDoctorLabel(user);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddPatient = () => {
    setShowAddPatientModal(true);
  };

  const handlePatientAdded = (newPatient) => {
    // Refresh dashboard data to include the new patient
    if (user?.id) {
      loadDashboard(user.id);
    }
  };

  const handleEmergencyCancel = async () => {
    if (!user?.id) return;
    const confirmed = window.confirm(
      'An emergency cancellation will cancel all your scheduled appointments. Continue?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/appointments/doctor/${user.id}/emergency-cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            reason: 'Doctor emergency: appointments cancelled until the emergency is resolved.'
          })
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Scheduled appointments cancelled for emergency.');
        loadDashboard(user.id);
      } else {
        alert(data.message || 'Failed to cancel appointments.');
      }
    } catch (error) {
      console.error('Emergency cancel error:', error);
      alert('Failed to perform emergency cancellation.');
    }
  };

  const handleViewPatientRecords = () => {
    navigate('/patient/medical-records');
  };

  const fetchSpecialists = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/doctors', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });
      if (!response.ok) {
        return;
      }
      const result = await response.json();
      setAvailableSpecialists(
        (result.data || []).filter((item) => item.role === 'specialist')
      );
    } catch (error) {
      console.error('Error fetching specialists:', error);
    }
  };

  const handleGeneratePrescription = () => {
    // TODO: Implement prescription generation
    alert('Prescription generation feature coming soon!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'postponed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'postponed':
        return 'Postponed';
      case 'cancelled':
        return 'Cancelled';
      case 'confirmed':
        return 'Confirmed';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return status ? String(status) : 'Unknown';
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
      case 'Patient booking':
        return 'bg-indigo-100 text-indigo-800';
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
              <p className="text-sm text-gray-600 mt-0.5">
                {doctorLabel
                  ? `Welcome back, ${doctorLabel}`
                  : `Welcome back${user ? `, Dr. ${user.name}` : ''}. Manage patients and appointments.`}
              </p>
              {user?.id && (
                <p className="text-xs text-gray-500 mt-1">Doctor ID: {user.id} • Role: {user.role}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleEmergencyCancel}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Emergency Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPatient}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Add Patient
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {fetchError && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            {fetchError}
          </div>
        )}

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
                <p className="text-sm font-medium text-gray-600">Today&apos;s Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled (pending)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Normal Patients</p>
            <p className="text-2xl font-bold text-gray-900">{queueStats.normalPatients}</p>
          </div>
        </div>

        {/* Patient appointments (from API) */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-gray-900">Patient appointments</h2>
            <button
              type="button"
              onClick={() => user?.id && loadDashboard(user.id)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No patient appointments yet. Ensure you are logged in as the correct doctor account.
                      {user?.id && (
                        <div className="mt-2 text-xs text-gray-400">Current doctor ID: {user.id}</div>
                      )}
                    </td>
                  </tr>
                ) : (
                  recentAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                        {appointment.dateLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {appointment.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                        {appointment.patientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(appointment.type)}`}
                        >
                          {appointment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.displayStatus || appointment.status)}`}
                        >
                          {getStatusText(appointment.displayStatus || appointment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => alert(`Assigned department: ${appointment.assignedDepartment}\nLab results: ${appointment.labResults || 'None'}\nPharmacy notes: ${appointment.pharmacyNotes || 'None'}\nSpecialist notes: ${appointment.specialistNotes || 'None'}`)}
                        >
                          View
                        </button>
                        {appointment.assignedDepartment === 'medical' && appointment.status === 'scheduled' && (
                          <>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={() => handleSendToLaboratory(appointment.id)}
                            >
                              Send to Lab
                            </button>
                            <button
                              type="button"
                              className="text-purple-600 hover:text-purple-900 mr-3"
                              onClick={() => handleReferToSpecialist(appointment.id)}
                            >
                              Refer Specialist
                            </button>
                          </>
                        )}
                        {appointment.assignedDepartment === 'laboratory' && (
                          <button
                            type="button"
                            className="text-green-600 hover:text-green-900 mr-3"
                            onClick={() => handleSubmitLabResults(appointment.id)}
                          >
                            Return from Lab
                          </button>
                        )}
                        {appointment.assignedDepartment === 'medical' && appointment.labResults && (
                          <button
                            type="button"
                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                            onClick={() => handleSendToPharmacy(appointment.id)}
                          >
                            Send to Pharmacy
                          </button>
                        )}
                        {appointment.assignedDepartment === 'pharmacy' && (
                          <button
                            type="button"
                            className="text-green-600 hover:text-green-900 mr-3"
                            onClick={() => handleUpdateAppointment(appointment.id, { status: 'completed' })}
                          >
                            Complete
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
              {recentPatients.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No patients yet from appointments.</p>
              ) : (
                <div className="space-y-4">
                  {recentPatients.map((p, idx) => {
                    const avatarStyles = [
                      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
                      { bg: 'bg-green-100', text: 'text-green-600' },
                      { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                      { bg: 'bg-blue-100', text: 'text-blue-600' },
                      { bg: 'bg-purple-100', text: 'text-purple-600' },
                      { bg: 'bg-pink-100', text: 'text-pink-600' }
                    ];
                    const { bg, text } = avatarStyles[idx % avatarStyles.length];
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center min-w-0">
                          <div
                            className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center shrink-0`}
                          >
                            <span className={`text-sm font-medium ${text}`}>{initialsFromName(p.name)}</span>
                          </div>
                          <div className="ml-3 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">
                              Last booking:{' '}
                              {p.lastVisit
                                ? new Date(p.lastVisit).toLocaleDateString()
                                : '—'}
                            </p>
                          </div>
                        </div>
                        <button type="button" className="text-indigo-600 hover:text-indigo-900 text-sm shrink-0 ml-2">
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onPatientAdded={handlePatientAdded}
      />
    </div>
  );
};

export default MedicalDoctorDashboard;
