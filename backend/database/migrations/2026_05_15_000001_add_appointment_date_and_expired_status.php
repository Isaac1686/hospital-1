<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table("appointments", function (Blueprint $table) {
            $table->index("appointment_date");
        });

        DB::table("appointments")
            ->whereNull("appointment_date")
            ->update(["appointment_date" => DB::raw("date(created_at)")]);
    }

    public function down(): void
    {
        Schema::table("appointments", function (Blueprint $table) {
            $table->dropIndex(["appointment_date"]);
        });
    }
};
