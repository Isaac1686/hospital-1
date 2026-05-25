<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->date('appointment_date')->after('doctor_id');
            $table->time('appointment_time')->nullable()->after('appointment_date');
            $table->text('reason')->nullable()->after('appointment_time');
            $table->text('symptoms')->nullable()->after('reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['appointment_date', 'appointment_time', 'reason', 'symptoms']);
        });
    }
};
