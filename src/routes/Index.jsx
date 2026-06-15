import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/login/Login';
import Register from '../pages/auth/register/Register';
import PatientDashboard from '../pages/dashboard/Patient/PatientDashboard';
import LaboratoryDashboard from '../pages/dashboard/Laboratory/laboratory';
import MedicalDoctorDashboard from '../pages/dashboard/MedicalDoctor/MedicalDoctor';
import PharmacyDashboard from '../pages/dashboard/Pharmacy/Pharmacydashboard';
import SpecialistDoctorDashboard from '../pages/dashboard/SpecialistDoctor/SpecialistDoctor';
import ImagingDashboard from '../pages/dashboard/Imaging/ImagingDashboard';
import BookAppointment from '../pages/dashboard/Patient/components/BookAppointment';
import MedicalRecords from '../pages/dashboard/Patient/components/MedicalRecords';
import GenerateReport from '../pages/dashboard/Pharmacy/GenerateReport';
// import ContactDoctor from '../pages/patient/ContactDoctor';
// import EmergencyContact from '../pages/patient/EmergencyContact';

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
        {/* Pharmacy routes */}
        <Route path="/reports/generate" element={<GenerateReport />} />
        {/* <Route path="/patient/add-medical-record" element={<AddMedicalRecord />} /> */}
        {/* <Route path="/patient/contact-doctor" element={<ContactDoctor />} /> */}
        {/* <Route path="/patient/emergency-contact" element={<EmergencyContact />} /> */}

        {/* Protected Routes (add authentication check later) */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/laboratory/dashboard" element={<LaboratoryDashboard />} />
        <Route path="/medical/dashboard" element={<MedicalDoctorDashboard />} />
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
        <Route path="/specialist/dashboard" element={<SpecialistDoctorDashboard />} />
        <Route path="/imaging/dashboard" element={<ImagingDashboard />} />
        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} /> */}

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;