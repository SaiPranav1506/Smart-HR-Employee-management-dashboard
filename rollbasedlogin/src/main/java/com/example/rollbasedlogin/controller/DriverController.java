package com.example.rollbasedlogin.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.model.Booking;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.Notification;
import com.example.rollbasedlogin.repository.BookingRepository;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.NotificationRepository;

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

    @GetMapping("/mytrips")
    public List<Booking> getDriverBookings(@RequestParam String email) {
        return bookingRepo.findByDriverEmail(email);
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
