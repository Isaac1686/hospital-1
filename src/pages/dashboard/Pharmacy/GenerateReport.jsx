import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const formatDate = (date) => date.toISOString().split('T')[0];

const getDateRange = (type) => {
    const today = new Date();
    const end = formatDate(today);

    if (type === 'daily') {
        return { start: end, end };
    }

    if (type === 'weekly') {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        return { start: formatDate(startDate), end };
    }

    if (type === 'monthly') {
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: formatDate(startDate), end };
    }

    if (type === 'yearly') {
        const startDate = new Date(today.getFullYear(), 0, 1);
        return { start: formatDate(startDate), end };
    }

    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 30);
    return { start: formatDate(defaultStart), end };
};

const GenerateReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const passedTasks = location.state?.pharmacyTasks || null;
    const [reportType, setReportType] = useState('daily');
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(getDateRange('daily').start);
    const [endDate, setEndDate] = useState(getDateRange('daily').end);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const range = getDateRange(reportType);
        setStartDate(range.start);
        setEndDate(range.end);
    }, [reportType]);

    const handleGenerateReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!startDate || !endDate) {
            setError('Start and end dates are required to generate a report.');
            setLoading(false);
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date must be on or before end date.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/pharmacy/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    report_type: reportType,
                    start_date: startDate,
                    end_date: endDate
                    , ...(passedTasks ? { appointment_ids: passedTasks.map(t => t.id) } : {})
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to generate report');
            }

            const data = await response.json();
            setReportData(data);
        } catch (err) {
            console.error('Error generating report:', err);
            setError(err.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        // Create a simple PDF download
        const content = generateReportContent();
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', `pharmacy_report_${new Date().toISOString().split('T')[0]}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const generateReportContent = () => {
        if (!reportData) return '';

        let content = `PHARMACY REPORT\n`;
        content += `Report Type: ${reportType.toUpperCase()}\n`;
        content += `Generated: ${new Date().toLocaleString()}\n\n`;

        if (reportData.summary) {
            content += `SUMMARY\n`;
            content += `Total Patients: ${reportData.summary.total_patients || 0}\n`;
            content += `Total Medications: ${reportData.summary.total_medications || 0}\n`;
            content += `Total Completed: ${reportData.summary.total_completed || 0}\n`;
            content += `Total Pending: ${reportData.summary.total_pending || 0}\n\n`;
        }

        return content;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-4">
                        <button
                            onClick={() => navigate('/pharmacy/dashboard')}
                            className="text-purple-600 hover:text-purple-700 mr-4"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Generate Report</h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Report Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Report Filters</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleGenerateReport} className="space-y-6">
                        <div className="flex justify-center">
                            {/* Report Type */}
                            <div className="w-full max-w-md">
                                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                                    Report Type
                                </label>
                                <select
                                    id="reportType"
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="daily">Daily Report</option>
                                    <option value="weekly">Weekly Report</option>
                                    <option value="monthly">Monthly Report</option>
                                    <option value="yearly">Yearly Report</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 text-sm text-gray-500 text-center">
                            Report range: {startDate} to {endDate}
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-center space-x-4 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/pharmacy/dashboard')}
                                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                {/* Report Display */}
                {reportData && (
                    <div className="bg-white rounded-lg shadow p-8 print:shadow-none">
                        {/* Report Header */}
                        <div className="mb-8 pb-8 border-b-2 border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-900">Pharmacy Report</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Generated on: {new Date().toLocaleString()}
                            </p>
                        </div>

                        {/* Summary Stats */}
                        {reportData.summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Total Patients</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {reportData.summary.total_patients || 0}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Total Medications</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {reportData.summary.total_medications || 0}
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Total Completed</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {reportData.summary.total_completed || 0}
                                    </p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Total Pending</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {reportData.summary.total_pending || 0}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Medications Table */}
                        {reportData.medications && reportData.medications.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Medications</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medication</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Times Prescribed</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Quantity</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reportData.medications.map((med, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {med.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {med.times_prescribed || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {med.total_quantity || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ₨ {parseFloat(med.total_value || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-4 pt-8 print:hidden border-t-2 border-gray-200">
                            <button
                                onClick={handlePrint}
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2v-2a2 2 0 00-2-2zm-6-4h6"></path>
                                </svg>
                                Print Report
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                            >
                                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Download
                            </button>
                        </div>
                    </div>
                )}

                {/* No Report Message */}
                {!reportData && !loading && (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p className="mt-4 text-gray-600">Select your filter options above and click "Generate Report" to view the results</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerateReport;
