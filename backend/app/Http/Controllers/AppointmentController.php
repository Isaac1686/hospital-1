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

        $appointments = $query->orderBy('appointment_date', 'asc')
                              ->orderBy('appointment_time', 'asc')
                              ->get();

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
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required|date_format:H:i',
                'reason' => 'nullable|string|max:255',
                'symptoms' => 'nullable|string|max:1000'
            ], [
                'doctor_id.required' => 'Please select a doctor',
                'doctor_id.exists' => 'Selected doctor does not exist',
                'patient_id.required' => 'Patient information is required',
                'patient_id.exists' => 'Patient does not exist',
                'date.required' => 'Please select a date',
                'date.after_or_equal' => 'Appointment date cannot be in the past',
                'time.required' => 'Please select a time',
                'time.date_format' => 'Invalid time format'
            ]);

            // Check if doctor exists and has medical or specialist role
            $doctor = User::whereIn('role', ['medical_doctor', 'specialist'])
                          ->where('id', $validated['doctor_id'])
                          ->first();
            
            if (!$doctor) {
                return response()->json([
                    'message' => 'Selected user is not a valid doctor',
                    'errors' => ['doctor_id' => ['Selected doctor is not valid']]
                ], 422);
            }

            // Check for existing appointment at the same date and time
            $existingAppointment = Appointment::where('doctor_id', $validated['doctor_id'])
                                              ->where('appointment_date', $validated['date'])
                                              ->where('appointment_time', $validated['time'])
                                              ->where('status', '!=', 'cancelled')
                                              ->first();

            if ($existingAppointment) {
                return response()->json([
                    'message' => 'This time slot is already booked',
                    'errors' => ['time' => ['Selected time slot is not available']]
                ], 422);
            }

            $appointment = Appointment::create([
                'doctor_id' => $validated['doctor_id'],
                'patient_id' => $validated['patient_id'],
                'appointment_date' => $validated['date'],
                'appointment_time' => $validated['time'],
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
                'date' => 'sometimes|required|date|after_or_equal:today',
                'time' => 'sometimes|required|date_format:H:i',
                'reason' => 'sometimes|nullable|string|max:255',
                'symptoms' => 'sometimes|nullable|string|max:1000',
                'status' => 'sometimes|required|in:scheduled,completed,cancelled,postponed'
            ]);

            // Check for time conflicts if date or time is being updated
            if (isset($validated['date']) || isset($validated['time'])) {
                $newDate = $validated['date'] ?? $appointment->appointment_date;
                $newTime = $validated['time'] ?? $appointment->appointment_time;

                $conflictingAppointment = Appointment::where('doctor_id', $appointment->doctor_id)
                                                     ->where('appointment_date', $newDate)
                                                     ->where('appointment_time', $newTime)
                                                     ->where('id', '!=', $id)
                                                     ->where('status', '!=', 'cancelled')
                                                     ->first();

                if ($conflictingAppointment) {
                    return response()->json([
                        'message' => 'This time slot is already booked',
                        'errors' => ['time' => ['Selected time slot is not available']]
                    ], 422);
                }
            }

            // Update appointment fields
            if (isset($validated['date'])) {
                $appointment->appointment_date = $validated['date'];
            }
            if (isset($validated['time'])) {
                $appointment->appointment_time = $validated['time'];
            }
            if (isset($validated['reason'])) {
                $appointment->reason = $validated['reason'];
            }
            if (isset($validated['symptoms'])) {
                $appointment->symptoms = $validated['symptoms'];
            }
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

            $validated = $request->validate([
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required|date_format:H:i'
            ]);

            // Check for time conflicts
            $conflictingAppointment = Appointment::where('doctor_id', $appointment->doctor_id)
                                                 ->where('appointment_date', $validated['date'])
                                                 ->where('appointment_time', $validated['time'])
                                                 ->where('id', '!=', $id)
                                                 ->where('status', '!=', 'cancelled')
                                                 ->first();

            if ($conflictingAppointment) {
                return response()->json([
                    'message' => 'This time slot is already booked',
                    'errors' => ['time' => ['Selected time slot is not available']]
                ], 422);
            }

            $appointment->update([
                'appointment_date' => $validated['date'],
                'appointment_time' => $validated['time'],
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
