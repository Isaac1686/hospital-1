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
            $table->enum('assigned_department', ['medical', 'laboratory', 'pharmacy', 'specialist'])
                ->default('medical')
                ->after('status');
            $table->text('lab_results')->nullable()->after('symptoms');
            $table->text('pharmacy_notes')->nullable()->after('lab_results');
            $table->text('specialist_notes')->nullable()->after('pharmacy_notes');
            $table->foreignId('referred_specialist_id')->nullable()->constrained('users')->nullOnDelete()->after('specialist_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['referred_specialist_id']);
            $table->dropColumn([
                'assigned_department',
                'lab_results',
                'pharmacy_notes',
                'specialist_notes',
                'referred_specialist_id'
            ]);
        });
    }
};
