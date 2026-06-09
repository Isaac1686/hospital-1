<?php

namespace App\Models;

use App\Models\Laboratory;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
        'reason',
        'symptoms',
        'status',
        'queue_number',
        'assigned_department',
        'lab_results',
        'pharmacy_notes',
        'pharmacy_medication',
        'pharmacy_dosage',
        'pharmacy_assigned_at',
        'specialist_notes',
        'referred_specialist_id',
        'cancellation_reason'
    ];

    /**
     * Get the patient that owns the appointment.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor that owns the appointment.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function laboratory(): HasOne
    {
        return $this->hasOne(Laboratory::class, 'appointment_id');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'available' => 'boolean',
        ];
    }
}
