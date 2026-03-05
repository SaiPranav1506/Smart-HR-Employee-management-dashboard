package com.example.rollbasedlogin.repository;

import com.example.rollbasedlogin.model.OtpTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface OtpTripRepository extends JpaRepository<OtpTrip, Long> {
    Optional<OtpTrip> findByBookingIdAndVerifiedFalse(Long bookingId);
    Optional<OtpTrip> findByBookingId(Long bookingId);
    List<OtpTrip> findByDriverEmail(String driverEmail);
    List<OtpTrip> findByEmployeeEmail(String employeeEmail);
}
