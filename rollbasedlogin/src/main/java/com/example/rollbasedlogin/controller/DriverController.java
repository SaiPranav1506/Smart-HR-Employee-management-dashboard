package com.example.rollbasedlogin.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.model.Booking;
import com.example.rollbasedlogin.model.ChatMessage;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.Notification;
import com.example.rollbasedlogin.model.OtpTrip;
import com.example.rollbasedlogin.model.User;
import com.example.rollbasedlogin.repository.BookingRepository;
import com.example.rollbasedlogin.repository.ChatMessageRepository;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.NotificationRepository;
import com.example.rollbasedlogin.repository.UserRepository;
import com.example.rollbasedlogin.service.OtpService;
import com.example.rollbasedlogin.service.TwilioService;
import com.example.rollbasedlogin.util.JwtUtil;

@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private BookingRepository bookingRepo;

    @Autowired
    private ChatMessageRepository chatMessageRepo;

    @Autowired
    private DriverRepository driverRepo;

    @Autowired
    private NotificationRepository notificationRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private OtpService otpService;

    @Autowired
    private TwilioService twilioService;

    @Autowired
    private JwtUtil jwtUtil;

    // Helper method to extract email from Authorization header
    private String getEmailFromAuthHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                return jwtUtil.getEmailFromToken(token);
            }
        }
        return null;
    }

    @GetMapping("/mytrips")
    public List<Booking> getDriverBookings(@RequestParam String email) {
        return bookingRepo.findByDriverEmail(email);
    }

    /**
     * GET assigned trips for the current driver (using JWT token)
     * Returns trips with status ASSIGNED or REQUESTED
     */
    @GetMapping("/assigned-trips")
    public ResponseEntity<?> getAssignedTrips(@RequestHeader("Authorization") String authHeader) {
        String driverEmail = getEmailFromAuthHeader(authHeader);
        if (driverEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        // Get trips assigned to this driver with status ASSIGNED
        List<Booking> assignedTrips = bookingRepo.findByDriverEmail(driverEmail).stream()
                .filter(b -> "ASSIGNED".equalsIgnoreCase(b.getStatus()))
                .toList();

        return ResponseEntity.ok(assignedTrips);
    }

    @GetMapping("/ride-requests")
    public ResponseEntity<?> getRideRequests(@RequestParam String email) {
        Optional<Driver> driverOpt = driverRepo.findByEmail(email);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Driver not found");
        }

        Driver driver = driverOpt.get();
        String cabType = driver.getCabType();
        if (cabType == null || cabType.isBlank()) {
            return ResponseEntity.ok(java.util.List.of());
        }

        // Show all pending requests for this driver's cab type.
        // (UI can decide whether to allow accepting based on availability.)
        List<Booking> requests = bookingRepo.findByStatusAndCabTypeOrderByIdDesc("REQUESTED", cabType);
        return ResponseEntity.ok(requests);
    }

    @PutMapping("/accept-trip/{bookingId}")
    public ResponseEntity<?> acceptTrip(@PathVariable Long bookingId, @RequestParam String email) {
        Optional<Driver> driverOpt = driverRepo.findByEmail(email);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Driver not found");
        }

        Driver driver = driverOpt.get();
        if (!driver.isAvailable()) {
            return ResponseEntity.status(409).body("Driver is not available");
        }

        if (bookingRepo.existsByDriverEmailAndStatus(email, "ASSIGNED")) {
            return ResponseEntity.status(409).body("Driver already has an assigned trip");
        }

        Optional<Booking> bookingOpt = bookingRepo.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Booking not found");
        }

        Booking booking = bookingOpt.get();
        if (!"REQUESTED".equalsIgnoreCase(booking.getStatus())) {
            return ResponseEntity.status(409).body("Booking is not available for acceptance");
        }

        String bookingCabType = booking.getCabType() == null ? "" : booking.getCabType();
        String driverCabType = driver.getCabType() == null ? "" : driver.getCabType();
        if (!bookingCabType.equalsIgnoreCase(driverCabType)) {
            return ResponseEntity.status(409).body("Cab type mismatch");
        }

        // Assign booking to this driver
        booking.setDriverEmail(email);
        booking.setStatus("ASSIGNED");
        bookingRepo.save(booking);

        // Mark driver as unavailable and sync phone number from User table
        driver.setAvailable(false);
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isPresent()) {
            driver.setPhoneNumber(userOpt.get().getPhoneNumber());
        }
        driverRepo.save(driver);

        // Generate and send OTP to BOTH employee and driver
        try {
            Optional<User> driverUserOpt = userRepo.findByEmail(email);
            Optional<User> employeeUserOpt = userRepo.findByEmail(booking.getEmployeeEmail());
            
            if (driverUserOpt.isEmpty()) {
                String errorMsg = "[ERROR] Driver not found in user records: " + email;
                System.out.println(errorMsg);
                return ResponseEntity.status(404).body(java.util.Map.of(
                    "success", false,
                    "message", "Driver not found in system",
                    "error", "DRIVER_NOT_FOUND"
                ));
            }
            
            if (employeeUserOpt.isEmpty()) {
                String errorMsg = "[ERROR] Employee not found in user records: " + booking.getEmployeeEmail();
                System.out.println(errorMsg);
                return ResponseEntity.status(404).body(java.util.Map.of(
                    "success", false,
                    "message", "Employee not found in system",
                    "error", "EMPLOYEE_NOT_FOUND"
                ));
            }
            
            User driverUser = driverUserOpt.get();
            User employeeUser = employeeUserOpt.get();
            String driverPhoneNumber = driverUser.getPhoneNumber();
            String employeePhoneNumber = employeeUser.getPhoneNumber();
            
            if (driverPhoneNumber == null || driverPhoneNumber.isBlank()) {
                String errorMsg = "[ERROR] Phone number not found for driver: " + email;
                System.out.println(errorMsg);
                return ResponseEntity.status(422).body(java.util.Map.of(
                    "success", false,
                    "message", "Cannot send OTP: Driver phone number is not configured.",
                    "error", "DRIVER_MISSING_PHONE"
                ));
            }
            
            if (employeePhoneNumber == null || employeePhoneNumber.isBlank()) {
                String errorMsg = "[ERROR] Phone number not found for employee: " + booking.getEmployeeEmail();
                System.out.println(errorMsg);
                return ResponseEntity.status(422).body(java.util.Map.of(
                    "success", false,
                    "message", "Cannot send OTP: Employee phone number is not configured.",
                    "error", "EMPLOYEE_MISSING_PHONE"
                ));
            }

            try {
                @SuppressWarnings("unused")
                OtpTrip otpTrip = otpService.generateAndSendOtpToEmployeeOnly(
                    bookingId,
                    booking.getEmployeeEmail(),
                    booking.getEmployeeName(),
                    employeePhoneNumber,
                    email
                );
                System.out.println("[SUCCESS] OTP sent to employee (" + booking.getEmployeeEmail() + ") for booking " + bookingId);
                
                // Send trip assignment notification to DRIVER
                try {
                    twilioService.sendTripAssignmentNotification(
                        driverPhoneNumber,
                        driver.getName(),
                        booking.getEmployeeName(),
                        booking.getPickupLocation(),
                        booking.getDestination()
                    );
                    System.out.println("[SUCCESS] Trip assignment notification sent to driver (" + email + ") for booking " + bookingId);
                } catch (Exception tripNotifyError) {
                    // Log error but don't fail the entire request (trip is already assigned)
                    System.err.println("[WARNING] Failed to send trip notification to driver: " + tripNotifyError.getMessage());
                }
            } catch (IllegalStateException e) {
                String errorMsg = "[ERROR] Twilio misconfiguration or disabled: " + e.getMessage();
                System.out.println(errorMsg);
                return ResponseEntity.status(503).body(java.util.Map.of(
                    "success", false,
                    "message", "OTP service is not properly configured. Please contact administrator.",
                    "error", "OTP_SERVICE_UNAVAILABLE",
                    "details", e.getMessage()
                ));
            } catch (Exception e) {
                String errorMsg = "[ERROR] Failed to send OTP: " + e.getMessage();
                System.out.println(errorMsg);
                return ResponseEntity.status(503).body(java.util.Map.of(
                    "success", false,
                    "message", "Failed to send OTP. Please try again.",
                    "error", "OTP_SEND_FAILED",
                    "details", e.getMessage()
                ));
            }
        } catch (Exception e) {
            String errorMsg = "[ERROR] Unexpected error while sending OTP: " + e.getMessage();
            System.out.println(errorMsg);
            return ResponseEntity.status(500).body(java.util.Map.of(
                "success", false,
                "message", "Unexpected error while processing OTP",
                "error", "INTERNAL_ERROR",
                "details", e.getMessage()
            ));
        }

        // Notify HR that a driver accepted
        if (booking.getHrEmail() != null && !booking.getHrEmail().isBlank()) {
            Notification n = new Notification();
            n.setHrEmail(booking.getHrEmail());
            n.setCreatedAt(java.time.LocalDateTime.now().toString());
            n.setMessage("Driver " + email + " accepted booking #" + bookingId + ". OTP sent to driver for verification.");
            n.setReadFlag(false);
            notificationRepo.save(n);
        }

        System.out.println("[TRIP-ASSIGNMENT] Driver " + email + " has been assigned to trip " + bookingId + 
                         " for employee " + booking.getEmployeeEmail());

        // Send assignment message to driver
        try {
            ChatMessage assignmentMsg = new ChatMessage();
            assignmentMsg.setSenderEmail("system@hr.internal");
            assignmentMsg.setSenderRole("system");
            assignmentMsg.setReceiverEmail(email);
            assignmentMsg.setReceiverRole("driver");
            assignmentMsg.setSubject("Trip Assignment Confirmation");
            assignmentMsg.setContent("🎉 You've been assigned to complete the trip successfully! \n\n" +
                                   "Employee: " + booking.getEmployeeName() + "\n" +
                                   "Pickup: " + booking.getPickup() + "\n" +
                                   "Drop: " + booking.getDropLocation() + "\n" +
                                   "Pickup Time: " + booking.getPickupTime() + "\n\n" +
                                   "Please verify your OTP to proceed with the trip.");
            assignmentMsg.setMessageType("SYSTEM_ASSIGNMENT");
            assignmentMsg.setTripId(bookingId);
            assignmentMsg.setCreatedAt(java.time.LocalDateTime.now().toString());
            assignmentMsg.setReadFlag(false);
            chatMessageRepo.save(assignmentMsg);
            System.out.println("[CHAT] Assignment message sent to driver: " + email);
        } catch (Exception e) {
            System.out.println("[CHAT-ERROR] Failed to send assignment message: " + e.getMessage());
            // Continue even if message fails - it's not critical
        }

        return ResponseEntity.ok(java.util.Map.of(
            "success", true,
            "message", "Trip accepted. OTP sent to your phone.",
            "bookingId", bookingId,
            "tripDetails", java.util.Map.of(
                "employeeEmail", booking.getEmployeeEmail(),
                "employeeName", booking.getEmployeeName(),
                "pickup", booking.getPickup(),
                "dropLocation", booking.getDropLocation(),
                "pickupTime", booking.getPickupTime()
            )
        ));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getDriverProfile(@RequestParam String email) {
        return driverRepo.findByEmail(email)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Driver not found"));
    }

    @PutMapping("/availability")
    public ResponseEntity<String> setAvailability(@RequestParam String email, @RequestParam boolean available) {
        Optional<Driver> driverOpt = driverRepo.findByEmail(email);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Driver not found");
        }

        if (available && bookingRepo.existsByDriverEmailAndStatus(email, "ASSIGNED")) {
            return ResponseEntity.status(409).body("Cannot set Available while a trip is assigned");
        }

        Driver driver = driverOpt.get();
        driver.setAvailable(available);
        driverRepo.save(driver);
        return ResponseEntity.ok("Availability updated");
    }

    /**
     * Start trip after OTP verification
     * PUT /api/driver/start-trip/{bookingId}
     * Only starts the trip if OTP is verified
     */
    @PutMapping("/start-trip/{bookingId}")
    public ResponseEntity<?> startTrip(@PathVariable Long bookingId) {
        try {
            Optional<Booking> bookingOpt = bookingRepo.findById(bookingId);
            if (bookingOpt.isEmpty()) {
                return ResponseEntity.status(404).body(java.util.Map.of(
                    "success", false,
                    "message", "Booking not found"
                ));
            }

            Booking booking = bookingOpt.get();

            // Check if OTP is verified
            if (!otpService.isOtpVerified(bookingId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of(
                    "success", false,
                    "message", "OTP verification required before starting the trip"
                ));
            }

            // Check status
            if (!"ASSIGNED".equalsIgnoreCase(booking.getStatus())) {
                return ResponseEntity.status(409).body(java.util.Map.of(
                    "success", false,
                    "message", "Trip is not in ASSIGNED status"
                ));
            }

            // START IN PROGRESS
            booking.setStatus("IN_PROGRESS");
            bookingRepo.save(booking);

            // Notify HR
            if (booking.getHrEmail() != null && !booking.getHrEmail().isBlank()) {
                Notification n = new Notification();
                n.setHrEmail(booking.getHrEmail());
                n.setCreatedAt(java.time.LocalDateTime.now().toString());
                n.setMessage("Trip booking #" + bookingId + " has started. Driver: " + booking.getDriverEmail());
                n.setReadFlag(false);
                notificationRepo.save(n);
            }

            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Trip started successfully",
                "bookingId", bookingId,
                "status", "IN_PROGRESS"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of(
                "success", false,
                "message", "Error starting trip: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/complete-trip/{bookingId}")
    public ResponseEntity<String> completeTrip(@PathVariable Long bookingId) {
        Optional<Booking> optional = bookingRepo.findById(bookingId);
        if (optional.isPresent()) {
            Booking booking = optional.get();
            booking.setStatus("COMPLETED");
            bookingRepo.save(booking);

            // Make driver available again
            String driverEmail = booking.getDriverEmail();
            if (driverEmail != null) {
                driverRepo.findByEmail(driverEmail).ifPresent(driver -> {
                    driver.setAvailable(true);
                    driverRepo.save(driver);
                });
            }

            if (booking.getHrEmail() != null && !booking.getHrEmail().isBlank()) {
                Notification n = new Notification();
                n.setHrEmail(booking.getHrEmail());
                n.setCreatedAt(java.time.LocalDateTime.now().toString());
                n.setMessage("Driver " + (driverEmail == null ? "(unknown)" : driverEmail) + " completed trip booking #" + bookingId);
                n.setReadFlag(false);
                notificationRepo.save(n);
            }

            return ResponseEntity.ok("Trip marked as completed");
        } else {
            return ResponseEntity.status(404).body("Booking not found");
        }
    }

    /**
     * POST /api/driver/verify-otp/{bookingId}
     * Driver verifies the OTP received on their phone
     * Body: { "otpCode": "123456" }
     */
    @PostMapping("/verify-otp/{bookingId}")
    public ResponseEntity<?> verifyDriverOtp(
            @PathVariable Long bookingId,
            @RequestBody java.util.Map<String, String> request) {
        try {
            String otpCode = request.get("otpCode");
            if (otpCode == null || otpCode.isBlank()) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "OTP code is required"
                ));
            }

            boolean verified = otpService.verifyOtp(bookingId, otpCode);
            if (verified) {
                return ResponseEntity.ok(java.util.Map.of(
                    "success", true,
                    "message", "OTP verified successfully. You can now start the trip.",
                    "bookingId", bookingId
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(java.util.Map.of(
                    "success", false,
                    "message", "OTP verification failed"
                ));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(java.util.Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(java.util.Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of(
                "success", false,
                "message", "Error verifying OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * GET /api/driver/otp-status/{bookingId}
     * Check if OTP is verified for a booking
     */
    @GetMapping("/otp-status/{bookingId}")
    public ResponseEntity<?> getOtpStatus(@PathVariable Long bookingId) {
        try {
            boolean isVerified = otpService.isOtpVerified(bookingId);
            return ResponseEntity.ok(java.util.Map.of(
                "bookingId", bookingId,
                "otpVerified", isVerified
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of(
                "success", false,
                "message", "Error checking OTP status: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/driver/resend-otp/{bookingId}
     * Resend OTP to employee's phone
     */
    @PostMapping("/resend-otp/{bookingId}")
    public ResponseEntity<?> resendDriverOtp(
            @PathVariable Long bookingId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String driverEmail = getEmailFromAuthHeader(authHeader);
            if (driverEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            Optional<Booking> bookingOpt = bookingRepo.findById(bookingId);
            if (bookingOpt.isEmpty()) {
                return ResponseEntity.status(404).body(java.util.Map.of(
                    "success", false,
                    "message", "Booking not found"
                ));
            }

            Booking booking = bookingOpt.get();
            
            // Verify driver owns this booking
            if (!booking.getDriverEmail().equals(driverEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of(
                    "success", false,
                    "message", "You are not assigned to this trip"
                ));
            }

            // Get employee's phone number (to resend OTP to employee)
            Optional<User> employeeUserOpt = userRepo.findByEmail(booking.getEmployeeEmail());
            if (employeeUserOpt.isEmpty() || employeeUserOpt.get().getPhoneNumber() == null) {
                return ResponseEntity.status(422).body(java.util.Map.of(
                    "success", false,
                    "message", "Employee phone number not found"
                ));
            }

            String employeePhoneNumber = employeeUserOpt.get().getPhoneNumber();
            @SuppressWarnings("unused")
            OtpTrip otpTrip = otpService.resendOtp(bookingId, employeePhoneNumber, booking.getEmployeeName());

            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "OTP resent to your phone",
                "bookingId", bookingId
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(java.util.Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of(
                "success", false,
                "message", "Error resending OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * DEBUG ENDPOINT: Check phone numbers for a given email
     * GET /api/driver/debug/phone-numbers?email=user@example.com
     */
    @GetMapping("/debug/phone-numbers")
    public ResponseEntity<?> debugPhoneNumbers(@RequestParam String email) {
        Optional<User> userOpt = userRepo.findByEmail(email);
        Optional<Driver> driverOpt = driverRepo.findByEmail(email);
        
        java.util.Map<String, Object> debug = new java.util.HashMap<>();
        debug.put("email", email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            debug.put("userFound", true);
            debug.put("userPhone", user.getPhoneNumber());
            debug.put("userCountry", user.getCountry());
        } else {
            debug.put("userFound", false);
            debug.put("userPhone", null);
        }
        
        if (driverOpt.isPresent()) {
            Driver driver = driverOpt.get();
            debug.put("driverFound", true);
            debug.put("driverPhone", driver.getPhoneNumber());
            debug.put("driverName", driver.getName());
        } else {
            debug.put("driverFound", false);
            debug.put("driverPhone", null);
        }
        
        return ResponseEntity.ok(debug);
    }
}
