<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\LaboratoryController;
use App\Http\Controllers\ImagingController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\MedicationOrderController;
use App\Http\Controllers\PharmacyReportController;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);

Route::post('/patients', [RegisterController::class, 'addPatient']);
Route::get('/patients', [RegisterController::class, 'listPatients']);

Route::apiResource('appointments', AppointmentController::class);
Route::apiResource('laboratory', LaboratoryController::class);
Route::apiResource('imaging', ImagingController::class);
Route::put('/appointments/{id}/postpone', [AppointmentController::class, 'postpone']);
Route::post('/appointments/doctor/{doctor}/emergency-cancel', [AppointmentController::class, 'cancelDoctorAppointmentsDueToEmergency']);
Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);

// Queue Management Routes
Route::get('/queue/doctor', [QueueController::class, 'getDoctorQueue']);
Route::get('/queue/all', [QueueController::class, 'getAllQueues']);
Route::get('/queue/laboratory', [QueueController::class, 'getLaboratoryQueue']);
Route::get('/laboratory/report', [QueueController::class, 'getLaboratoryReport']);
Route::post('/queue/add', [QueueController::class, 'addToQueue']);
Route::get('/queue/position', [QueueController::class, 'getPatientPosition']);

// Prescription Routes
Route::apiResource('prescriptions', PrescriptionController::class);

// Medication Order Routes
Route::apiResource('medication-orders', MedicationOrderController::class);

// Pharmacy Report Routes
Route::post('/pharmacy/report', [PharmacyReportController::class, 'generate']);
