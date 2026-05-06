<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DoctorController extends Controller
{
    /**
     * Get all doctors (users with role 'medical' or 'specialist').
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $doctors = User::whereIn('role', ['medical_doctor', 'specialist'])
                ->select('id', 'name', 'email', 'phone_number', 'role', 'specialty')
                ->get()
                ->map(function ($doctor) {
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'email' => $doctor->email,
                        'phone_number' => $doctor->phone_number,
                        'role' => $doctor->role === 'medical_doctor' ? 'medical' : 'specialist',
                        'specialty' => $doctor->specialty
                    ];
                });

            return response()->json([
                'message' => 'Doctors retrieved successfully',
                'data' => $doctors
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving doctors',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific doctor by ID.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $doctor = User::whereIn('role', ['medical_doctor', 'specialist'])
                ->where('id', $id)
                ->select('id', 'name', 'email', 'phone_number', 'role', 'specialty')
                ->first();

            if (!$doctor) {
                return response()->json([
                    'message' => 'Doctor not found'
                ], 404);
            }

            $doctorData = [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => $doctor->email,
                'phone_number' => $doctor->phone_number,
                'role' => $doctor->role === 'medical_doctor' ? 'medical' : 'specialist',
                'specialty' => $doctor->specialty
            ];

            return response()->json([
                'message' => 'Doctor retrieved successfully',
                'data' => $doctorData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving doctor',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
