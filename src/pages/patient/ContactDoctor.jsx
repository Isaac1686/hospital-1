import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactDoctor = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    subject: '',
    message: '',
    urgency: 'normal'
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
    
    fetchDoctors();
    setTimeout(() => setLoading(false), 500);
  }, [navigate]);

  const fetchDoctors = async () => {
    // Mock doctors data
    const mockDoctors = [
      { id: 1, name: 'Dr. Sarah Johnson', specialty: 'General Practitioner', email: 'sarah@hospital.com', phone: '+254-123-4567' },
      { id: 2, name: 'Dr. Michael Chen', specialty: 'Cardiology', email: 'mchen@hospital.com', phone: '+254-123-4568' },
      { id: 3, name: 'Dr. Emily Davis', specialty: 'Pediatrics', email: 'edavis@hospital.com', phone: '+254-123-4569' },
      { id: 4, name: 'Dr. Robert Wilson', specialty: 'Orthopedics', email: 'rwilson@hospital.com', phone: '+254-123-4570' }
    ];
    
    setDoctors(mockDoctors);
  };

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
    
    if (!formData.doctorId) {
      newErrors.doctorId = 'Please select a doctor';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Please enter a subject';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Please enter your message';
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
      // Simulate API call to send message
      const response = await fetch('http://localhost:8000/api/contact-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          patient_id: user?.id,
          doctor_id: formData.doctorId,
          subject: formData.subject,
          message: formData.message,
          urgency: formData.urgency
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Message sent successfully!');
        navigate('/patient/dashboard');
      } else {
        if (data.errors) {
          const frontendErrors = {};
          Object.keys(data.errors).forEach(key => {
            frontendErrors[key] = data.errors[key][0];
          });
          setErrors(frontendErrors);
        } else {
          setErrors({ general: data.message || 'Failed to send message' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedDoctor = () => {
    return doctors.find(d => d.id === parseInt(formData.doctorId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact form...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Contact Doctor</h1>
              <p className="text-sm text-gray-600">Send a message to your healthcare provider</p>
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
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Send Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.doctorId}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter message subject..."
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Type your message here..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
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
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Message...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Doctor Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Doctor Information</h2>
            
            {getSelectedDoctor() && (
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">Dr</span>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{getSelectedDoctor().name}</p>
                    <p className="text-sm text-gray-600">{getSelectedDoctor().specialty}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm"><span className="font-medium">Email:</span> {getSelectedDoctor().email}</p>
                      <p className="text-sm"><span className="font-medium">Phone:</span> {getSelectedDoctor().phone}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-medium text-gray-800 mb-2">Contact Information</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Office hours: Monday - Friday, 8:00 AM - 5:00 PM</li>
                    <li>• Response time: Within 24 hours for normal messages</li>
                    <li>• Emergency: Call hospital main line for urgent matters</li>
                    <li>• Prescription refills: Available through pharmacy</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactDoctor;
