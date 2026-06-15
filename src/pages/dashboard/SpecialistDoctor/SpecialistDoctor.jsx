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
  const [showSendToSpecialistModal, setShowSendToSpecialistModal] =
    useState(false);
  const [showSendToImagingModal, setShowSendToImagingModal] = useState(false);
  const [sendToSpecialistId, setSendToSpecialistId] = useState(null);
  const [sendToSpecialistError, setSendToSpecialistError] = useState("");
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
          `http://localhost:8000/api/appointments?doctor_id=${user.id}`,
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

  const handleOpenSendToSpecialistModal = (task) => {
    setSelectedTask(task);
    setSendToSpecialistId(availableSpecialists[0]?.id || null);
    setSendToSpecialistError("");
    setShowSendToSpecialistModal(true);
  };

  const handleCloseSendToSpecialistModal = () => {
    setSelectedTask(null);
    setSendToSpecialistId(null);
    setSendToSpecialistError("");
    setShowSendToSpecialistModal(false);
  };

  const handleOpenSendToImagingModal = (task) => {
    setSelectedTask(task);
    setImagingRequestDetails(
      task.specialistNotes ||
        "Request X-ray, ultrasound, or CT scan details here.",
    );
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

  const handleConfirmSendToSpecialist = async () => {
    if (!selectedTask) return;
    if (!sendToSpecialistId) {
      setSendToSpecialistError("Please select a specialist to refer to.");
      return;
    }

    try {
      await handleUpdateAppointment(selectedTask.id, {
        assigned_department: "specialist",
        status: "waiting",
        referred_specialist_id: sendToSpecialistId,
        specialist_notes:
          selectedTask.specialistNotes || "Referral after imaging results.",
      });

      setSpecialistTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                status: "waiting",
                assignedDepartment: "specialist",
                referredSpecialistId: sendToSpecialistId,
              }
            : task,
        ),
      );
      handleCloseSendToSpecialistModal();
      alert("Patient referred to selected specialist.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to send patient to selected specialist.");
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
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSendToImagingModal(task)}
                            className="text-purple-600 hover:text-purple-900 mr-4"
                          >
                            Send to Imaging
                          </button>
                        )}
                        {task.assignedDepartment === "specialist" &&
                          task.status === "completed" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSendToSpecialistModal(task)
                              }
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Send to Specialist
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl ring-1 ring-black/10">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Referral Details
              </h3>
              <button
                type="button"
                onClick={handleCloseViewModal}
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
                <p className="font-medium text-gray-900">Status</p>
                <p>{getStatusText(selectedTask.status)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Department</p>
                <p>{selectedTask.assignedDepartment}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Specialist Notes</p>
                <p>{selectedTask.specialistNotes || "No details available."}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Imaging Results ({selectedTask.imagingType || "N/A"})
                </p>
                <p className="whitespace-pre-wrap">
                  {selectedTask.imagingResults || "No results available yet."}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Lab Results</p>
                <p>{selectedTask.labResults || "No results available yet."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSendToSpecialistModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl ring-1 ring-black/10">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Refer Patient to Specialist
              </h3>
              <button
                type="button"
                onClick={handleCloseSendToSpecialistModal}
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
                <label className="block text-sm font-medium text-gray-700">
                  Select Specialist
                </label>
                <select
                  value={sendToSpecialistId ?? ""}
                  onChange={(e) =>
                    setSendToSpecialistId(Number(e.target.value))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Choose specialist</option>
                  {availableSpecialists.map((specialist) => (
                    <option key={specialist.id} value={specialist.id}>
                      {specialist.name || specialist.email}
                    </option>
                  ))}
                </select>
                {sendToSpecialistError && (
                  <p className="mt-2 text-sm text-red-600">
                    {sendToSpecialistError}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Notes</p>
                <p>
                  {selectedTask.specialistNotes ||
                    "Referral after imaging results."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={handleCloseSendToSpecialistModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToSpecialist}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Send Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendToImagingModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl ring-1 ring-black/10">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Patient to Imaging
              </h3>
              <button
                type="button"
                onClick={handleCloseSendToImagingModal}
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
                <label
                  htmlFor="imagingType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Imaging Type
                </label>
                <select
                  id="imagingType"
                  value={imagingType}
                  onChange={(e) => setImagingType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              <div>
                <label
                  htmlFor="imagingRequestDetails"
                  className="block text-sm font-medium text-gray-700"
                >
                  Imaging Request Details
                </label>
                <textarea
                  id="imagingRequestDetails"
                  value={imagingRequestDetails}
                  onChange={(e) => setImagingRequestDetails(e.target.value)}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe the imaging requested, like X-ray, ultrasound, CT scan, body part, and any special notes."
                />
                {sendToImagingError && (
                  <p className="mt-2 text-sm text-red-600">
                    {sendToImagingError}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  This note will be attached to the imaging request and visible
                  to the imaging department.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={handleCloseSendToImagingModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToImaging}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Send to Imaging
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialistDoctorDashboard;
