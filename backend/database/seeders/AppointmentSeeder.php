<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the appointments table with sample data.
     */
    public function run(): void
    {
        // Get doctors and patients
        $doctors = User::whereIn('role', ['medical_doctor', 'specialist'])->get();
        $patients = User::where('role', 'patient')->get();

        if ($doctors->isEmpty() || $patients->isEmpty()) {
            $this->command->info('No doctors or patients found. Skipping appointment seeding.');
            return;
        }

        // Create sample appointments
        $sampleAppointments = [
            [
                'doctor_id' => $doctors->first()->id,
                'patient_id' => $patients->first()->id,
                'appointment_date' => now()->addDays(2)->toDateString(),
                'appointment_time' => '10:30',
                'reason' => 'Regular checkup',
                'symptoms' => 'Feeling good, just routine checkup',
                'status' => 'scheduled',
            ],
            [
                'doctor_id' => $doctors->skip(1)->first()->id ?? $doctors->first()->id,
                'patient_id' => $patients->first()->id,
                'appointment_date' => now()->addDays(5)->toDateString(),
                'appointment_time' => '14:00',
                'reason' => 'Follow-up consultation',
                'symptoms' => 'Mild headache, occasional dizziness',
                'status' => 'scheduled',
            ],
            [
                'doctor_id' => $doctors->skip(2)->first()->id ?? $doctors->first()->id,
                'patient_id' => $patients->first()->id,
                'appointment_date' => now()->subDays(10)->toDateString(),
                'appointment_time' => '09:00',
                'reason' => 'Initial consultation',
                'symptoms' => 'Chest pain, shortness of breath',
                'status' => 'completed',
            ],
        ];

        foreach ($sampleAppointments as $appointment) {
            Appointment::create($appointment);
        }

        $this->command->info('Sample appointments created successfully.');
    }
}
