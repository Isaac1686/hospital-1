<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the appointments.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['doctor', 'patient']);

        // Filter by patient if patient_id is provided
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        // Filter by doctor if doctor_id is provided
        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        $appointments = $query->orderBy('created_at', 'asc')->get();

        return response()->json($appointments);
    }

    /**
     * Store a newly created appointment.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'required|exists:users,id',
                'patient_id' => 'required|exists:users,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'appointment_time' => 'nullable|date_format:H:i',
                'reason' => 'nullable|string|max:255',
                'symptoms' => 'nullable|string|max:1000'
            ]);

            // Create appointment with all required fields
            $appointment = Appointment::create([
                'doctor_id' => $validated['doctor_id'],
                'patient_id' => $validated['patient_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $validated['appointment_time'] ?? null,
                'reason' => $validated['reason'] ?? 'General consultation',
                'symptoms' => $validated['symptoms'] ?? null,
                'status' => 'scheduled'
            ]);

            // Load relationships for response
            $appointment->load(['doctor', 'patient']);

            return response()->json($appointment, 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified appointment.
     *
     * @param  int  $id
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $appointment = Appointment::with(['doctor', 'patient'])
                                 ->findOrFail($id);

        return response()->json($appointment);
    }

    /**
     * Update the specified appointment.
     *
     * @param  int  $id
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $appointment = Appointment::findOrFail($id);

            $validated = $request->validate([
                'status' => 'sometimes|required|in:scheduled,completed,cancelled,postponed'
            ]);

            // Update appointment fields
            if (isset($validated['status'])) {
                $appointment->status = $validated['status'];
            }

            $appointment->save();

            // Load relationships for response
            $appointment->load(['doctor', 'patient']);

            return response()->json($appointment);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Postpone the specified appointment.
     *
     * @param  int  $id
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function postpone(int $id, Request $request): JsonResponse
    {
        try {
            $appointment = Appointment::findOrFail($id);

            // Simply change the status to postponed
            $appointment->update([
                'status' => 'postponed'
            ]);

            // Load relationships for response
            $appointment->load(['doctor', 'patient']);

            return response()->json($appointment);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to postpone appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified appointment.
     *
     * @param  int  $id
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $appointment = Appointment::findOrFail($id);
            
            $appointment->delete();

            return response()->json([
                'message' => 'Appointment cancelled successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel appointment: ' . $e->getMessage()
            ], 500);
        }
    }
}
