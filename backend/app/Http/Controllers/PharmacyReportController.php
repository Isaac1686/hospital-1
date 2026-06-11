<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\MedicationOrder;
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
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $startDate = $validated['start_date'];
        $endDate = $validated['end_date'];

        // Get prescription data
        $prescriptions = Prescription::whereBetween('created_at', [$startDate, $endDate])
            ->get();

        // Get order data
        $orders = MedicationOrder::whereBetween('created_at', [$startDate, $endDate])
            ->get();

        // Calculate summary statistics
        $summary = [
            'total_prescriptions' => $prescriptions->count(),
            'total_orders' => $orders->count(),
            'total_completed' => $prescriptions->where('status', 'completed')->count(),
            'total_pending' => $prescriptions->where('status', 'active')->count(),
            'total_value' => $orders->sum(fn($order) => $order->quantity * $order->unit_price)
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
