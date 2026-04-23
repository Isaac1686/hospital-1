import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../auth/login/Login';
import Register from '../auth/register/Register';
import PatientDashboard from '../dashboard/Patient/PatientDashboard';
import LaboratoryDashboard from '../dashboard/Laboratory/laboratory';
import MedicalDoctorDashboard from '../dashboard/MedicalDoctor/MedicalDoctor';
import PharmacyDashboard from '../dashboard/Pharmacy/Pharmacydashboard';
import SpecialistDoctorDashboard from '../dashboard/SpecialistDoctor/SpecialistDoctor';
import BookAppointment from '../patient/BookAppointment';
import MedicalRecords from '../patient/MedicalRecords';
import ContactDoctor from '../patient/ContactDoctor';
import EmergencyContact from '../patient/EmergencyContact';

// Import other components (you can add these as needed)
// import Dashboard from '../dashboard/Dashboard';
// import Home from '../home/Home';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient/book-appointment" element={<BookAppointment />} />
        <Route path="/patient/medical-records" element={<MedicalRecords />} />
        {/* <Route path="/patient/add-medical-record" element={<AddMedicalRecord />} /> */}
        <Route path="/patient/contact-doctor" element={<ContactDoctor />} />
        <Route path="/patient/emergency-contact" element={<EmergencyContact />} />
        
        {/* Protected Routes (add authentication check later) */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/laboratory/dashboard" element={<LaboratoryDashboard />} />
        <Route path="/medical/dashboard" element={<MedicalDoctorDashboard />} />
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
        <Route path="/specialist/dashboard" element={<SpecialistDoctorDashboard />} />
        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} /> */}
        
        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;