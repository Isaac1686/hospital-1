<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;

class ExpireAppointments extends Command
{
    protected $signature = 'appointments:expire';

    protected $description = 'Mark past scheduled/postponed appointments as expired';

    public function handle(): int
    {
        $count = Appointment::expirePastAppointments();

        $this->info("Expired {$count} appointment(s).");

        return self::SUCCESS;
    }
}
