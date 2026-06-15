<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\MedicationOrder;
use App\Models\Appointment;
use Illuminate\Http\Request;

class PharmacyReportController extends Controller
{
    /**
     * Generate pharmacy report based on filters.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'report_type' => 'required|string|in:daily,weekly,monthly,yearly,custom',
            'start_date' => 'required_without:appointment_ids|date',
            'end_date' => 'required_without:appointment_ids|date|after_or_equal:start_date',
            'appointment_ids' => 'sometimes|array',
            'appointment_ids.*' => 'integer'
        ]);

        // If specific appointment IDs were provided (from the dashboard), use them
        if ($request->filled('appointment_ids')) {
            $ids = $request->input('appointment_ids');

            // Load appointments and convert to a prescriptions-like collection
            $appointments = Appointment::whereIn('id', $ids)->get();

            $prescriptions = $appointments->map(function ($appt) {
                return (object) [
                    'patient_id' => $appt->patient_id,
                    'medication_name' => $appt->pharmacy_medication ?? null,
                    'quantity' => $appt->pharmacy_quantity ?? 1,
                    'status' => $appt->status ?? null,
                    'created_at' => $appt->pharmacy_assigned_at ?? $appt->created_at,
                ];
            })->filter(fn($p) => !empty($p->medication_name));

            // Medication orders table doesn't have appointment_id in this schema.
            // We'll leave orders empty when specific appointment IDs are provided.
            $orders = collect();

            $startDate = $request->input('start_date') ?? null;
            $endDate = $request->input('end_date') ?? null;
        } else {
            $startDate = $validated['start_date'];
            $endDate = $validated['end_date'];

            // Get prescription data by date range
            $prescriptions = Prescription::whereBetween('created_at', [$startDate, $endDate])->get();

            // Get order data by date range
            $orders = MedicationOrder::whereBetween('created_at', [$startDate, $endDate])->get();
        }

        // Calculate summary statistics
        $summary = [
            'total_patients' => $prescriptions->pluck('patient_id')->unique()->count(),
            'total_medications' => $prescriptions->pluck('medication_name')->unique()->count(),
            'total_completed' => $prescriptions->where('status', 'completed')->count(),
            'total_pending' => $prescriptions->where('status', 'active')->count(),
        ];

        // Group prescriptions by medication
        $medications = $prescriptions->groupBy('medication_name')->map(function ($group) {
            return [
                'name' => $group->first()->medication_name,
                'times_prescribed' => $group->count(),
                'total_quantity' => $group->sum('quantity'),
                'total_value' => $group->sum(fn($p) => $p->quantity * 100) // Assuming 100 is a default price
            ];
        })->values();

        return response()->json([
            'summary' => $summary,
            'medications' => $medications->take(10)->all(),
            'report_type' => $validated['report_type'],
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);
    }
}
