package com.example.rollbasedlogin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.rollbasedlogin.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByHrEmailOrderByIdDesc(String hrEmail);
    long countByHrEmailAndReadFlagFalse(String hrEmail);
}
