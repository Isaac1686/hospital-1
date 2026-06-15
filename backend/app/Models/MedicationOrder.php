<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicationOrder extends Model
{
    use HasFactory;

    protected $table = 'medication_orders';

    protected $fillable = [
        'medication_name',
        'quantity',
        'unit_price',
        'supplier',
        'expected_delivery_date',
        'notes',
        'status'
    ];
}
