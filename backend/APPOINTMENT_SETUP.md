# Appointment System Setup

This document explains the appointment booking system that has been implemented to handle patient appointments from the frontend booking component.

## What Has Been Implemented

### 1. Database Structure

#### Appointments Table
- **Migration**: `2026_05_05_081158_create_appointments_table.php`
- **Fields**:
  - `id` (primary key)
  - `patient_id` (foreign key to users table)
  - `doctor_id` (foreign key to doctors table)
  - `appointment_date` (date)
  - `appointment_time` (time)
  - `reason` (string, nullable)
  - `symptoms` (text, nullable)
  - `status` (enum: scheduled, completed, cancelled, postponed)
  - `timestamps`

#### Doctors Table
- **Migration**: `2026_05_05_081224_create_doctors_table.php`
- **Fields**:
  - `id` (primary key)
  - `name` (string)
  - `specialty` (string)
  - `type` (enum: specialist, medical)
  - `available` (boolean, default true)
  - `email` (string, unique, nullable)
  - `phone_number` (string, nullable)
  - `timestamps`

### 2. Models

#### Appointment Model
- **File**: `app/Models/Appointment.php`
- **Relationships**:
  - `patient()` - belongs to User
  - `doctor()` - belongs to Doctor
- **Fillable Fields**: All appointment fields except id and timestamps
- **Casts**: appointment_date to date, appointment_time to datetime:H:i

#### Doctor Model
- **File**: `app/Models/Doctor.php`
- **Relationships**:
  - `appointments()` - has many Appointment
- **Fillable Fields**: All doctor fields except id and timestamps
- **Casts**: available to boolean

#### User Model (Updated)
- **File**: `app/Models/User.php`
- **Added Relationship**:
  - `appointments()` - has many Appointment

### 3. Controllers

#### AppointmentController
- **File**: `app/Http/Controllers/AppointmentController.php`
- **Methods**:
  - `index()` - List appointments with filtering options
  - `store()` - Create new appointment with validation
  - `show()` - Get specific appointment
  - `update()` - Update appointment details
  - `postpone()` - Postpone appointment to new date/time
  - `destroy()` - Cancel/delete appointment

#### DoctorController (Updated)
- **File**: `app/Http/Controllers/DoctorController.php`
- **Methods**:
  - `index()` - List all available doctors
  - `show()` - Get specific doctor
- **Uses Doctor model instead of User model**

### 4. API Routes

- **File**: `routes/api.php`
- **Routes**:
  - `GET/POST/PUT/DELETE /api/appointments` - Full CRUD operations
  - `PUT /api/appointments/{id}/postpone` - Postpone appointment
  - `GET /api/doctors` - List doctors
  - `GET /api/doctors/{id}` - Get specific doctor

### 5. Data Seeding

#### DoctorSeeder
- **File**: `database/seeders/DoctorSeeder.php`
- **Contains 8 mock doctors** matching the frontend data:
  - 5 Specialist Doctors (Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology)
  - 3 Medical Doctors (General Practice, Family Medicine, Internal Medicine)

## Frontend Integration

The backend now fully supports the frontend `BookAppointment.jsx` component:

### API Endpoints Used by Frontend:

1. **GET `/api/appointments`** - Fetch existing appointments
2. **POST `/api/appointments`** - Book new appointment
3. **PUT `/api/appointments/{id}`** - Update appointment
4. **PUT `/api/appointments/{id}/postpone`** - Postpone appointment
5. **DELETE `/api/appointments/{id}`** - Cancel appointment
6. **GET `/api/doctors`** - Get available doctors

### Request/Response Format:

#### Create Appointment (POST)
```json
{
  "doctor_id": 1,
  "patient_id": 1,
  "date": "2026-05-06",
  "time": "14:30",
  "reason": "General consultation",
  "symptoms": "Headache and fever"
}
```

#### Response Format
```json
{
  "id": 1,
  "patient_id": 1,
  "doctor_id": 1,
  "appointment_date": "2026-05-06",
  "appointment_time": "14:30",
  "reason": "General consultation",
  "symptoms": "Headache and fever",
  "status": "scheduled",
  "created_at": "2026-05-05T08:30:00.000000Z",
  "updated_at": "2026-05-05T08:30:00.000000Z",
  "doctor": {
    "id": 1,
    "name": "Dr. Sarah Johnson",
    "specialty": "Cardiology",
    "type": "specialist",
    "available": true,
    "category": "Cardiology"
  },
  "patient": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Setup Instructions

### 1. Run Migrations
```bash
cd backend
php artisan migrate
```

### 2. Seed Doctors Data
```bash
cd backend
php artisan db:seed --class=DoctorSeeder
```

### 3. Start Laravel Server
```bash
cd backend
php artisan serve
```

The server will start on `http://localhost:8000` and the appointment system will be fully functional.

## Features Implemented

### Validation
- Doctor availability check
- Time slot conflict detection
- Date validation (no past dates)
- Required field validation

### Business Logic
- Prevent double booking same time slot
- Doctor availability status
- Appointment status management
- Patient and doctor relationships

### Error Handling
- Comprehensive validation errors
- Proper HTTP status codes
- User-friendly error messages
- Exception handling

## Security Considerations

- Foreign key constraints ensure data integrity
- Input validation prevents invalid data
- Proper relationship loading prevents N+1 queries
- Status enum prevents invalid status values

## Testing

The system is ready to test with the frontend. The frontend component should be able to:
1. Load the list of doctors
2. Book new appointments
3. View existing appointments
4. Edit appointment details
5. Postpone appointments
6. Cancel appointments

All data will be properly stored in the database with the correct relationships.
