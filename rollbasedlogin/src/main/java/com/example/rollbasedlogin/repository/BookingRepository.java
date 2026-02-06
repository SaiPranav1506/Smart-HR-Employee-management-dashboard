package com.example.rollbasedlogin.repository;



import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.rollbasedlogin.model.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByHrEmail(String hrEmail);
    List<Booking> findByDriverEmail(String driverEmail);
    List<Booking> findByEmployeeEmail(String employeeEmail);

    boolean existsByDriverEmailAndStatus(String driverEmail, String status);
}
