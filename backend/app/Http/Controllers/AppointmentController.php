<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Laboratory;
use App\Models\Imaging;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
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

        // Filter by specialist referral if provided
        if ($request->has('specialist_id') || $request->has('referred_specialist_id')) {
            $specialistId = $request->input('specialist_id', $request->input('referred_specialist_id'));
            $query->where('referred_specialist_id', $specialistId);
        }

        // Filter by assigned department if provided
        if ($request->has('assigned_department')) {
            $query->where('assigned_department', $request->assigned_department);
        }

        // Optionally filter by appointment date
        if ($request->has('appointment_date')) {
            $query->whereDate('appointment_date', $request->appointment_date);
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
                'symptoms' => 'nullable|string|max:1000',
                'assigned_department' => 'nullable|in:medical,laboratory,pharmacy,specialist,imaging',
                'status' => 'nullable|in:scheduled,waiting,completed,cancelled,postponed',
                'referred_specialist_id' => 'nullable|exists:users,id',
                'lab_results' => 'nullable|string|max:2000',
                'pharmacy_medication' => 'nullable|string|max:255',
                // `pharmacy_dosage` stores the full dosage instructions
                // including units and frequency.
                'pharmacy_dosage' => 'nullable|string|max:255',
                'pharmacy_assigned_at' => 'nullable|date',
                'specialist_notes' => 'nullable|string|max:2000',
            ]);

            // Prevent a patient from booking the same doctor at the same date/time
            $conflictQuery = Appointment::where('doctor_id', $validated['doctor_id'])
                ->where('patient_id', $validated['patient_id'])
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->where('status', 'scheduled');

            if (!empty($validated['appointment_time'])) {
                $conflictQuery->where('appointment_time', $validated['appointment_time']);
            }

            if ($conflictQuery->exists()) {
                return response()->json([
                    'message' => 'You already have an appointment with this doctor at the selected date/time.',
                    'errors' => ['appointment' => ['Duplicate appointment for same doctor at this time.']]
                ], 422);
            }

            // Create appointment with all required fields
            $appointment = Appointment::create([
                'doctor_id' => $validated['doctor_id'],
                'patient_id' => $validated['patient_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $validated['appointment_time'] ?? null,
                'reason' => $validated['reason'] ?? 'General consultation',
                'symptoms' => $validated['symptoms'] ?? null,
                'status' => 'scheduled',
                'queue_number' => $this->getNextQueueNumber(
                    $validated['doctor_id'],
                    $validated['appointment_date'],
                    User::find($validated['patient_id'])->age ?? 0
                ),
                'assigned_department' => $validated['assigned_department'] ?? 'medical',
                'referred_specialist_id' => $validated['referred_specialist_id'] ?? null,
                'lab_results' => $validated['lab_results'] ?? null,
                'pharmacy_notes' => $validated['pharmacy_notes'] ?? null,
                'pharmacy_medication' => $validated['pharmacy_medication'] ?? null,
                'pharmacy_dosage' => $validated['pharmacy_dosage'] ?? null,
                'pharmacy_assigned_at' => $validated['pharmacy_assigned_at'] ?? null,
                'specialist_notes' => $validated['specialist_notes'] ?? null,
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
     * Cancel all scheduled appointments for a doctor due to an emergency.
     *
     * @param  int  $doctorId
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancelDoctorAppointmentsDueToEmergency(int $doctorId, Request $request): JsonResponse
    {
        try {
            $doctor = User::findOrFail($doctorId);

            if (!in_array($doctor->role, ['medical_doctor', 'specialist'])) {
                return response()->json([
                    'message' => 'Only doctors can trigger emergency appointment cancellations.'
                ], 403);
            }

            $reason = $request->input('reason', 'Doctor emergency: appointments cancelled until emergency is resolved.');
            $today = Carbon::today()->toDateString();

            $appointments = Appointment::where('doctor_id', $doctorId)
                ->where('status', 'scheduled')
                ->whereDate('appointment_date', '>=', $today)
                ->get();

            if ($appointments->isEmpty()) {
                return response()->json([
                    'message' => 'No scheduled appointments found to cancel.'
                ], 200);
            }

            foreach ($appointments as $appointment) {
                $appointment->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => $reason
                ]);
            }

            return response()->json([
                'message' => 'Emergency cancellation completed.',
                'cancelled_count' => $appointments->count(),
                'cancellation_reason' => $reason
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel appointments: ' . $e->getMessage()
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
     * Get next queue number for a new appointment.
     */
    private function getNextQueueNumber(int $doctorId, string $appointmentDate, int $patientAge): int
    {
        $existingNumbers = Appointment::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $appointmentDate)
            ->where('status', 'scheduled')
            ->whereNotNull('queue_number')
            ->pluck('queue_number')
            ->toArray();

        $isHighPriority = $patientAge >= 50;
        $start = $isHighPriority ? 1 : 11;
        $available = $start;

        if (count($existingNumbers) > 0) {
            $filtered = array_filter($existingNumbers, function ($number) use ($isHighPriority) {
                return $isHighPriority ? $number < 11 : $number >= 11;
            });
            if (!empty($filtered)) {
                $available = max($filtered) + 1;
            }
        }

        return $available;
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
            $previousAssignedDept = $appointment->assigned_department;

            $validated = $request->validate([
                'status' => 'sometimes|required|in:scheduled,waiting,completed,cancelled,postponed',
                'assigned_department' => 'sometimes|required|in:medical,laboratory,pharmacy,specialist,imaging',
                'lab_results' => 'sometimes|nullable|string|max:2000',
                'pharmacy_notes' => 'sometimes|nullable|string|max:2000',
                'pharmacy_medication' => 'sometimes|nullable|string|max:255',
                'pharmacy_dosage' => 'sometimes|nullable|string|max:255',
                'pharmacy_assigned_at' => 'sometimes|nullable|date',
                'specialist_notes' => 'sometimes|nullable|string|max:2000',
                'referred_specialist_id' => 'sometimes|nullable|exists:users,id'
            ]);

            // Validate referred specialist role if provided.
            if (isset($validated['referred_specialist_id'])) {
                $specialist = User::find($validated['referred_specialist_id']);
                if ($specialist && $specialist->role !== 'specialist') {
                    return response()->json([
                        'message' => 'Selected doctor is not a specialist.',
                        'errors' => ['referred_specialist_id' => ['Selected user must be a specialist.']]
                    ], 422);
                }
            }

            // Update appointment workflow fields.
            if (isset($validated['status'])) {
                $appointment->status = $validated['status'];
            }

            if (isset($validated['assigned_department'])) {
                $appointment->assigned_department = $validated['assigned_department'];
            }

            if (array_key_exists('lab_results', $validated)) {
                $appointment->lab_results = $validated['lab_results'];
                // Do NOT auto-mark the appointment as 'completed' when lab results
                // are provided. Appointment completion should occur only after
                // the patient has been processed by the pharmacy (or explicitly
                // marked by a doctor).
            }

            if (array_key_exists('pharmacy_notes', $validated)) {
                $appointment->pharmacy_notes = $validated['pharmacy_notes'];
            }

            if (array_key_exists('pharmacy_medication', $validated)) {
                $appointment->pharmacy_medication = $validated['pharmacy_medication'];
            }

            if (array_key_exists('pharmacy_dosage', $validated)) {
                $appointment->pharmacy_dosage = (string) $validated['pharmacy_dosage'];
            }

            if (array_key_exists('pharmacy_assigned_at', $validated)) {
                $appointment->pharmacy_assigned_at = $validated['pharmacy_assigned_at'];
            }

            if (array_key_exists('specialist_notes', $validated)) {
                $appointment->specialist_notes = $validated['specialist_notes'];
            }

            if (array_key_exists('referred_specialist_id', $validated)) {
                $appointment->referred_specialist_id = $validated['referred_specialist_id'];
            }

            $appointment->save();

            // Ensure laboratory record is created/updated for this appointment.
            // If the lab has returned results and the appointment moved from
            // 'laboratory' -> 'medical', mark the lab record as completed so it
            // shows as complete on the laboratory dashboard. Do not change the
            // appointment status here.
            $labRecord = Laboratory::firstOrNew(['appointment_id' => $appointment->id]);
            $labRecord->patient_id = $appointment->patient_id;
            $labRecord->doctor_id = $appointment->doctor_id;
            $labRecord->test_type = $appointment->reason ?? $appointment->symptoms ?? 'Laboratory task';
            $labRecord->queue_number = $appointment->queue_number;
            // Default lab record status maps to a valid laboratory enum value.
            if ($appointment->status === 'completed') {
                $labRecord->status = 'completed';
            } elseif ($appointment->status === 'cancelled') {
                $labRecord->status = 'cancelled';
            } else {
                $labRecord->status = 'pending';
            }

            if (array_key_exists('lab_results', $validated)) {
                $labRecord->lab_results = $validated['lab_results'];
            }

            // If appointment was in laboratory and is now routed back to medical,
            // treat the lab task as completed (results returned to doctor).
            if ($previousAssignedDept === 'laboratory' && $appointment->assigned_department === 'medical') {
                $labRecord->status = 'completed';
            }

            $labRecord->save();

            // Ensure imaging record is created/updated when appointment goes to imaging.
            if ($appointment->assigned_department === 'imaging' || $previousAssignedDept === 'imaging') {
                $imagingRecord = Imaging::firstOrNew(['appointment_id' => $appointment->id]);
                $imagingRecord->patient_id = $appointment->patient_id;
                $imagingRecord->doctor_id = $appointment->doctor_id;
                $imagingRecord->test_type = $appointment->reason ?? $appointment->symptoms ?? 'Imaging task';
                $imagingRecord->queue_number = $appointment->queue_number;
                // Map appointment status into valid imaging enum
                if ($appointment->status === 'completed') {
                    $imagingRecord->status = 'completed';
                } elseif ($appointment->status === 'cancelled') {
                    $imagingRecord->status = 'cancelled';
                } else {
                    $imagingRecord->status = 'pending';
                }

                if (array_key_exists('lab_results', $validated)) {
                    // keep any imaging-specific results separate if provided
                    $imagingRecord->imaging_results = $validated['lab_results'];
                }

                // If appointment was in imaging and is now routed back to specialist,
                // mark imaging record as completed
                if ($previousAssignedDept === 'imaging' && $appointment->assigned_department === 'specialist') {
                    $imagingRecord->status = 'completed';
                }

                $imagingRecord->save();
            }

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
