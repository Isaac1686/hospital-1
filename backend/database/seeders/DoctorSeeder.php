<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DoctorSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the users table with doctors.
     */
    public function run(): void
    {
        // Specialist Doctors (matching frontend data)
        $specialistDoctors = [
            [
                'name' => 'Dr. Sarah Johnson',
                'email' => 'sarah.johnson@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567890',
                'age' => 35,
                'gender' => 'female',
                'role' => 'specialist',
            ],
            [
                'name' => 'Dr. Michael Chen',
                'email' => 'michael.chen@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567891',
                'age' => 42,
                'gender' => 'male',
                'role' => 'specialist',
            ],
            [
                'name' => 'Dr. Emily Davis',
                'email' => 'emily.davis@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567892',
                'age' => 38,
                'gender' => 'female',
                'role' => 'specialist',
            ],
            [
                'name' => 'Dr. Robert Wilson',
                'email' => 'robert.wilson@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567893',
                'age' => 45,
                'gender' => 'male',
                'role' => 'specialist',
            ],
            [
                'name' => 'Dr. Lisa Anderson',
                'email' => 'lisa.anderson@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567894',
                'age' => 40,
                'gender' => 'female',
                'role' => 'specialist',
            ],
        ];

        // Medical Doctors (matching frontend data)
        $medicalDoctors = [
            [
                'name' => 'Dr. James Taylor',
                'email' => 'james.taylor@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567895',
                'age' => 48,
                'gender' => 'male',
                'role' => 'medical_doctor',
            ],
            [
                'name' => 'Dr. Maria Garcia',
                'email' => 'maria.garcia@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567896',
                'age' => 36,
                'gender' => 'female',
                'role' => 'medical_doctor',
            ],
            [
                'name' => 'Dr. David Brown',
                'email' => 'david.brown@hospital.com',
                'password' => Hash::make('password123'),
                'phone_number' => '+1234567897',
                'age' => 52,
                'gender' => 'male',
                'role' => 'medical_doctor',
            ],
        ];

        // Insert specialist doctors
        foreach ($specialistDoctors as $doctor) {
            User::create($doctor);
        }

        // Insert medical doctors
        foreach ($medicalDoctors as $doctor) {
            User::create($doctor);
        }
    }
}
