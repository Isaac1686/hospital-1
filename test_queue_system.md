# Queue System Testing Guide

## Overview
This document provides instructions for testing the age-based patient queue management system.

## Features Implemented

### Backend Queue Controller (`QueueController.php`)
- **Age-based prioritization**: Patients 50+ years get priority over younger patients
- **Queue management**: Automatic sorting by priority level and appointment time
- **Multiple views**: Single doctor queue and all-doctors queue views
- **Position tracking**: Real-time queue position and estimated wait time

### Frontend Queue Management (`QueueManagement.jsx`)
- **Real-time queue display**: Shows prioritized patient lists
- **Visual priority indicators**: Color-coded priority levels
- **Wait time estimation**: Calculates estimated wait times
- **Admin view**: Can view all doctor queues or individual queues

### Enhanced Appointment Booking
- **Queue position notification**: Shows queue position after booking
- **Priority level display**: Indicates if patient gets priority treatment

## Testing Scenarios

### 1. Basic Queue Functionality
1. Create appointments for patients of different ages (some 50+, some <50)
2. Navigate to Queue Management page
3. Verify patients 50+ appear first in queue
4. Check that queue positions are correctly numbered

### 2. Priority System Testing
1. Book appointment for 45-year-old patient
2. Book appointment for 55-year-old patient for same doctor/time
3. Verify 55-year-old appears before 45-year-old in queue
4. Check priority badges are correctly displayed

### 3. Queue Position Tracking
1. Book an appointment
2. Verify success message shows:
   - Queue position number
   - Priority level (Priority/Normal)
   - Estimated wait time

### 4. Multiple Doctor Queues
1. Book appointments with different doctors
2. Use admin view to see all queues
3. Verify each doctor has separate queue
4. Check patient counts are accurate

### 5. Date-based Filtering
1. Create appointments for different dates
2. Change date in queue management
3. Verify only relevant appointments show
4. Check queue updates correctly

## API Endpoints to Test

### Get Doctor Queue
```
GET /api/queue/doctor?doctor_id={id}&date={YYYY-MM-DD}
```

### Get All Queues
```
GET /api/queue/all?date={YYYY-MM-DD}
```

### Add to Queue (via appointment booking)
```
POST /api/appointments
```

### Get Patient Position
```
GET /api/queue/position?patient_id={id}&doctor_id={id}&date={YYYY-MM-DD}
```

## Expected Behavior

### Priority Rules
- **High Priority**: Age 50+ (shown in red, labeled "Priority (50+)")
- **Normal Priority**: Age <50 (shown in blue, labeled "Normal")

### Queue Ordering
1. High priority patients first (sorted by appointment time)
2. Normal priority patients after (sorted by appointment time)

### Wait Time Calculation
- 15 minutes per patient ahead in queue
- Formula: `(position - 1) * 15 minutes`

## Sample Test Data

### Priority Patients (50+)
- Patient A: Age 65, 9:00 AM appointment
- Patient B: Age 52, 9:30 AM appointment
- Patient C: Age 58, 8:30 AM appointment

### Normal Patients (<50)
- Patient D: Age 35, 8:00 AM appointment
- Patient E: Age 28, 9:15 AM appointment
- Patient F: Age 42, 10:00 AM appointment

### Expected Queue Order
1. Patient C (58 years, 8:30 AM) - Priority
2. Patient A (65 years, 9:00 AM) - Priority  
3. Patient B (52 years, 9:30 AM) - Priority
4. Patient D (35 years, 8:00 AM) - Normal
5. Patient E (28 years, 9:15 AM) - Normal
6. Patient F (42 years, 10:00 AM) - Normal

## Integration Points

### Appointment Booking Integration
- When booking appointments, the system should:
  - Automatically determine patient priority based on age
  - Add patient to appropriate queue
  - Return queue position information

### Doctor Dashboard Integration
- Doctors should be able to:
  - View their current queue
  - See patient priority levels
  - Track estimated wait times

### Admin Dashboard Integration
- Admins should be able to:
  - View all doctor queues
  - Monitor hospital-wide queue status
  - Analyze queue efficiency

## Performance Considerations
- Queue calculations are done in real-time
- Database queries are optimized with proper indexing
- Frontend updates are efficient with minimal re-renders

## Error Handling
- Invalid doctor/patient IDs return appropriate errors
- Missing required fields are validated
- Network errors are handled gracefully
- User feedback is provided for all actions

## Success Metrics
- Patients 50+ should consistently appear at queue front
- Wait time estimates should be reasonably accurate
- Queue updates should reflect changes immediately
- System should handle multiple concurrent users
