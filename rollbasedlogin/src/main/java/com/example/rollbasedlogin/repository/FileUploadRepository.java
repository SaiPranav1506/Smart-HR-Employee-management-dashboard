package com.example.rollbasedlogin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.rollbasedlogin.model.FileUpload;

public interface FileUploadRepository extends JpaRepository<FileUpload, Long> {
    List<FileUpload> findByOwnerEmailOrderByIdDesc(String ownerEmail);
}
