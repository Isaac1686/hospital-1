import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NewPrescription = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        patient_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: ''
    });
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch list of patients
        const fetchPatients = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/patients', {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch patients');
                }
                const data = await response.json();
                setPatients(data || []);
            } catch (err) {
                console.error('Error fetching patients:', err);
                setError('Failed to load patients');
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Validate form
        if (!formData.patient_id || !formData.medication_name || !formData.dosage) {
            setError('Please fill in all required fields');
            setIsSubmitting(false);
            return;
        }

        try {
            // Create prescription record
            const response = await fetch('http://localhost:8000/api/prescriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create prescription');
            }

            const data = await response.json();
            alert('Prescription created successfully!');
            navigate('/pharmacy/dashboard');
        } catch (err) {
            console.error('Error creating prescription:', err);
            setError(err.message || 'Failed to create prescription');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center py-4">
                        <button
                            onClick={() => navigate('/pharmacy/dashboard')}
                            className="text-indigo-600 hover:text-indigo-700 mr-4"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Selection */}
                        <div>
                            <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700">
                                Select Patient *
                            </label>
                            <select
                                id="patient_id"
                                name="patient_id"
                                value={formData.patient_id}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Choose a patient</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name} (ID: {patient.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Medication Name */}
                        <div>
                            <label htmlFor="medication_name" className="block text-sm font-medium text-gray-700">
                                Medication Name *
                            </label>
                            <input
                                type="text"
                                id="medication_name"
                                name="medication_name"
                                value={formData.medication_name}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g., Paracetamol, Amoxicillin"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Dosage */}
                        <div>
                            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
                                Dosage *
                            </label>
                            <input
                                type="text"
                                id="dosage"
                                name="dosage"
                                value={formData.dosage}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g., 500mg, 2 tablets"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Frequency */}
                        <div>
                            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                                Frequency
                            </label>
                            <select
                                id="frequency"
                                name="frequency"
                                value={formData.frequency}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select frequency</option>
                                <option value="Once daily">Once daily</option>
                                <option value="Twice daily">Twice daily</option>
                                <option value="Three times daily">Three times daily</option>
                                <option value="Four times daily">Four times daily</option>
                                <option value="As needed">As needed</option>
                            </select>
                        </div>

                        {/* Duration */}
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                Duration
                            </label>
                            <input
                                type="text"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                                placeholder="e.g., 7 days, 2 weeks"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Quantity */}
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                Quantity
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                min="1"
                                placeholder="Number of tablets/bottles"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Instructions */}
                        <div>
                            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                                Special Instructions
                            </label>
                            <textarea
                                id="instructions"
                                name="instructions"
                                value={formData.instructions}
                                onChange={handleInputChange}
                                rows="4"
                                placeholder="e.g., Take with food, avoid dairy products, not for children under 12"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-4 pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Prescription'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/pharmacy/dashboard')}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewPrescription;
