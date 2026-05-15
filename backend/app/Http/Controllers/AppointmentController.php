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
        Appointment::expirePastAppointments();

        $query = Appointment::with(['doctor', 'patient']);

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('doctor_id')) {
            $query
                ->where('doctor_id', $request->doctor_id)
                ->visibleToDoctor();
        }

        $appointments = $query
            ->orderBy('appointment_date', 'asc')
            ->orderBy('created_at', 'asc')
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
                'appointment_date' => 'nullable|date|after_or_equal:today',
            ]);

            $appointment = Appointment::create([
                'doctor_id' => $validated['doctor_id'],
                'patient_id' => $validated['patient_id'],
                'appointment_date' => $validated['appointment_date'] ?? now()->toDateString(),
                'status' => Appointment::STATUS_SCHEDULED,
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
                'status' => 'sometimes|required|in:scheduled,completed,cancelled,postponed,expired',
                'appointment_date' => 'sometimes|date|after_or_equal:today',
            ]);

            if (isset($validated['appointment_date'])) {
                $appointment->appointment_date = $validated['appointment_date'];
            }

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

            $validated = $request->validate([
                'appointment_date' => 'required|date|after_or_equal:today',
            ]);

            $appointment->update([
                'status' => Appointment::STATUS_POSTPONED,
                'appointment_date' => $validated['appointment_date'],
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
