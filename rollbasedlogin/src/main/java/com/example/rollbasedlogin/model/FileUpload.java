package com.example.rollbasedlogin.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "file_uploads")
public class FileUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ownerEmail;

    private String fileName;

    private String fileType;

    private Long fileSize;

    private String uploadedAt;

    // Store as base64 in DB (suitable for small-medium files on Supabase free tier)
    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String fileData;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(String uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getFileData() { return fileData; }
    public void setFileData(String fileData) { this.fileData = fileData; }
}
