<?php

namespace App\Models;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Imaging extends Model
{
    use HasFactory;

    protected $table = "imaging";

    protected $fillable = [
        "appointment_id",
        "patient_id",
        "doctor_id",
        "technician_id",
        "test_type",
        "queue_number",
        "status",
        "imaging_results",
        "imaging_attachments",
    ];

    protected $casts = [
        "imaging_attachments" => "array",
    ];

    protected $appends = [
        "imaging_attachment_urls",
    ];

    public function getImagingAttachmentUrlsAttribute(): array
    {
        $attachments = $this->imaging_attachments ?? [];
        if (!is_array($attachments)) {
            return [];
        }

        return array_map(
            fn ($path) => Storage::url($path),
            $attachments,
        );
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, "patient_id");
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, "doctor_id");
    }

    public function technician()
    {
        return $this->belongsTo(User::class, "technician_id");
    }
}
