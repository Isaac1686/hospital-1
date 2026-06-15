<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['patient', 'medical_doctor', 'specialist', 'laboratorist', 'pharmacist', 'imaging'])
                ->default('patient')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['patient', 'medical_doctor', 'specialist', 'laboratorist', 'pharmacist'])
                ->default('patient')
                ->change();
        });
    }
};
