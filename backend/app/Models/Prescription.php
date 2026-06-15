<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'medication_name',
        'dosage',
        'frequency',
        'duration',
        'instructions',
        'quantity',
        'status'
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}
