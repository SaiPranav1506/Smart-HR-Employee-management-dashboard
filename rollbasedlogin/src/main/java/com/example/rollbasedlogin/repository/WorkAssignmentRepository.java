package com.example.rollbasedlogin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.rollbasedlogin.model.WorkAssignment;

public interface WorkAssignmentRepository extends JpaRepository<WorkAssignment, Long> {
    List<WorkAssignment> findByHrEmail(String hrEmail);
    List<WorkAssignment> findByEmployeeEmail(String employeeEmail);

    List<WorkAssignment> findByHrEmailOrderByIdDesc(String hrEmail);
    List<WorkAssignment> findByEmployeeEmailOrderByIdDesc(String employeeEmail);
}
