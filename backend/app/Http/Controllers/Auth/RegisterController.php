<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    /**
     * Show the registration form.
     *
     * @return \Illuminate\View\View
     */
    public function showRegistrationForm()
    {
        return view('auth.register');
    }

    /**
     * Handle a registration request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone_number' => 'required|string|max:20',
            'age' => 'required|integer|min:1|max:120',
            'gender' => 'required|in:male,female,other',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            // Return JSON response for API calls
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            return back()->withErrors($validator)->withInput();
        }

        $user = User::create([
            'name' => $request->full_name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'age' => $request->age,
            'gender' => $request->gender,
            'role' => 'patient', // Default role for registered users
            'password' => Hash::make($request->password),
        ]);

        // Return JSON response for API calls
        return response()->json([
            'message' => 'Registration successful',
            'user' => $user
        ], 201);
    }

    /**
     * Handle a patient addition request by doctor.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addPatient(Request $request)
    {
        // Check if doctor_id is provided and corresponds to a doctor
        $doctorId = $request->doctor_id;
        if (!$doctorId) {
            return response()->json([
                'message' => 'Doctor ID is required'
            ], 400);
        }

        $doctor = User::find($doctorId);
        if (!$doctor || !in_array($doctor->role, ['medical_doctor', 'specialist'])) {
            return response()->json([
                'message' => 'Invalid doctor ID or unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone_number' => 'required|string|max:20',
            'age' => 'required|integer|min:1|max:120',
            'gender' => 'required|in:male,female,other',
            'password' => 'nullable|string|min:6', // Optional, can generate if not provided
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate password if not provided
        $password = $request->password ?: 'password123'; // TODO: Generate secure password

        $patient = User::create([
            'name' => $request->full_name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'age' => $request->age,
            'gender' => $request->gender,
            'role' => 'patient',
            'doctor_id' => $doctorId,
            'password' => Hash::make($password),
        ]);

        return response()->json([
            'message' => 'Patient added successfully',
            'patient' => $patient,
            'temporary_password' => $password // In production, send via email
        ], 201);
    }

    /**
     * List patients assigned to a specific doctor.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function listPatients(Request $request)
    {
        $doctorId = $request->query('doctor_id');
        if (!$doctorId) {
            return response()->json([
                'message' => 'Doctor ID is required'
            ], 400);
        }

        $doctor = User::find($doctorId);
        if (!$doctor || !in_array($doctor->role, ['medical_doctor', 'specialist'])) {
            return response()->json([
                'message' => 'Invalid doctor ID or unauthorized'
            ], 403);
        }

        $patients = User::where('role', 'patient')
            ->where('doctor_id', $doctorId)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'phone_number', 'age', 'gender', 'created_at']);

        return response()->json($patients);
    }
}
