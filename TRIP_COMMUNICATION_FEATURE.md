# Trip Communication & Directions Feature - Implementation Summary

## Overview
This document outlines the new **Trip Communication & Directions** feature that has been added to the Smart HR Employee Management Dashboard. This feature enables real-time messaging between drivers and employees/HR regarding specific trips, including directions, pickup instructions, and trip updates.

---

## Features Added

### 1. **Driver-to-Employee Messaging**
- Drivers can send messages and replies to employees whose trips they are assigned to
- Supports different message types: GENERAL, TRIP_UPDATE, DIRECTION_REQUEST, DELAY_ALERT
- Messages are linked to specific trips/bookings
- Real-time notifications via WebSocket

### 2. **HR/Employee-to-Driver Directions**
- HR and employees can send pickup instructions, route updates, and general messages to assigned drivers
- Support for multiple direction types: TRIP_DIRECTION, PICKUP_INSTRUCTIONS, ROUTE_UPDATE, GENERAL
- Real-time message delivery
- Unread message indicators

### 3. **Trip-Specific Conversation**
- All messages for a specific trip are grouped together
- Conversation history shows sender, timestamp, and message content
- Messages are marked as read/unread for tracking
- Supports collapsible UI for better organization

---

## Backend Changes

### Database Model Updates
**File**: `rollbasedlogin/src/main/java/com/example/rollbasedlogin/model/ChatMessage.java`
- Added `Long tripId` field to link messages to specific bookings/trips
- Added getter/setter for `tripId`

### Repository Updates
**File**: `rollbasedlogin/src/main/java/com/example/rollbasedlogin/repository/ChatMessageRepository.java`
- Added `findByTripId(Long tripId)` - Retrieve all messages for a specific trip
- Added `findTripConversation(Long tripId, String sender, String receiver)` - Get conversation between two parties for a specific trip

### Controller Updates

#### ChatController
**File**: `rollbasedlogin/src/main/java/com/example/rollbasedlogin/controller/ChatController.java`

New Endpoints:
1. **GET** `/api/chat/trip/{tripId}/messages`
   - Retrieves all messages for a specific trip
   - Filtered to only show messages involving the current user
   - Required: Authorization bearer token

2. **POST** `/api/chat/trip/{tripId}/send`
   - Send a message for a specific trip
   - Supports message types: TRIP_DIRECTION, GENERAL, etc.
   - Publishes to WebSocket topics for real-time delivery
   - Required: Authorization bearer token, trip ID, receiver email/role

3. **GET** `/api/chat/driver/trips-with-messages`
   - Get driver's assigned trips with unread message counts
   - Used for dashboard display
   - Required: Authorization bearer token

4. **PUT** `/api/chat/trip/{tripId}/message/{messageId}/read`
   - Mark a message as read
   - Updates readFlag in database
   - Required: Authorization bearer token

#### DriverController
**File**: `rollbasedlogin/src/main/java/com/example/rollbasedlogin/controller/DriverController.java`

New Endpoints:
1. **GET** `/api/driver/assigned-trips`
   - Retrieve all ASSIGNED trips for the current driver
   - Uses JWT token from Authorization header
   - Returns list of Booking objects with employee details
   - Required: Authorization bearer token

---

## Frontend Changes

### New Components

#### 1. TripCommunication.jsx
**Location**: `role-based-login-frontend/src/components/driver/TripCommunication.jsx`

- **Purpose**: Display trip details and enable driver-to-employee messaging
- **Props**:
  - `tripId`: Booking ID
  - `employeeEmail`: Email of employee/passenger
  - `employeeName`: Name of employee
  - `pickup`: Pickup location
  - `dropLocation`: Destination
  - `pickupTime`: Scheduled pickup time

- **Features**:
  - Collapsible message thread
  - Message history with timestamps
  - Real-time message sending
  - Message type selector (GENERAL, TRIP_UPDATE, DIRECTION_REQUEST, DELAY_ALERT)
  - Unread message counter and indicator
  - 5-second polling for new messages
  - Auto-mark as read on click

#### 2. SendDirections.jsx
**Location**: `role-based-login-frontend/src/components/employee/SendDirections.jsx`

- **Purpose**: Allow HR/Employees to send directions and messages to drivers
- **Props**:
  - `tripId`: Booking ID
  - `driverEmail`: Email of assigned driver
  - `driverName`: Name of driver
  - `employeeEmail`: Email of employee making the request
  - `pickup`: Pickup location
  - `dropLocation`: Destination

- **Features**:
  - Message type selector (TRIP_DIRECTION, PICKUP_INSTRUCTIONS, ROUTE_UPDATE, GENERAL)
  - Multi-line message input (textarea)
  - Message history with conversation context
  - Unread reply indicators
  - Automatic message polling
  - Mark as read functionality

### Updated Components

#### 1. DriverDashBoard.jsx
**Location**: `role-based-login-frontend/src/components/DriverDashBoard.jsx`

Changes:
- Added import for TripCommunication component
- Added state for managing assigned trips
- Added useEffect to fetch driver's assigned trips from backend
- Added new section "Assigned Trips" displaying:
  - Count of assigned trips
  - TripCommunication component for each assigned trip
  - Loading indicator for trip fetching
  - "No trips" message when empty

#### 2. MyBookings.jsx
**Location**: `role-based-login-frontend/src/components/hr/MyBookings.jsx`

Changes:
- Replaced table layout with expandable card layout
- Added import for SendDirections component
- Each booking now displays in expandable card format with:
  - Employee name, pickup/drop locations
  - Pickup time, cab type, driver assigned
  - Status indicator with color coding
  - Conditional SendDirections component for assigned trips
  - Warning message if no driver assigned

#### 3. EmployeeDashboard.jsx
**Location**: `role-based-login-frontend/src/components/employee/EmployeeDashboard.jsx`

Changes:
- Replaced table layout with expandable card layout
- Added import for SendDirections component
- Each booking displayed in expandable card format with:
  - Pickup/drop locations, time, cab type
  - Driver assignment status
  - Status indicator with color coding
  - Conditional SendDirections component for assigned trips
  - Warning message if no driver assigned

---

## Message Types

### Trip-Specific Message Types
- `TRIP_DIRECTION` - Standard pickup/dropoff directions
- `PICKUP_INSTRUCTIONS` - Specific instructions for pickup location
- `ROUTE_UPDATE` - Updated route or alternate route information
- `TRIP_UPDATE` - General trip updates from driver
- `DIRECTION_REQUEST` - Driver requesting directions
- `DELAY_ALERT` - Driver alerting about delays
- `GENERAL` - General message

---

## API Response Examples

### Send Message (POST `/api/chat/trip/{tripId}/send`)
```json
{
  "id": 123,
  "senderEmail": "driver@example.com",
  "senderRole": "driver",
  "receiverEmail": "employee@example.com",
  "receiverRole": "employee",
  "subject": "Trip Update for Office to Airport",
  "content": "I'm 5 minutes away from your location",
  "messageType": "TRIP_UPDATE",
  "tripId": 45,
  "createdAt": "2026-02-15T10:30:00",
  "readFlag": false
}
```

### Get Trip Messages (GET `/api/chat/trip/{tripId}/messages`)
```json
[
  {
    "id": 120,
    "senderEmail": "employee@example.com",
    "senderRole": "employee",
    "receiverEmail": "driver@example.com",
    "receiverRole": "driver",
    "subject": "Directions for Trip",
    "content": "Please take the main highway, avoid local streets due to traffic",
    "messageType": "TRIP_DIRECTION",
    "tripId": 45,
    "createdAt": "2026-02-15T10:15:00",
    "readFlag": true
  },
  {
    "id": 123,
    "senderEmail": "driver@example.com",
    "senderRole": "driver",
    "receiverEmail": "employee@example.com",
    "receiverRole": "employee",
    "subject": "Trip Update for Office to Airport",
    "content": "I'm 5 minutes away from your location",
    "messageType": "TRIP_UPDATE",
    "tripId": 45,
    "createdAt": "2026-02-15T10:30:00",
    "readFlag": false
  }
]
```

### Get Driver's Assigned Trips (GET `/api/driver/assigned-trips`)
```json
[
  {
    "id": 45,
    "employeeName": "John Doe",
    "employeeEmail": "john@example.com",
    "pickup": "Office Building Downtown",
    "dropLocation": "Airport Terminal 1",
    "pickupTime": "10:00 AM",
    "cabType": "Sedan",
    "bookingDate": "2026-02-15",
    "status": "ASSIGNED",
    "hrEmail": "hr@example.com",
    "driverEmail": "driver@example.com"
  }
]
```

---

## User Workflows

### Driver Perspective
1. Driver logs into Driver Dashboard
2. "Assigned Trips" section shows all ASSIGNED trips
3. For each trip, driver can:
   - View passenger name, pickup/drop locations, and pickup time
   - Expand trip card to view messages from employee/HR
   - See message history with timestamps
   - Send replies about the trip status or request directions
   - Mark messages as read

### HR/Employee Perspective
1. HR views "My Bookings" or Employee views "My Cab Bookings"
2. Each booking displays in expandable format
3. Once driver is assigned, HR/Employee can:
   - Expand booking card
   - View conversation history with driver
   - Send pickup instructions or route updates
   - See driver's responses in real-time
   - Track which messages have been read by driver

---

## Technical Architecture

### Data Flow
```
Frontend (React) 
  ↓
REST API Endpoints 
  ↓
ChatController / DriverController
  ↓
ChatMessageRepository / BookingRepository
  ↓
Database (ChatMessage, Booking tables)
```

### Real-Time Communication
- Uses Spring WebSocket with SimpMessagingTemplate
- Messages published to topics:
  - `/topic/inbox.{email}` - Direct message inbox
  - `/topic/inbox.role.{role}` - Role-based inbox
  - `/topic/trip.{tripId}` - Trip-specific messages

### Message Polling
- Frontend components poll for new messages every 5 seconds
- Can be upgraded to WebSocket subscriptions for real-time updates

---

## Future Enhancements

1. **WebSocket Subscriptions**: Replace polling with persistent WebSocket connections
2. **Message Attachments**: Support for photos/documents (e.g., driver license, vehicle info)
3. **GPS Integration**: Real-time driver location tracking
4. **Voice/Video Calls**: Emergency calling between driver and employee
5. **Rating System**: Driver/employee ratings after trip completion
6. **Notification Badges**: Unread message indicators in main navigation
7. **Message Search**: Search through historical conversations
8. **Draft Messages**: Save draft messages that can be sent later
9. **Bulk Messaging**: Send same message to multiple drivers
10. **Message Templates**: Pre-defined messages for common scenarios

---

## Testing Checklist

- [ ] Driver can view assigned trips on Dashboard
- [ ] Driver can send message to employee for a trip
- [ ] Employee can view message from driver
- [ ] Employee can send directions to driver
- [ ] Driver receives directions in real-time
- [ ] Messages marked as read properly  
- [ ] Unread counters work correctly
- [ ] Collapsible UI expands/collapses properly
- [ ] Message types are properly categorized
- [ ] No driver message = "No trips" message displays
- [ ] No driver assigned = warning message displays
- [ ] HR can see all their bookings with messaging
- [ ] Timestamps display correctly
- [ ] Message sender/receiver colors differentiate properly

---

## Notes
- All messages are stored in the database for audit trail and history
- Messages are filtered based on user permissions (drivers only see their trips)
- JWT token validation ensures secure access
- WebSocket integrations require both frontend and backend to be running
