import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmergencyContact = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    emergencyType: '',
    description: '',
    patientName: '',
    patientId: '',
    contactNumber: '',
    location: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    setTimeout(() => setLoading(false), 500);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.emergencyType) {
      newErrors.emergencyType = 'Please select emergency type';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Please describe the emergency';
    }
    
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Please provide contact number';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call for emergency contact
      const response = await fetch('http://localhost:8000/api/emergency-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          patient_id: user?.id,
          emergency_type: formData.emergencyType,
          description: formData.description,
          patient_name: formData.patientName,
          patient_id: formData.patientId,
          contact_number: formData.contactNumber,
          location: formData.location
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Emergency contact sent successfully! Medical team will contact you soon.');
        navigate('/patient/dashboard');
      } else {
        if (data.errors) {
          const frontendErrors = {};
          Object.keys(data.errors).forEach(key => {
            frontendErrors[key] = data.errors[key][0];
          });
          setErrors(frontendErrors);
        } else {
          setErrors({ general: data.message || 'Failed to send emergency contact' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Failed to send emergency contact. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading emergency contact...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Emergency Contact</h1>
              <p className="text-sm text-gray-600">Get immediate medical assistance</p>
            </div>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emergency Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex items-center p-4 bg-red-50 rounded-lg mb-4">
                <svg className="h-8 w-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <div>
                  <h2 className="text-lg font-bold text-red-800">Emergency Services</h2>
                  <p className="text-sm text-red-600">Available 24/7</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-6">Emergency Contact Form</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Emergency Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Type</label>
                  <select
                    name="emergencyType"
                    value={formData.emergencyType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Emergency Type</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="accident">Accident/Injury</option>
                    <option value="urgent">Urgent Consultation</option>
                    <option value="other">Other Emergency</option>
                  </select>
                  {errors.emergencyType && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyType}</p>
                  )}
                </div>

                {/* Emergency Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Please describe the emergency situation in detail..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Patient Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your full name"
                    />
                    {errors.patientName && (
                      <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID</label>
                    <input
                      type="text"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter patient ID if available"
                    />
                    {errors.patientId && (
                      <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your phone number"
                    />
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Current location or address"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                    )}
                  </div>
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {errors.general}
                  </div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Emergency Alert...
                      </>
                    ) : (
                      'Send Emergency Alert'
                    )}
                  </button>
                </div>
              </form>
          </div>
          </div>

          {/* Emergency Instructions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Emergency Instructions</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">For Medical Emergencies</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li>Call emergency services: 911 or local emergency number</li>
                  <li>Go to nearest emergency room</li>
                  <li>Describe symptoms clearly when calling</li>
                  <li>Have medical insurance information ready</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">For Non-Emergency Situations</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li>Use regular doctor contact form for non-urgent matters</li>
                  <li>Call your primary care physician during office hours</li>
                  <li>Use telemedicine services when available</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Important Notes</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li>Emergency contacts are monitored 24/7</li>
                  <li>False emergency reports may have legal consequences</li>
                  <li>Keep emergency contact information updated</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmergencyContact;
