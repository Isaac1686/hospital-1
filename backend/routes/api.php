<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\QueueController;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);

Route::post('/patients', [RegisterController::class, 'addPatient']);
Route::get('/patients', [RegisterController::class, 'listPatients']);

Route::apiResource('appointments', AppointmentController::class);
Route::put('/appointments/{id}/postpone', [AppointmentController::class, 'postpone']);
Route::post('/appointments/doctor/{doctor}/emergency-cancel', [AppointmentController::class, 'cancelDoctorAppointmentsDueToEmergency']);
Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);

// Queue Management Routes
Route::get('/queue/doctor', [QueueController::class, 'getDoctorQueue']);
Route::get('/queue/all', [QueueController::class, 'getAllQueues']);
Route::post('/queue/add', [QueueController::class, 'addToQueue']);
Route::get('/queue/position', [QueueController::class, 'getPatientPosition']);
