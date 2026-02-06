package com.example.rollbasedlogin.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.model.Booking;
import com.example.rollbasedlogin.model.Notification;
import com.example.rollbasedlogin.model.WorkAssignment;
import com.example.rollbasedlogin.repository.BookingRepository;
import com.example.rollbasedlogin.repository.NotificationRepository;
import com.example.rollbasedlogin.repository.WorkAssignmentRepository;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private WorkAssignmentRepository workRepo;

    @Autowired
    private BookingRepository bookingRepo;

    @Autowired
    private NotificationRepository notificationRepo;

    @GetMapping("/my-work")
    public List<WorkAssignment> myWork(@RequestParam String email) {
        return workRepo.findByEmployeeEmailOrderByIdDesc(email);
    }

    @GetMapping("/my-bookings")
    public List<Booking> myBookings(@RequestParam String email) {
        return bookingRepo.findByEmployeeEmail(email);
    }

    @PutMapping("/complete-work")
    public org.springframework.http.ResponseEntity<String> completeWork(@RequestParam Long assignmentId, @RequestParam String employeeEmail) {
        return workRepo.findById(assignmentId)
                .map(a -> {
                    if (a.getEmployeeEmail() == null || !a.getEmployeeEmail().equalsIgnoreCase(employeeEmail)) {
                        return org.springframework.http.ResponseEntity.status(403).body("Not allowed");
                    }
                    a.setStatus("DONE");
                    workRepo.save(a);

                    Notification n = new Notification();
                    n.setHrEmail(a.getHrEmail());
                    n.setCreatedAt(java.time.LocalDateTime.now().toString());
                    n.setMessage("Employee " + employeeEmail + " completed work: " + (a.getTitle() == null ? "(no title)" : a.getTitle()));
                    n.setReadFlag(false);
                    notificationRepo.save(n);

                    return org.springframework.http.ResponseEntity.ok("Work marked as completed");
                })
                .orElseGet(() -> org.springframework.http.ResponseEntity.status(404).body("Assignment not found"));
    }
}
