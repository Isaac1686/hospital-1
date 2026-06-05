<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Laboratory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class LaboratoryController extends Controller
{
    /**
     * Display a listing of laboratory records.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Laboratory::with(['appointment.doctor', 'patient', 'technician']);

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->input('patient_id'));
        }

        if ($request->has('appointment_id')) {
            $query->where('appointment_id', $request->input('appointment_id'));
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->input('doctor_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // If client supplies `scheduled_date`, filter laboratory records by the date
        // the lab record was created (i.e. the day the patient was sent to laboratory).
        if ($request->has('scheduled_date')) {
            $query->whereDate('created_at', $request->input('scheduled_date'));
        }

        $labRecords = $query->orderBy('created_at', 'desc')->get();

        return response()->json($labRecords);
    }

    /**
     * Store a newly created laboratory record.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'appointment_id' => 'required|exists:appointments,id',
                'patient_id' => 'required|exists:users,id',
                'doctor_id' => 'nullable|exists:users,id',
                'test_type' => 'nullable|string|max:255',
                'queue_number' => 'nullable|integer|min:1',
                'status' => 'nullable|in:pending,in-progress,completed,cancelled',
                'lab_results' => 'nullable|string',
                // 'scheduled_date' and 'scheduled_time' are not stored on laboratory table
            ]);

            $laboratory = Laboratory::create(array_merge([
                'status' => 'pending',
            ], $validated));

            return response()->json($laboratory->load(['appointment', 'patient', 'technician']), 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create laboratory record: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified laboratory record.
     */
    public function show(int $id): JsonResponse
    {
        $laboratory = Laboratory::with(['appointment.doctor', 'patient', 'technician'])->findOrFail($id);

        return response()->json($laboratory);
    }

    /**
     * Update the specified laboratory record.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $laboratory = Laboratory::findOrFail($id);

            $validated = $request->validate([
                'appointment_id' => 'nullable|exists:appointments,id',
                'patient_id' => 'nullable|exists:users,id',
                'doctor_id' => 'nullable|exists:users,id',
                'test_type' => 'nullable|string|max:255',
                'queue_number' => 'nullable|integer|min:1',
                'status' => 'nullable|in:pending,in-progress,completed,cancelled',
                'lab_results' => 'nullable|string',
                // 'scheduled_date' and 'scheduled_time' are not stored on laboratory table
            ]);

            $laboratory->update($validated);

            return response()->json($laboratory->load(['appointment', 'patient', 'technician']));
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update laboratory record: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified laboratory record.
     */
    public function destroy(int $id): JsonResponse
    {
        $laboratory = Laboratory::findOrFail($id);
        $laboratory->delete();

        return response()->json(['message' => 'Laboratory record deleted successfully.']);
    }
}
