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
        Schema::create('pharmacy', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('pharmacist_id')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('queue_number')->nullable();
            $table->enum('status', ['pending', 'in-progress', 'completed', 'cancelled'])->default('pending');
            $table->text('prescription_details')->nullable();
            $table->text('pharmacy_notes')->nullable();
            $table->timestamp('dispensed_at')->nullable();
            $table->timestamps();

            $table->index(['appointment_id']);
            $table->index(['patient_id']);
            $table->index(['pharmacist_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacy');
    }
};
