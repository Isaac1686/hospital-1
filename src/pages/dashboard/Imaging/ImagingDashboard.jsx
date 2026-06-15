import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const imagingOptions = [
  { value: "X-ray", label: "X-ray" },
  { value: "Ultrasound", label: "Ultrasound" },
  { value: "CT Scan", label: "CT Scan" },
  { value: "MRI", label: "MRI" },
  { value: "Endoscopy", label: "Endoscopy" },
  { value: "Biopsy guidance", label: "Biopsy guidance" },
  { value: "Echocardiography", label: "Echocardiography" },
  { value: "Custom Investigation", label: "Custom Investigation" },
];

const ImagingDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState(null);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("pending");

  // Modal States
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);
  const [modalResults, setModalResults] = useState("");
  const [modalFiles, setModalFiles] = useState(null);
  const [modalError, setModalError] = useState("");
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchImagingRequests = async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const resp = await fetch("http://localhost:8000/api/imaging", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        setRequests(data || []);
      } else {
        throw new Error("Failed to load imaging requests");
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.message || "Could not load imaging requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      fetchImagingRequests();
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handleCompleteImagingRequest = async () => {
    if (!modalRecord) return;
    setModalError("");
    setIsSubmittingComplete(true);

    try {
      const payload = {
        status: "completed",
        imaging_results: modalResults.trim() || null,
        technician_id: user?.id,
      };

      let response;
      if (modalFiles && modalFiles.length > 0) {
        const formData = new FormData();
        formData.append("status", "completed");
        formData.append("technician_id", user?.id || "");
        if (modalResults.trim()) {
          formData.append("imaging_results", modalResults.trim());
        }
        Array.from(modalFiles).forEach((file) => {
          formData.append("attachments[]", file);
        });

        response = await fetch(
          `http://localhost:8000/api/imaging/${modalRecord.id}`,
          {
            method: "PUT",
            body: formData,
          },
        );
      } else {
        response = await fetch(
          `http://localhost:8000/api/imaging/${modalRecord.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Unable to complete imaging request.",
        );
      }

      setSuccessMessage(
        "Imaging completed and results returned to specialist.",
      );
      setShowCompleteModal(false);
      setModalRecord(null);
      setModalResults("");
      setModalFiles(null);
      fetchImagingRequests();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Failed to complete imaging request", error);
      setModalError(error.message || "Unable to complete imaging request.");
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const patientName = req.patient?.name || "";
      const appointmentId = String(req.appointment_id || "");
      const testType = req.test_type || "";
      const status = req.status || "pending";

      const matchesSearch =
        patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointmentId.includes(searchTerm);

      const matchesType = filterType === "All" || testType === filterType;
      const matchesStatus = filterStatus === "All" || status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [requests, searchTerm, filterType, filterStatus]);

  const getSpecialistNotes = (request) => {
    return (
      request.appointment?.specialist_notes ||
      request.specialist_notes ||
      request.imaging_request_details ||
      request.notes ||
      ""
    );
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Imaging Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Imaging Specialist Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Perform and manage radiology investigations.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="search"
                className="block text-xs font-medium text-gray-500 uppercase mb-1"
              >
                Search Patient
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name or Appointment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="type-filter"
                className="block text-xs font-medium text-gray-500 uppercase mb-1"
              >
                Imaging Type
              </label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="All">All Types</option>
                {imagingOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="status-filter"
                className="block text-xs font-medium text-gray-500 uppercase mb-1"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4 flex items-center gap-3 text-sm text-green-700 animate-fade-in">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {fetchError && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-700">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {fetchError}
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Patient Imaging Tasks
            </h2>
            <button
              onClick={fetchImagingRequests}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apt ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imaging Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referring Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialist Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          className="h-12 w-12 text-gray-300 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-sm">
                          No imaging tasks found matching your criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        #{request.appointment_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.patient?.name || "Unknown Patient"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {request.patient_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          {request.test_type || "General Imaging"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {request.doctor?.name || "System Request"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            request.status === "completed"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : request.status === "in-progress"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }`}
                        >
                          {(request.status || "pending")
                            .charAt(0)
                            .toUpperCase() +
                            (request.status || "pending").slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {getSpecialistNotes(request) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status !== "completed" ? (
                          <button
                            onClick={() => {
                              setModalRecord(request);
                              setModalResults("");
                              setModalFiles(null);
                              setShowCompleteModal(true);
                              setModalError("");
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Perform Task
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">
                            Results Submitted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Common types info grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
            <h3 className="font-bold text-gray-900 mb-1">X-ray / Ultrasound</h3>
            <p className="text-xs text-gray-500">
              Chest, abdomen, pelvis, and soft tissue studies.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-purple-500">
            <h3 className="font-bold text-gray-900 mb-1">CT / MRI</h3>
            <p className="text-xs text-gray-500">
              Advanced neuro, trauma, and contrast imaging.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-green-500">
            <h3 className="font-bold text-gray-900 mb-1">Endoscopy</h3>
            <p className="text-xs text-gray-500">
              Internal visual examinations and diagnostics.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-orange-500">
            <h3 className="font-bold text-gray-900 mb-1">Interventional</h3>
            <p className="text-xs text-gray-500">
              Biopsy guidance and specialized procedures.
            </p>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompleteModal && modalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-modal-enter">
            <div className="border-b px-6 py-4 bg-gray-50 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Imaging Task Completion
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Submit findings for{" "}
                  <span className="font-semibold text-indigo-600">
                    #{modalRecord.appointment_id}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-600 border shadow-sm"
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
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Patient
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {modalRecord.patient?.name || "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Test Type
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {modalRecord.test_type || "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Doctor
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {modalRecord.doctor?.name || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs font-bold text-blue-700 uppercase mb-2">
                  Specialist Request Notes
                </p>
                <p className="text-sm text-blue-900 italic">
                  "
                  {getSpecialistNotes(modalRecord) ||
                    "No specific instructions provided."}
                  "
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-gray-700">
                  Imaging Findings / Results
                </span>
                <textarea
                  value={modalResults}
                  onChange={(e) => setModalResults(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Provide detailed findings, impressions, and conclusions..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-gray-700">
                  Upload Scans / Reports (PDF, Images)
                </span>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={(e) => setModalFiles(e.target.files)}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {modalFiles
                        ? `${modalFiles.length} files selected`
                        : "PNG, JPG, PDF up to 10MB"}
                    </p>
                  </div>
                </div>
              </label>

              {modalError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-700">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {modalError}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteImagingRequest}
                  disabled={isSubmittingComplete || !modalResults.trim()}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-8 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 shadow-md transition-all"
                >
                  {isSubmittingComplete ? "Processing…" : "Submit Results"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagingDashboard;
