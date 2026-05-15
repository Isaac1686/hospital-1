<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class QueueController extends Controller
{
    /**
     * Get prioritized queue for a specific doctor
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDoctorQueue(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'required|exists:users,id',
                'date' => 'nullable|date'
            ]);

            $doctorId = $validated['doctor_id'];
            $date = $validated['date'] ?? now()->toDateString();

            Appointment::expirePastAppointments();

            $appointments = Appointment::with(['patient', 'doctor'])
                ->where('doctor_id', $doctorId)
                ->forDate($date)
                ->where('status', Appointment::STATUS_SCHEDULED)
                ->get();

            // Prioritize appointments based on patient age
            $prioritizedQueue = $this->prioritizeAppointments($appointments);

            return response()->json([
                'doctor_id' => $doctorId,
                'date' => $date,
                'queue' => $prioritizedQueue,
                'total_patients' => $prioritizedQueue->count(),
                'priority_patients' => $prioritizedQueue->where('priority_level', 'high')->count(),
                'normal_patients' => $prioritizedQueue->where('priority_level', 'normal')->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all queues for all doctors for a specific date
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllQueues(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => 'nullable|date'
            ]);

            $date = $validated['date'] ?? now()->toDateString();

            // Get all doctors (medical and specialist)
            $doctors = User::whereIn('role', ['medical_doctor', 'specialist'])
                ->select('id', 'name', 'role')
                ->get();

            $allQueues = [];

            foreach ($doctors as $doctor) {
                $appointments = Appointment::with(['patient', 'doctor'])
                    ->where('doctor_id', $doctor->id)
                    ->forDate($date)
                    ->where('status', Appointment::STATUS_SCHEDULED)
                    ->get();

                $prioritizedQueue = $this->prioritizeAppointments($appointments);

                $allQueues[] = [
                    'doctor' => $doctor,
                    'queue' => $prioritizedQueue,
                    'total_patients' => $prioritizedQueue->count(),
                    'priority_patients' => $prioritizedQueue->where('priority_level', 'high')->count(),
                    'normal_patients' => $prioritizedQueue->where('priority_level', 'normal')->count()
                ];
            }

            return response()->json([
                'date' => $date,
                'queues' => $allQueues,
                'total_doctors' => count($allQueues),
                'total_patients' => array_sum(array_column($allQueues, 'total_patients'))
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch all queues: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add patient to queue with automatic prioritization
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addToQueue(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'required|exists:users,id',
                'patient_id' => 'required|exists:users,id',
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required|date_format:H:i',
                'reason' => 'nullable|string|max:255',
                'symptoms' => 'nullable|string|max:1000'
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

            // Get patient information to determine priority
            $patient = User::findOrFail($validated['patient_id']);
            $priorityLevel = $this->determinePriorityLevel((int) ($patient->age ?? 0));

            $appointment = Appointment::create([
                'doctor_id' => $validated['doctor_id'],
                'patient_id' => $validated['patient_id'],
                'appointment_date' => $validated['date'],
                'status' => Appointment::STATUS_SCHEDULED,
            ]);

            // Load relationships for response
            $appointment->load(['doctor', 'patient']);

            // Get updated queue
            $updatedQueue = $this->getDoctorQueueInternal($validated['doctor_id'], $validated['date']);

            return response()->json([
                'appointment' => $appointment,
                'priority_level' => $priorityLevel,
                'queue_position' => $this->getQueuePosition($updatedQueue, $appointment->id),
                'updated_queue' => $updatedQueue
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add to queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get patient position in queue
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPatientPosition(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|exists:users,id',
                'doctor_id' => 'required|exists:users,id',
                'date' => 'nullable|date',
            ]);

            $patientId = $validated['patient_id'];
            $doctorId = $validated['doctor_id'];
            $date = $validated['date'] ?? now()->toDateString();

            $queue = $this->getDoctorQueueInternal($doctorId, $date);
            $position = $this->getQueuePosition($queue, null, $patientId);

            if ($position === null) {
                return response()->json([
                    'message' => 'Patient not found in queue',
                    'in_queue' => false
                ]);
            }

            return response()->json([
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'date' => $date,
                'queue_position' => $position,
                'in_queue' => true,
                'total_patients_ahead' => $position - 1,
                'estimated_wait_time' => $this->calculateWaitTime($position)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get patient position: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prioritize appointments based on patient age
     *
     * @param  \Illuminate\Support\Collection  $appointments
     * @return \Illuminate\Support\Collection
     */
    private function prioritizeAppointments(Collection $appointments): Collection
    {
        $highPriorityAppointments = $appointments->filter(function ($appointment) {
            return $this->patientAge($appointment) >= 50;
        });

        $normalPriorityAppointments = $appointments->filter(function ($appointment) {
            return $this->patientAge($appointment) < 50;
        });

        $highPrioritySorted = $highPriorityAppointments->sortBy('created_at')->values();
        $normalPrioritySorted = $normalPriorityAppointments->sortBy('created_at')->values();

        $highPriorityWithNumbers = $highPrioritySorted->map(function ($appointment, $index) {
            return $this->formatQueueEntry($appointment, 'high', $index + 1);
        });

        $normalPriorityWithNumbers = $normalPrioritySorted->map(function ($appointment, $index) {
            return $this->formatQueueEntry($appointment, 'normal', $index + 11);
        });

        return $highPriorityWithNumbers->concat($normalPriorityWithNumbers);
    }

    private function formatQueueEntry(Appointment $appointment, string $priorityLevel, int $queueNumber): array
    {
        $patient = $appointment->patient;
        $patientAge = $this->patientAge($appointment);

        return [
            'appointment_id' => $appointment->id,
            'patient' => [
                'id' => $patient?->id,
                'name' => $patient?->name ?? 'Unknown patient',
                'age' => $patientAge,
                'phone_number' => $patient?->phone_number,
                'appointment_time' => $appointment->created_at?->format('H:i'),
            ],
            'priority_level' => $priorityLevel,
            'queue_number' => $queueNumber,
            'priority_score' => $this->calculatePriorityScore($patientAge),
        ];
    }

    private function patientAge(Appointment $appointment): int
    {
        return (int) ($appointment->patient?->age ?? 0);
    }

    
    /**
     * Determine priority level based on age
     *
     * @param  int  $age
     * @return string
     */
    private function determinePriorityLevel(int $age = 0): string
    {
        return $age >= 50 ? 'high' : 'normal';
    }

    /**
     * Calculate priority score for sorting (lower = higher priority).
     */
    private function calculatePriorityScore(int $age): int
    {
        return $age >= 50 ? 0 : 1000;
    }

    /**
     * Get queue for internal use
     *
     * @param  int  $doctorId
     * @param  string  $date
     * @return \Illuminate\Support\Collection
     */
    private function getDoctorQueueInternal(int $doctorId, string $date): Collection
    {
        $appointments = Appointment::with(['patient', 'doctor'])
            ->where('doctor_id', $doctorId)
            ->forDate($date)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->get();

        return $this->prioritizeAppointments($appointments);
    }

    /**
     * Get queue position for appointment or patient
     *
     * @param  \Illuminate\Support\Collection  $queue
     * @param  int|null  $appointmentId
     * @param  int|null  $patientId
     * @return int|null
     */
    private function getQueuePosition(Collection $queue, ?int $appointmentId = null, ?int $patientId = null): ?int
    {
        foreach ($queue as $item) {
            if ($appointmentId && $item['appointment_id'] === $appointmentId) {
                return $item['queue_number'];
            }
            if ($patientId && ($item['patient']['id'] ?? null) === $patientId) {
                return $item['queue_number'];
            }
        }
        
        return null;
    }

    /**
     * Calculate estimated wait time in minutes
     *
     * @param  int  $position
     * @return int
     */
    private function calculateWaitTime(int $position): int
    {
        // Average consultation time: 15 minutes
        $averageConsultationTime = 15;
        
        return ($position - 1) * $averageConsultationTime;
    }
}
