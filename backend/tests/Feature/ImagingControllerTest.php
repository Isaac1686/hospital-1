<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Imaging;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImagingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_update_imaging_with_attachments(): void
    {
        Storage::fake('public');

        // Create a patient
        $patient = User::factory()->create([
            'role' => 'patient',
        ]);

        // Create a doctor
        $doctor = User::factory()->create([
            'role' => 'doctor',
        ]);

        // Create a specialist
        $specialist = User::factory()->create([
            'role' => 'specialist',
            'specialty' => 'Neurology',
        ]);

        // Create an appointment
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00:00',
            'reason' => 'Persistent headaches',
            'status' => 'scheduled',
        ]);

        // Create an imaging record
        $imaging = Imaging::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'test_type' => 'mri',
            'status' => 'pending',
        ]);

        // Send a PUT/POST spoofed request to update/complete the imaging record with attachments
        $file = UploadedFile::fake()->image('brain_mri.png');

        $response = $this->postJson("/api/imaging/{$imaging->id}", [
            '_method' => 'PUT',
            'status' => 'completed',
            'imaging_results' => 'Brain scan is normal.',
            'attachments' => [$file],
        ]);

        $response->assertStatus(200);

        // Assert the database has the updated imaging record
        $this->assertDatabaseHas('imaging', [
            'id' => $imaging->id,
            'status' => 'completed',
            'imaging_results' => 'Brain scan is normal.',
        ]);

        $imaging->refresh();
        $this->assertCount(1, $imaging->imaging_attachments);

        // Check if the appointment was routed to specialist (Neurology)
        $appointment->refresh();
        $this->assertEquals('specialist', $appointment->assigned_department);
        $this->assertEquals($specialist->id, $appointment->referred_specialist_id);
    }
}
