package com.example.rollbasedlogin.repository;


import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.rollbasedlogin.model.User;


public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByPhoneNumber(String phoneNumber);

    List<User> findByRoleIgnoreCaseOrderByUsernameAsc(String role);

    List<User> findByRoleIgnoreCaseAndHrEmailIgnoreCaseOrderByUsernameAsc(String role, String hrEmail);
}
