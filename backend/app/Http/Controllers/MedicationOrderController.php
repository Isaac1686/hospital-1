<?php

namespace App\Http\Controllers;

use App\Models\MedicationOrder;
use Illuminate\Http\Request;

class MedicationOrderController extends Controller
{
    /**
     * Display a listing of medication orders.
     */
    public function index(Request $request)
    {
        $query = MedicationOrder::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Store a newly created medication order.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'medication_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000'
        ]);

        $order = MedicationOrder::create([
            ...$validated,
            'status' => 'pending'
        ]);

        return response()->json($order, 201);
    }

    /**
     * Display the specified medication order.
     */
    public function show(MedicationOrder $medicationOrder)
    {
        return response()->json($medicationOrder);
    }

    /**
     * Update the specified medication order.
     */
    public function update(Request $request, MedicationOrder $medicationOrder)
    {
        $validated = $request->validate([
            'medication_name' => 'nullable|string|max:255',
            'quantity' => 'nullable|integer|min:1',
            'unit_price' => 'nullable|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:pending,confirmed,delivered,cancelled'
        ]);

        $medicationOrder->update($validated);

        return response()->json($medicationOrder);
    }

    /**
     * Remove the specified medication order.
     */
    public function destroy(MedicationOrder $medicationOrder)
    {
        $medicationOrder->delete();
        return response()->json(['message' => 'Order deleted successfully']);
    }
}
