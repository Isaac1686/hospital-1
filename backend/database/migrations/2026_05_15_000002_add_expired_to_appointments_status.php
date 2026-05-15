<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE appointments MODIFY COLUMN status "
            . "ENUM('scheduled', 'completed', 'cancelled', 'postponed', 'expired') "
            . "NOT NULL DEFAULT 'scheduled'"
        );
    }

    public function down(): void
    {
        DB::table('appointments')
            ->where('status', 'expired')
            ->update(['status' => 'cancelled']);

        DB::statement(
            "ALTER TABLE appointments MODIFY COLUMN status "
            . "ENUM('scheduled', 'completed', 'cancelled', 'postponed') "
            . "NOT NULL DEFAULT 'scheduled'"
        );
    }
};
