package com.example.rollbasedlogin.controller;



import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.dto.EmployeeSummary;
import com.example.rollbasedlogin.model.Booking;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.Notification;
import com.example.rollbasedlogin.model.WorkAssignment;
import com.example.rollbasedlogin.repository.BookingRepository;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.NotificationRepository;
import com.example.rollbasedlogin.repository.UserRepository;
import com.example.rollbasedlogin.repository.WorkAssignmentRepository;

@RestController
@RequestMapping("/api/hr")
@CrossOrigin(origins = "*")
public class HRController {

  @Autowired
private DriverRepository driverRepo;

@Autowired
private BookingRepository bookingRepo;

@Autowired
private WorkAssignmentRepository workRepo;

@Autowired
private NotificationRepository notificationRepo;

@Autowired
private UserRepository userRepo;

@PostMapping("/book")
public String bookCab(@RequestBody Booking booking) {
    booking.setBookingDate(LocalDate.now().toString());
    booking.setStatus("BOOKED");

    // 🔍 Try to auto-assign driver
    List<Driver> drivers = driverRepo.findByCabTypeAndAvailable(booking.getCabType(), true);
    if (!drivers.isEmpty()) {
        Driver assignedDriver = drivers.get(0); // Pick first available
        booking.setDriverEmail(assignedDriver.getEmail());
        booking.setStatus("ASSIGNED");

        // Mark driver as unavailable
        assignedDriver.setAvailable(false);
        driverRepo.save(assignedDriver);
    }

    bookingRepo.save(booking);
    if (booking.getDriverEmail() != null && !booking.getDriverEmail().isBlank()) {
        return "Booking Successful! Driver assigned: " + booking.getDriverEmail();
    }
    return "Booking Successful! No driver available right now.";
}

@PostMapping("/assign-work")
public String assignWork(@RequestBody WorkAssignment assignment) {
    assignment.setAssignedDate(LocalDate.now().toString());
    if (assignment.getStatus() == null || assignment.getStatus().isBlank()) {
        assignment.setStatus("ASSIGNED");
    }
    workRepo.save(assignment);
    return "Work assigned successfully";
}

@GetMapping("/my-assignments")
public List<WorkAssignment> getAssignmentsByHr(@RequestParam String email) {
    return workRepo.findByHrEmailOrderByIdDesc(email);
}

@GetMapping("/notifications")
public List<Notification> getNotifications(@RequestParam String email) {
    return notificationRepo.findByHrEmailOrderByIdDesc(email);
}

@GetMapping("/notifications/unread-count")
public long unreadCount(@RequestParam String email) {
    return notificationRepo.countByHrEmailAndReadFlagFalse(email);
}

@org.springframework.web.bind.annotation.PutMapping("/notifications/{id}/read")
public org.springframework.http.ResponseEntity<String> markRead(@org.springframework.web.bind.annotation.PathVariable Long id) {
    return notificationRepo.findById(id)
            .map(n -> {
                n.setReadFlag(true);
                notificationRepo.save(n);
                return org.springframework.http.ResponseEntity.ok("Marked as read");
            })
            .orElseGet(() -> org.springframework.http.ResponseEntity.status(404).body("Notification not found"));
}



    @GetMapping("/mybookings")
    public java.util.List<Booking> getHRBookings(@RequestParam String email) {
        return bookingRepo.findByHrEmail(email);
    }



    @GetMapping("/my-employees")
    public List<EmployeeSummary> myEmployees(@RequestParam String email) {
        Set<String> employeeEmails = new HashSet<>();

        List<WorkAssignment> assignments = workRepo.findByHrEmail(email);
        for (WorkAssignment a : assignments) {
            if (a.getEmployeeEmail() != null && !a.getEmployeeEmail().isBlank()) {
                employeeEmails.add(a.getEmployeeEmail().trim());
            }
        }

        List<Booking> bookings = bookingRepo.findByHrEmail(email);
        for (Booking b : bookings) {
            if (b.getEmployeeEmail() != null && !b.getEmployeeEmail().isBlank()) {
                employeeEmails.add(b.getEmployeeEmail().trim());
            }
        }

        List<String> sortedEmails = new ArrayList<>(employeeEmails);
        sortedEmails.sort(String.CASE_INSENSITIVE_ORDER);

        List<EmployeeSummary> result = new ArrayList<>();
        for (String employeeEmail : sortedEmails) {
            String username = userRepo.findByEmail(employeeEmail)
                    .map(u -> u.getUsername())
                    .orElse(null);
            result.add(new EmployeeSummary(employeeEmail, username));
        }

        result.sort(Comparator.<EmployeeSummary, String>comparing(
            e -> (e.getUsername() == null ? "" : e.getUsername()),
            String.CASE_INSENSITIVE_ORDER
        ).thenComparing(EmployeeSummary::getEmail, String.CASE_INSENSITIVE_ORDER));

        return result;
    }




}
