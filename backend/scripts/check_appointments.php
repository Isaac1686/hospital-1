<?php

// Check if appointments are being retrieved correctly and with relationships
require __DIR__ . '/bootstrap/app.php';

use App\Models\Appointment;
use App\Models\User;

// Get first patient
$patient = User::where('role', 'patient')->first();

if ($patient) {
    echo "Patient: {$patient->id} - {$patient->name}\n";
    
    // Get appointments for this patient
    $appointments = Appointment::where('patient_id', $patient->id)
        ->with(['doctor', 'patient'])
        ->get();
    
    echo "\nAppointments for patient {$patient->id}: " . $appointments->count() . "\n";
    
    foreach ($appointments as $apt) {
        echo "\n- ID: {$apt->id}\n";
        echo "  Status: {$apt->status}\n";
        echo "  Date: {$apt->appointment_date}\n";
        echo "  Doctor ID: {$apt->doctor_id}\n";
        echo "  Doctor Name: {$apt->doctor?->name ?? 'NULL'}\n";
        echo "  Doctor Role: {$apt->doctor?->role ?? 'NULL'}\n";
    }
} else {
    echo "No patients found\n";
}
