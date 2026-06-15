<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    /**
     * Display a listing of prescriptions.
     */
    public function index(Request $request)
    {
        $query = Prescription::query();

        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        return response()->json($query->with('patient')->latest()->get());
    }

    /**
     * Store a newly created prescription.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'medication_name' => 'required|string|max:255',
            'dosage' => 'required|string|max:255',
            'frequency' => 'nullable|string|max:255',
            'duration' => 'nullable|string|max:255',
            'instructions' => 'nullable|string|max:1000',
            'quantity' => 'nullable|integer|min:1'
        ]);

        $prescription = Prescription::create([
            ...$validated,
            'status' => 'active'
        ]);

        return response()->json($prescription, 201);
    }

    /**
     * Display the specified prescription.
     */
    public function show(Prescription $prescription)
    {
        return response()->json($prescription->load('patient'));
    }

    /**
     * Update the specified prescription.
     */
    public function update(Request $request, Prescription $prescription)
    {
        $validated = $request->validate([
            'medication_name' => 'nullable|string|max:255',
            'dosage' => 'nullable|string|max:255',
            'frequency' => 'nullable|string|max:255',
            'duration' => 'nullable|string|max:255',
            'instructions' => 'nullable|string|max:1000',
            'quantity' => 'nullable|integer|min:1',
            'status' => 'nullable|string|in:active,inactive,completed'
        ]);

        $prescription->update($validated);

        return response()->json($prescription);
    }

    /**
     * Remove the specified prescription.
     */
    public function destroy(Prescription $prescription)
    {
        $prescription->delete();
        return response()->json(['message' => 'Prescription deleted successfully']);
    }
}
