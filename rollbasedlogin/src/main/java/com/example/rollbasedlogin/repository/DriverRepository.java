package com.example.rollbasedlogin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.rollbasedlogin.model.Driver;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByCabTypeAndAvailable(String cabType, boolean available);
    java.util.Optional<Driver> findByEmail(String email);
}
