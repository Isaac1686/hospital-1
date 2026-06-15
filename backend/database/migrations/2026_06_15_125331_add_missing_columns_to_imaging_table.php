<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table("imaging", function (Blueprint $table) {
            $table
                ->foreignId("technician_id")
                ->nullable()
                ->constrained("users")
                ->onDelete("set null")
                ->after("doctor_id");
            $table
                ->text("imaging_attachments")
                ->nullable()
                ->after("imaging_results");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("imaging", function (Blueprint $table) {
            $table->dropForeign(["technician_id"]);
            $table->dropColumn(["technician_id", "imaging_attachments"]);
        });
    }
};
