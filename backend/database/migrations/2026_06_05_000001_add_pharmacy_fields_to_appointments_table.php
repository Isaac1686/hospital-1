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
            $table->string('pharmacy_medication')->nullable()->after('pharmacy_notes');
            $table->string('pharmacy_dosage')->nullable()->after('pharmacy_medication');
            $table->timestamp('pharmacy_assigned_at')->nullable()->after('pharmacy_dosage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'pharmacy_medication',
                'pharmacy_dosage',
                'pharmacy_assigned_at',
            ]);
        });
    }
};
