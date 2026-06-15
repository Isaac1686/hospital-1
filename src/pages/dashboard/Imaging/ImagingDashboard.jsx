import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const imagingOptions = [
    { value: 'xray', label: 'X-ray' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'ct_scan', label: 'CT Scan' },
    { value: 'mri', label: 'MRI' },
    { value: 'other', label: 'Other Investigation' }
];

const ImagingDashboard = () => {
    const navigate = useNavigate();
    const [patientName, setPatientName] = useState('');
    const [patientId, setPatientId] = useState('');
    const [investigation, setInvestigation] = useState('xray');
    const [notes, setNotes] = useState('');
    const [requests, setRequests] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [user, setUser] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [modalRecord, setModalRecord] = useState(null);
    const [modalResults, setModalResults] = useState('');
    const [modalFiles, setModalFiles] = useState(null);
    const [modalError, setModalError] = useState('');
    const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const fetchImagingRequests = async () => {
        try {
            const resp = await fetch('http://localhost:8000/api/imaging', {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
            });
            if (resp.ok) {
                const data = await resp.json();
                setRequests(data || []);
            }
        } catch (err) {
            console.error('Failed to load imaging requests', err);
        }
    };

    const handleCompleteImagingRequest = async () => {
        if (!modalRecord) return;
        setModalError('');
        setIsSubmittingComplete(true);

        const updateLocalRequest = (updatedRequest) => {
            setRequests((prev) =>
                prev.map((request) =>
                    request.id === updatedRequest.id
                        ? { ...request, ...updatedRequest }
                        : request
                )
            );
        };

        try {
            const payload = {
                status: 'completed',
                imaging_results: modalResults.trim() || null
            };

            let response;
            if (modalFiles && modalFiles.length > 0) {
                const formData = new FormData();
                formData.append('status', 'completed');
                if (modalResults.trim()) {
                    formData.append('imaging_results', modalResults.trim());
                }
                Array.from(modalFiles).forEach((file) => {
                    formData.append('attachments[]', file);
                });

                response = await fetch(`http://localhost:8000/api/imaging/${modalRecord.id}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                response = await fetch(`http://localhost:8000/api/imaging/${modalRecord.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Unable to complete imaging request.');
            }

            const updatedRecord = await response.json();
            updateLocalRequest({
                ...updatedRecord,
                status: 'completed'
            });
            setSuccessMessage('Imaging completed and results returned to specialist.');
            setShowCompleteModal(false);
            setModalRecord(null);
            setModalResults('');
            setModalFiles(null);
            fetchImagingRequests();
        } catch (error) {
            console.error('Failed to complete imaging request', error);
            setModalError(error.message || 'Unable to complete imaging request.');
        } finally {
            setIsSubmittingComplete(false);
        }
    };

    useEffect(() => {
        const raw = localStorage.getItem('user');
        if (!raw) {
            navigate('/login');
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            setUser(parsed);
            fetchImagingRequests();
        } catch {
            navigate('/login');
        }
    }, [navigate]);

    const handleRequestInvestigation = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!patientName.trim() || !patientId.trim()) {
            setErrorMessage('Patient name and ID are required.');
            return;
        }

        // Prefer server-side imaging records created when specialists route patients.
        // Keep a lightweight local fallback for manual requests, then refresh.
        const newRequest = {
            id: Date.now(),
            patientId: patientId.trim(),
            patientName: patientName.trim(),
            investigation,
            notes: notes.trim(),
            requestedBy: user?.name || 'Unknown',
            requestedAt: new Date().toISOString(),
            status: 'Pending'
        };

        setRequests((prev) => [newRequest, ...prev]);
        setSuccessMessage('Investigation request submitted successfully.');
        setPatientName('');
        setPatientId('');
        setNotes('');
        setInvestigation('xray');
        // refresh server list (if available)
        fetchImagingRequests();
    };

    const getSpecialistNotes = (request) => {
        return (
            request.appointment?.specialist_notes ||
            request.specialist_notes ||
            request.imaging_request_details ||
            request.notes ||
            ''
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Imaging Dashboard</h1>
                            <p className="text-sm text-gray-600">Request radiology investigations like X-ray, Ultrasound, CT, MRI and more.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test results</h2>
                        {errorMessage && (
                            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                                {errorMessage}
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                                {successMessage}
                            </div>
                        )}
                        <form onSubmit={handleRequestInvestigation} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">Patient ID</span>
                                    <input
                                        value={patientId}
                                        onChange={(e) => setPatientId(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="Enter patient ID"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-gray-700">Patient Name</span>
                                    <input
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        placeholder="Enter patient name"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Investigation Type</span>
                                <select
                                    value={investigation}
                                    onChange={(e) => setInvestigation(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                >
                                    {imagingOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Clinical Notes</span>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                    placeholder="Add any relevant clinical information or reason for request"
                                />
                            </label>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center rounded-md bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Common request types</h2>
                        <ul className="space-y-3 text-sm text-gray-700">
                            <li className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <strong>X-ray:</strong> Chest, abdomen, extremities, spine and more.
                            </li>
                            <li className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <strong>Ultrasound:</strong> Abdomen, pelvis, obstetrics, soft tissue and doppler studies.
                            </li>
                            <li className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <strong>CT Scan:</strong> Head, chest, abdomen, trauma, and contrast studies.
                            </li>
                            <li className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <strong>MRI:</strong> Brain, spine, joints, soft tissue, and neuro studies.
                            </li>
                            <li className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <strong>Other:</strong> Endoscopy, biopsy guidance, echocardiography, or custom investigations.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Imaging Requests</h2>
                        <span className="text-sm text-gray-500">Latest requests are shown here.</span>
                    </div>

                    {requests.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                            No imaging requests submitted yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investigation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialist Notes</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(request.patient && request.patient.name) || (request.patientName ? `${request.patientName} (${request.patient_id})` : request.patient_id)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.test_type || imagingOptions.find((option) => option.value === request.investigation)?.label || request.investigation}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(request.doctor && request.doctor.name) || request.doctor_id || request.requestedBy}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(request.created_at || request.requestedAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getSpecialistNotes(request) || <span className="text-gray-400">No specialist notes</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {request.status !== 'completed' ? (
                                                    <button
                                                        onClick={() => { setModalRecord(request); setModalResults(''); setModalFiles(null); setShowCompleteModal(true); setModalError(''); }}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                                    >
                                                        Complete
                                                    </button>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showCompleteModal && modalRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="border-b px-6 py-4 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Complete Imaging Request</h3>
                                <p className="mt-1 text-sm text-gray-600">Submit imaging results and return the patient to the referring specialist.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCompleteModal(false)}
                                className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4 px-6 py-6">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <p className="text-sm font-semibold text-gray-900">Patient</p>
                                    <p className="mt-2 text-sm text-gray-700">{(modalRecord.patient && modalRecord.patient.name) || (modalRecord.patientName ? `${modalRecord.patientName} (${modalRecord.patient_id})` : modalRecord.patient_id)}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <p className="text-sm font-semibold text-gray-900">Investigation</p>
                                    <p className="mt-2 text-sm text-gray-700">{modalRecord.test_type || imagingOptions.find((option) => option.value === modalRecord.investigation)?.label || modalRecord.investigation}</p>
                                </div>
                            </div>

                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Imaging Results</span>
                                <textarea
                                    value={modalResults}
                                    onChange={(e) => setModalResults(e.target.value)}
                                    rows={5}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                    placeholder="Provide findings, impressions, and any specialist notes to return the patient with."
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Attachments (optional)</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setModalFiles(e.target.files)}
                                    className="mt-1 block w-full text-sm text-gray-700"
                                />
                            </label>

                            {modalError && (
                                <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                                    {modalError}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCompleteModal(false)}
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCompleteImagingRequest}
                                    disabled={isSubmittingComplete}
                                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                                >
                                    {isSubmittingComplete ? 'Completing…' : 'Complete Imaging'}
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
