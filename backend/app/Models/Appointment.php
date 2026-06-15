<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    public const STATUS_SCHEDULED = "scheduled";
    public const STATUS_COMPLETED = "completed";
    public const STATUS_CANCELLED = "cancelled";
    public const STATUS_POSTPONED = "postponed";
    public const STATUS_EXPIRED = "expired";

    public const EXPIRABLE_STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_POSTPONED,
    ];

    protected $fillable = [
        "patient_id",
        "doctor_id",
        "appointment_date",
        "appointment_time",
        "reason",
        "symptoms",
        "status",
        "queue_number",
        "assigned_department",
        "lab_results",
        "pharmacy_notes",
        "pharmacy_medication",
        "pharmacy_dosage",
        "pharmacy_assigned_at",
        "specialist_notes",
        "referred_specialist_id",
        "cancellation_reason",
    ];

    protected function casts(): array
    {
        return [
            "appointment_date" => "date",
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, "patient_id");
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, "doctor_id");
    }

    public function laboratory(): HasOne
    {
        return $this->hasOne(Laboratory::class, "appointment_id");
    }

    /**
     * Mark past-day scheduled/postponed appointments as expired.
     */
    public static function expirePastAppointments(?Carbon $asOf = null): int
    {
        $cutoff = ($asOf ?? now())->startOfDay();

        return static::query()
            ->whereIn("status", self::EXPIRABLE_STATUSES)
            ->where("appointment_date", "<", $cutoff->toDateString())
            ->update(["status" => self::STATUS_EXPIRED]);
    }

    /**
     * Appointments visible on doctor dashboards: today and future, not expired.
     */
    public function scopeVisibleToDoctor(Builder $query): Builder
    {
        $today = now()->toDateString();

        return $query
            ->where("status", "!=", self::STATUS_EXPIRED)
            ->where("appointment_date", ">=", $today);
    }

    /**
     * Filter queue/list rows for a specific calendar day.
     */
    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->whereDate("appointment_date", $date);
    }
}
