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
import com.example.rollbasedlogin.model.ChatMessage;
import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.Notification;
import com.example.rollbasedlogin.model.WorkAssignment;
import com.example.rollbasedlogin.repository.BookingRepository;
import com.example.rollbasedlogin.repository.ChatMessageRepository;
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

@Autowired
private ChatMessageRepository chatRepo;

@PostMapping("/book")
public String bookCab(@RequestBody Booking booking) {
    booking.setBookingDate(LocalDate.now().toString());
    // Driver should accept the ride (no auto assignment)
    booking.setStatus("REQUESTED");
    booking.setDriverEmail(null);

    // Notify employee (optional): request created and pending driver acceptance
    if (booking.getEmployeeEmail() != null && !booking.getEmployeeEmail().isBlank()) {
        ChatMessage msg = new ChatMessage();
        msg.setSenderEmail(booking.getHrEmail() == null ? "hr" : booking.getHrEmail());
        msg.setSenderRole("hr");
        msg.setReceiverEmail(booking.getEmployeeEmail());
        msg.setReceiverRole("employee");
        msg.setSubject("Cab requested");
        String pickup = booking.getPickup() == null ? "(pickup not set)" : booking.getPickup();
        String time = booking.getPickupTime() == null ? "(time not set)" : booking.getPickupTime();
        msg.setContent(
            "A cab has been requested for you. Waiting for a driver to accept. " +
            "Pickup: " + pickup + ", Time: " + time + ", Cab Type: " + booking.getCabType()
        );
        msg.setMessageType("CAB_REQUESTED");
        msg.setCreatedAt(java.time.LocalDateTime.now().toString());
        msg.setReadFlag(false);
        chatRepo.save(msg);
    }

    bookingRepo.save(booking);
    if (booking.getDriverEmail() != null && !booking.getDriverEmail().isBlank()) {
        return "Booking Successful! Driver assigned: " + booking.getDriverEmail();
    }
    return "Booking Successful! Waiting for driver acceptance.";
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

        // Primary source: employees explicitly registered under this HR.
        List<com.example.rollbasedlogin.model.User> registeredEmployees = userRepo
                .findByRoleIgnoreCaseAndHrEmailIgnoreCaseOrderByUsernameAsc("employee", email);
        for (com.example.rollbasedlogin.model.User u : registeredEmployees) {
            if (u.getEmail() != null && !u.getEmail().isBlank()) {
                employeeEmails.add(u.getEmail().trim());
            }
        }

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
