import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AddPatientModal from "../../components/AddPatientModal";

/** Label for the logged-in specialist (from session user object). */
function getLoggedInDoctorLabel(user) {
  if (!user || typeof user !== "object") return null;
  const rawName = [user.name, user.full_name, user.fullName].find(
    (v) => typeof v === "string" && v.trim(),
  );
  if (rawName) {
    const trimmed = rawName.trim();
    const withoutHonorific = trimmed.replace(/^(dr\.?|doctor)\s+/i, "").trim();
    const display = withoutHonorific || trimmed;
    return `Dr. ${display}`;
  }
  if (typeof user.email === "string" && user.email.includes("@")) {
    return `Dr. ${user.email.split("@")[0]}`;
  }
  return null;
}

function formatTimeFromIso(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${m} ${period}`;
}

function formatAppointmentDate(appointmentDate, createdAt) {
  const day = appointmentDate || (createdAt ? createdAt.slice(0, 10) : null);
  if (!day) return "";
  const d = new Date(`${day}T12:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function isAppointmentToday(appointmentDate, createdAt) {
  const day = appointmentDate || (createdAt ? createdAt.slice(0, 10) : null);
  if (!day) return false;
  const d = new Date(`${day}T12:00:00`);
  return (
    !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString()
  );
}

function initialsFromName(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
const SpecialistDoctorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingReports: 0,
    completedConsultations: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [queueStats, setQueueStats] = useState({
    totalPatients: 0,
    priorityPatients: 0,
    normalPatients: 0,
  });
  const [specialistTasks, setSpecialistTasks] = useState([]);
  const [availableSpecialists, setAvailableSpecialists] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSendToPharmacyModal, setShowSendToPharmacyModal] =
    useState(false);
  const [showSendToImagingModal, setShowSendToImagingModal] = useState(false);
  const [sendToPharmacyError, setSendToPharmacyError] = useState("");
  const [pharmacyMedication, setPharmacyMedication] = useState("");
  const [sendToImagingError, setSendToImagingError] = useState("");
  const [imagingRequestDetails, setImagingRequestDetails] = useState("");
  const [imagingType, setImagingType] = useState("X-ray");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  const loadDashboard = useCallback(async (doctorId) => {
    setFetchError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/appointments?doctor_id=${doctorId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load appointments");
      }

      const data = await response.json();
      const patientResponse = await fetch(
        `http://localhost:8000/api/patients?doctor_id=${doctorId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
      const patientsData = patientResponse.ok
        ? await patientResponse.json()
        : [];

      const mapped = data.map((apt) => ({
        id: apt.id,
        patientName:
          apt.patient?.name ||
          (typeof apt.patient?.email === "string"
            ? apt.patient.email.split("@")[0]
            : null) ||
          "Unknown patient",
        patientId: apt.patient_id,
        time: formatTimeFromIso(apt.created_at),
        bookedAt: apt.created_at,
        dateLabel: formatAppointmentDate(apt.appointment_date, apt.created_at),
        type: "Patient booking",
        status: apt.status,
      }));

      setRecentAppointments(mapped);

      const todayList = data.filter((apt) =>
        isAppointmentToday(apt.appointment_date, apt.created_at),
      );

      setStats({
        totalPatients: new Set([
          ...data.map((a) => a.patient_id),
          ...patientsData.map((patient) => patient.id),
        ]).size,
        appointmentsToday: todayList.length,
        pendingReports: data.filter((a) => a.status === "scheduled").length,
        completedConsultations: data.filter((a) => a.status === "completed")
          .length,
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
              (typeof apt.patient?.email === "string"
                ? apt.patient.email.split("@")[0]
                : `Patient #${pid}`),
            lastVisit: apt.created_at,
            lastTime: t,
          });
        }
      }
      // Recent patients panel removed; dashboard keeps only appointment and referral stats.
    } catch (err) {
      console.error(err);
      setFetchError(err.message || "Could not load appointments");
      setRecentAppointments([]);
      setStats({
        totalPatients: 0,
        appointmentsToday: 0,
        pendingReports: 0,
        completedConsultations: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      navigate("/login");
      return;
    }
    setUser(parsed);
    setIsLoading(true);
    loadDashboard(parsed.id);
  }, [navigate, loadDashboard]);

  useEffect(() => {
    if (!user?.id) return;
    const onFocus = () => {
      loadDashboard(user.id);
    };
    window.addEventListener("focus", onFocus);

    // Poll for new imaging results returned to this specialist every 10s
    let lastCheck = new Date().toISOString();
    const checkInterval = setInterval(async () => {
      try {
        const resp = await fetch(
          `http://localhost:8000/api/appointments?assigned_department=specialist&specialist_id=${user.id}`,
        );
        if (!resp.ok) return;
        const data = await resp.json();
        const hasNew = (data || []).some(
          (apt) => apt.updated_at && apt.updated_at > lastCheck,
        );
        if (hasNew) {
          setInfoMessage("New imaging results returned — refreshed.");
          await loadDashboard(user.id);
          lastCheck = new Date().toISOString();
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 10000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(checkInterval);
    };
  }, [loadDashboard, user?.id]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (!user?.id) return;

    const fetchQueueStats = async () => {
      try {
        const queueResponse = await fetch(
          `http://localhost:8000/api/queue/doctor?doctor_id=${user.id}&date=${today}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );

        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          setQueueStats({
            totalPatients: queueData.total_patients || 0,
            priorityPatients: queueData.priority_patients || 0,
            normalPatients: queueData.normal_patients || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching doctor queue data:", error);
      }
    };

    fetchQueueStats();

    const fetchSpecialistTasks = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(
          `http://localhost:8000/api/appointments?assigned_department=specialist&specialist_id=${user.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setSpecialistTasks(
          (data || []).map((apt) => ({
            id: apt.id,
            patientName: apt.patient?.name || apt.patient_name || "Unknown",
            patientId: apt.patient_id,
            queueNumber: apt.queue_number ?? apt.queueNumber ?? "—",
            time: formatTimeFromIso(apt.created_at),
            bookedAt: apt.created_at,
            dateLabel: apt.created_at
              ? new Date(apt.created_at).toLocaleDateString()
              : "",
            type: apt.assigned_department
              ? `${apt.assigned_department.charAt(0).toUpperCase()}${apt.assigned_department.slice(1)}`
              : "Specialist",
            status: apt.status || "scheduled",
            assignedDepartment: apt.assigned_department || "specialist",
            specialistNotes: apt.specialist_notes || "",
            labResults: apt.lab_results || "",
            imagingResults: apt.imaging?.imaging_results || "",
            imagingType: apt.imaging?.test_type || "",
            imagingAttachmentUrls: apt.imaging?.imaging_attachment_urls || [],
            referredSpecialistId: apt.referred_specialist_id || null,
            doctorName: apt.doctor?.name || "",
          })),
        );
      } catch (error) {
        console.error("Error loading specialist referrals:", error);
      }
    };

    const fetchSpecialists = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/doctors", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          return;
        }
        const result = await response.json();
        setAvailableSpecialists(
          (result.data || []).filter((item) => item.role === "specialist"),
        );
      } catch (error) {
        console.error("Error fetching specialists:", error);
      }
    };

    fetchSpecialistTasks();
    fetchSpecialists();
  }, [user?.id]);

  const doctorLabel = getLoggedInDoctorLabel(user);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    navigate("/login");
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

  const handleUpdateAppointment = async (appointmentId, updates) => {
    const response = await fetch(
      `http://localhost:8000/api/appointments/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to update appointment");
    }

    return response.json();
  };

  const handleCompleteSpecialistTask = async (appointment) => {
    try {
      await handleUpdateAppointment(appointment.id, { status: "completed" });
      setSpecialistTasks((prev) =>
        prev.map((task) =>
          task.id === appointment.id ? { ...task, status: "completed" } : task,
        ),
      );
      alert("Specialist referral completed.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to complete specialist referral.");
    }
  };

  const handleSendToLaboratoryFromSpecialist = async (appointment) => {
    try {
      await handleUpdateAppointment(appointment.id, {
        assigned_department: "laboratory",
      });
      setSpecialistTasks((prev) =>
        prev.map((task) =>
          task.id === appointment.id
            ? { ...task, assignedDepartment: "laboratory", status: "waiting" }
            : task,
        ),
      );
      alert("Patient assignment sent to laboratory.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to send patient to laboratory.");
    }
  };

  const handleOpenViewModal = (task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setSelectedTask(null);
    setShowViewModal(false);
  };

  const handleOpenSendToPharmacyModal = (task) => {
    setSelectedTask(task);
    setSendToPharmacyError("");
    setPharmacyMedication(task.pharmacy_medication || "");
    setShowSendToPharmacyModal(true);
  };

  const handleCloseSendToPharmacyModal = () => {
    setSelectedTask(null);
    setSendToPharmacyError("");
    setPharmacyMedication("");
    setShowSendToPharmacyModal(false);
  };

  const handleOpenSendToImagingModal = (task) => {
    setSelectedTask(task);
    setImagingRequestDetails("");
    setSendToImagingError("");
    setShowSendToImagingModal(true);
  };

  const handleCloseSendToImagingModal = () => {
    setSelectedTask(null);
    setImagingRequestDetails("");
    setSendToImagingError("");
    setShowSendToImagingModal(false);
  };

  const handleConfirmSendToImaging = async () => {
    if (!selectedTask) return;
    if (!imagingRequestDetails.trim()) {
      setSendToImagingError(
        "Please provide imaging request details before sending.",
      );
      return;
    }

    try {
      await handleUpdateAppointment(selectedTask.id, {
        assigned_department: "imaging",
        status: "waiting",
        specialist_notes: imagingRequestDetails,
        imaging_request_details: imagingRequestDetails,
        imaging_type: imagingType,
      });
      setSpecialistTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? {
              ...task,
              status: "waiting",
              assignedDepartment: "imaging",
              specialistNotes: imagingRequestDetails,
            }
            : task,
        ),
      );
      handleCloseSendToImagingModal();
      alert("Patient assignment sent to imaging with request details.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to send patient to imaging.");
    }
  };

  const handleConfirmSendToPharmacy = async () => {
    if (!selectedTask) return;

    if (!pharmacyMedication.trim()) {
      setSendToPharmacyError(
        "Please enter the medication to dispense before sending to pharmacy.",
      );
      return;
    }

    try {
      const now = new Date().toISOString();
      await handleUpdateAppointment(selectedTask.id, {
        assigned_department: "pharmacy",
        status: "completed",
        pharmacy_medication: pharmacyMedication.trim(),
        pharmacy_dosage: null,
        pharmacy_assigned_at: now,
      });

      setSpecialistTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? {
              ...task,
              status: "completed",
              assignedDepartment: "pharmacy",
              pharmacyMedication: pharmacyMedication.trim(),
              pharmacy_medication: pharmacyMedication.trim(),
              pharmacy_dosage: null,
              pharmacy_assigned_at: now,
            }
            : task,
        ),
      );
      handleCloseSendToPharmacyModal();
      alert("Patient sent to pharmacy with medication instructions.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to send patient to pharmacy.");
    }
  };

  const handleSendToImagingFromSpecialist = async (appointment) => {
    try {
      await handleUpdateAppointment(appointment.id, {
        assigned_department: "imaging",
        status: "waiting",
      });
      setSpecialistTasks((prev) =>
        prev.map((task) =>
          task.id === appointment.id
            ? { ...task, status: "waiting", assignedDepartment: "imaging" }
            : task,
        ),
      );
      alert("Patient assignment sent to imaging and status set to waiting.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to send patient to imaging.");
    }
  };

  const handleSendToImagingFromAppointment = async (appointment) => {
    try {
      await handleUpdateAppointment(appointment.id, {
        assigned_department: "imaging",
        status: "waiting",
      });
      if (user?.id) {
        await loadDashboard(user.id);
      }
      alert("Patient assignment sent to imaging and status set to waiting.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to send patient to imaging.");
    }
  };

  const handleEmergencyCancel = async () => {
    if (!user?.id) return;
    const confirmed = window.confirm(
      "An emergency cancellation will cancel all your scheduled appointments. Continue?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/appointments/doctor/${user.id}/emergency-cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            reason:
              "Doctor emergency: appointments cancelled until the emergency is resolved.",
          }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        alert(
          data.message || "Scheduled appointments cancelled for emergency.",
        );
        loadDashboard(user.id);
      } else {
        alert(data.message || "Failed to cancel appointments.");
      }
    } catch (error) {
      console.error("Emergency cancel error:", error);
      alert("Failed to perform emergency cancellation.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "postponed":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "waiting":
        return "Waiting";
      case "completed":
        return "Completed";
      case "postponed":
        return "Postponed";
      case "cancelled":
        return "Cancelled";
      case "confirmed":
        return "Confirmed";
      case "in-progress":
        return "In Progress";
      case "pending":
        return "Pending";
      default:
        return status ? String(status) : "Unknown";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Emergency":
        return "bg-red-100 text-red-800";
      case "Regular Checkup":
        return "bg-blue-100 text-blue-800";
      case "Follow-up":
        return "bg-green-100 text-green-800";
      case "Consultation":
        return "bg-purple-100 text-purple-800";
      case "Patient booking":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Specialist Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Specialist Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {doctorLabel
                  ? `Welcome back, ${doctorLabel}. Manage specialist consultations and referrals`
                  : "Manage specialist consultations and referrals"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleEmergencyCancel}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Emergency Cancel
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {fetchError && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            {fetchError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Patients
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPatients}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Today&apos;s Appointments
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.appointmentsToday}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingReports}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedConsultations}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Scheduled Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {queueStats.totalPatients}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">
              Priority Patients
            </p>
            <p className="text-2xl font-bold text-green-900">
              {queueStats.priorityPatients}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Normal Patients</p>
            <p className="text-2xl font-bold text-gray-900">
              {queueStats.normalPatients}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-gray-900">
              Patient Appointments
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queue Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {specialistTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No specialist referrals assigned to you.
                    </td>
                  </tr>
                ) : (
                  specialistTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{task.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.patientName ||
                          task.patient?.name ||
                          task.patient_name ||
                          "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.queueNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getStatusText(task.status) || "Pending"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(
                          task.bookedAt ||
                          task.created_at ||
                          task.updated_at ||
                          Date.now(),
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(task)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </button>
                        {task.assignedDepartment === "imaging" ||
                          task.status === "waiting" ? (
                          <span className="text-yellow-600">Waiting</span>
                        ) : task.assignedDepartment !== "pharmacy" ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSendToImagingModal(task)}
                            className="text-purple-600 hover:text-purple-900 mr-4"
                          >
                            Send to Imaging
                          </button>
                        ) : null}
                        {task.status === "completed" &&
                          task.assignedDepartment !== "pharmacy" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSendToPharmacyModal(task)
                              }
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Send to Pharmacy
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => handleCompleteSpecialistTask(task)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddPatientModal
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onPatientAdded={handlePatientAdded}
      />

      {showViewModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl animate-modal-enter border border-slate-200">
            {/* Elegant Top Header (Classic Paper Style) - Scaled 75% */}
            <div className="border-b-[3px] border-slate-900 bg-white px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight uppercase">
                    Medical Referral Report
                  </h2>
                  <p className="mt-0.5 text-[9px] font-medium text-slate-500 uppercase tracking-widest">
                    Apt ID: #{selectedTask.id}
                  </p>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleCloseViewModal}
                    className="text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Patient Profile Bar (Unified) - Compacted */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-b border-slate-100 py-3">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                    Patient Name
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedTask.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                    Patient ID
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    #{selectedTask.patientId}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                    Department
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedTask.assignedDepartment?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${selectedTask.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                  >
                    {getStatusText(selectedTask.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Report Body - More Compact */}
            <div className="max-h-[55vh] overflow-y-auto px-6 py-6 bg-slate-50/30">
              <div className="space-y-8">
                {/* Section 1: Clinical Context */}
                <section>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em]">
                      I. Specialist Narrative
                    </h3>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="bg-white p-4 rounded border border-slate-200 shadow-sm leading-relaxed">
                    <p className="text-slate-700 text-xs whitespace-pre-wrap italic font-serif">
                      {selectedTask.specialistNotes ||
                        "No specific specialist narrative recorded."}
                    </p>
                  </div>
                </section>

                {/* Section 2: Diagnostics (Radiology) */}
                <section>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em]">
                      II. Radiology Findings
                    </h3>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="bg-white overflow-hidden rounded border border-slate-200 shadow-sm">
                    <div className="bg-slate-900 px-3 py-1.5 flex justify-between items-center">
                      <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                        Type: {selectedTask.imagingType || "Standard"}
                      </span>
                      <span className="text-[8px] font-medium text-slate-400">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className="text-[11px] font-mono text-slate-800 bg-slate-50 p-3 border border-slate-100 rounded leading-relaxed">
                        {selectedTask.imagingResults ||
                          "REPORT PENDING: No results submitted."}
                      </p>
                      {selectedTask.imagingAttachmentUrls?.length > 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.15em] mb-2">
                            Uploaded Imaging Files
                          </h4>
                          <ul className="space-y-2 text-sm text-slate-700">
                            {selectedTask.imagingAttachmentUrls.map((url, index) => (
                              <li key={url}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-indigo-600 hover:text-indigo-900 underline"
                                >
                                  View uploaded file {index + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 3: Diagnostics (Laboratory) */}
                <section>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em]">
                      III. Laboratory Data
                    </h3>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedTask.labResults ||
                        "DATA UNAVAILABLE: Laboratory processing pending."}
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Professional Footer - Compact */}
            <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <div className="text-[8px] text-slate-400 uppercase tracking-widest">
                Medical Record • {new Date().toLocaleDateString()}
              </div>
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="rounded-sm bg-slate-900 px-6 py-2 text-[10px] font-bold text-white uppercase tracking-widest shadow-md hover:bg-slate-800 transition-all active:translate-y-0.5"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendToPharmacyModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl ring-1 ring-black/10">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Patient to Pharmacy
              </h3>
              <button
                type="button"
                onClick={handleCloseSendToPharmacyModal}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-6 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900">Patient</p>
                <p>{selectedTask.patientName}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Medication</p>
                <input
                  type="text"
                  value={pharmacyMedication}
                  onChange={(e) => setPharmacyMedication(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="e.g. qww 200mg"
                />
                {sendToPharmacyError && (
                  <p className="mt-2 text-sm text-red-600">
                    {sendToPharmacyError}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Status</p>
                <p>Patient will be sent to pharmacy to complete medication fulfillment.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={handleCloseSendToPharmacyModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToPharmacy}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Send to Pharmacy
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendToImagingModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-md">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl animate-modal-enter border border-slate-200">
            {/* Form Header (Classic Paper Style) */}
            <div className="border-b-[3px] border-purple-600 bg-white px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Imaging Request Form
                  </h2>
                  <p className="mt-0.5 text-[9px] font-medium text-slate-500 uppercase tracking-widest">
                    Referral Order for Appointment #{selectedTask.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseSendToImagingModal}
                  className="text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Patient Brief */}
              <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                    Patient Name
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedTask.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                    Patient ID
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    #{selectedTask.patientId}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="px-6 py-6 space-y-6 bg-slate-50/30">
              {/* Investigation Type */}
              <div className="space-y-1.5">
                <label
                  htmlFor="imagingType"
                  className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2"
                >
                  <span className="h-1 w-1 bg-purple-600 rounded-full"></span>
                  I. Select Investigation Type
                </label>
                <select
                  id="imagingType"
                  value={imagingType}
                  onChange={(e) => setImagingType(e.target.value)}
                  className="block w-full rounded border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all"
                >
                  <option value="X-ray">X-ray</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="MRI">MRI</option>
                  <option value="Endoscopy">Endoscopy</option>
                  <option value="Biopsy guidance">Biopsy guidance</option>
                  <option value="Echocardiography">Echocardiography</option>
                  <option value="Custom Investigation">
                    Custom Investigation
                  </option>
                </select>
              </div>

              {/* Request Details */}
              <div className="space-y-1.5">
                <label
                  htmlFor="imagingRequestDetails"
                  className="text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2"
                >
                  <span className="h-1 w-1 bg-purple-600 rounded-full"></span>
                  II. Clinical Instructions & Reason
                </label>
                <textarea
                  id="imagingRequestDetails"
                  value={imagingRequestDetails}
                  onChange={(e) => setImagingRequestDetails(e.target.value)}
                  rows={5}
                  className="block w-full rounded border-slate-200 bg-white px-4 py-3 text-xs italic font-serif text-slate-700 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all leading-relaxed"
                  placeholder="Describe the clinical objective, targeted anatomy, and any contraindications..."
                />
                {sendToImagingError && (
                  <p className="mt-1 text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                    {sendToImagingError}
                  </p>
                )}
                <p className="mt-2 text-[9px] text-slate-400 italic">
                  * This clinical narrative will be appended to the official
                  radiology order.
                </p>
              </div>
            </div>

            {/* Form Footer */}
            <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseSendToImagingModal}
                className="rounded-sm bg-white border border-slate-300 px-6 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToImaging}
                className="rounded-sm bg-purple-600 px-8 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all active:translate-y-0.5"
              >
                Authorize & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialistDoctorDashboard;
