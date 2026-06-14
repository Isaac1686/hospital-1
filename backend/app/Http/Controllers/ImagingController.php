<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Imaging;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ImagingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Imaging::with(['appointment.doctor', 'patient', 'technician']);

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

        if ($request->has('start_date') && $request->has('end_date')) {
            $start = $request->input('start_date');
            $end = $request->input('end_date');
            $query->whereDate('created_at', '>=', $start)->whereDate('created_at', '<=', $end);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json($records);
    }

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
                'imaging_results' => 'nullable|string',
                'attachments.*' => 'file|max:10240',
            ]);

            $toCreate = array_merge([
                'status' => 'pending',
            ], $validated);

            // handle attachments
            if ($request->hasFile('attachments')) {
                $stored = [];
                foreach ($request->file('attachments') as $file) {
                    $path = Storage::putFile('public/imaging', $file);
                    $stored[] = $path;
                }
                $toCreate['imaging_attachments'] = json_encode($stored);
            }

            $record = Imaging::create($toCreate);

            return response()->json($record->load(['appointment', 'patient', 'technician']), 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create imaging record: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        $record = Imaging::with(['appointment.doctor', 'patient', 'technician'])->findOrFail($id);
        return response()->json($record);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $record = Imaging::findOrFail($id);

            $validated = $request->validate([
                'appointment_id' => 'nullable|exists:appointments,id',
                'patient_id' => 'nullable|exists:users,id',
                'doctor_id' => 'nullable|exists:users,id',
                'test_type' => 'nullable|string|max:255',
                'queue_number' => 'nullable|integer|min:1',
                'status' => 'nullable|in:pending,in-progress,completed,cancelled',
                'imaging_results' => 'nullable|string',
                'attachments.*' => 'file|max:10240',
            ]);

            // handle file attachments if provided
            if ($request->hasFile('attachments')) {
                $stored = $record->imaging_attachments ? json_decode($record->imaging_attachments, true) : [];
                foreach ($request->file('attachments') as $file) {
                    $path = Storage::putFile('public/imaging', $file);
                    $stored[] = $path;
                }
                $validated['imaging_attachments'] = json_encode($stored);
            }

            $record->update($validated);

            // If imaging completed, route appointment back to specialist
            if (isset($validated['status']) && $validated['status'] === 'completed') {
                $appointment = Appointment::find($record->appointment_id);
                if ($appointment) {
                    $appointment->assigned_department = 'specialist';
                    // Keep referred_specialist_id as-is so it returns to the correct specialist
                    $appointment->status = 'scheduled';
                    // If imaging results provided, append them to specialist notes
                    if (array_key_exists('imaging_results', $validated) && $validated['imaging_results']) {
                        $existing = $appointment->specialist_notes ?? '';
                        $note = "Imaging results:\n" . $validated['imaging_results'];
                        $appointment->specialist_notes = trim($existing . "\n\n" . $note);
                    }
                    $appointment->save();
                }
            }

            return response()->json($record->load(['appointment', 'patient', 'technician']));
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update imaging record: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $record = Imaging::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Imaging record deleted successfully.']);
    }
}
