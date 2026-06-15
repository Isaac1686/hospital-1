<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("UPDATE `appointments` SET `assigned_department` = 'medical' WHERE `assigned_department` IS NULL");
        DB::statement("ALTER TABLE `appointments` MODIFY `assigned_department` ENUM('medical','laboratory','pharmacy','specialist','imaging') NOT NULL DEFAULT 'medical'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE `appointments` SET `assigned_department` = 'medical' WHERE `assigned_department` NOT IN ('medical','laboratory','pharmacy','specialist')");
        DB::statement("ALTER TABLE `appointments` MODIFY `assigned_department` ENUM('medical','laboratory','pharmacy','specialist') NOT NULL DEFAULT 'medical'");
    }
};
