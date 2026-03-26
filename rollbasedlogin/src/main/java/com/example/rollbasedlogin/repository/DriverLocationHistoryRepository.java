package com.example.rollbasedlogin.repository;

import com.example.rollbasedlogin.model.DriverLocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverLocationHistoryRepository extends JpaRepository<DriverLocationHistory, Long> {
    List<DriverLocationHistory> findByDriverEmailOrderByTimestampDesc(String driverEmail);
    Optional<DriverLocationHistory> findFirstByDriverEmailOrderByTimestampDesc(String driverEmail);
}
