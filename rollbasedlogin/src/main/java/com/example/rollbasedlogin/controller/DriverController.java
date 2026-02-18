package com.example.rollbasedlogin.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.model.Booking;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.Notification;
import com.example.rollbasedlogin.repository.BookingRepository;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.NotificationRepository;
import com.example.rollbasedlogin.util.JwtUtil;

@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private BookingRepository bookingRepo;

    @Autowired
    private DriverRepository driverRepo;

    @Autowired
    private NotificationRepository notificationRepo;

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
    public ResponseEntity<String> acceptTrip(@PathVariable Long bookingId, @RequestParam String email) {
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

        // Mark driver as unavailable
        driver.setAvailable(false);
        driverRepo.save(driver);

        // Notify HR that a driver accepted
        if (booking.getHrEmail() != null && !booking.getHrEmail().isBlank()) {
            Notification n = new Notification();
            n.setHrEmail(booking.getHrEmail());
            n.setCreatedAt(java.time.LocalDateTime.now().toString());
            n.setMessage("Driver " + email + " accepted booking #" + bookingId);
            n.setReadFlag(false);
            notificationRepo.save(n);
        }

        return ResponseEntity.ok("Trip accepted");
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


}
