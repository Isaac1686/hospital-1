<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create users for each role
        $users = [
            [
                'name' => 'Dr. John Smith',
                'email' => 'specialist@hospital.com',
                'phone_number' => '+1234567890',
                'age' => 45,
                'gender' => 'male',
                'role' => 'specialist',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Dr. Sarah Johnson',
                'email' => 'doctor@hospital.com',
                'phone_number' => '+1234567891',
                'age' => 38,
                'gender' => 'female',
                'role' => 'medical_doctor',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'James Wilson',
                'email' => 'patient@hospital.com',
                'phone_number' => '+1234567892',
                'age' => 25,
                'gender' => 'male',
                'role' => 'patient',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Emily Davis',
                'email' => 'laboratorist@hospital.com',
                'phone_number' => '+1234567893',
                'age' => 32,
                'gender' => 'female',
                'role' => 'laboratorist',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Michael Brown',
                'email' => 'pharmacist@hospital.com',
                'phone_number' => '+1234567894',
                'age' => 40,
                'gender' => 'male',
                'role' => 'pharmacist',
                'password' => Hash::make('password123'),
            ],
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}
