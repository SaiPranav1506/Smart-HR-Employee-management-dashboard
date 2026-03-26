package com.example.rollbasedlogin.controller;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.rollbasedlogin.model.FileUpload;
import com.example.rollbasedlogin.repository.FileUploadRepository;
import com.example.rollbasedlogin.util.JwtUtil;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileUploadController {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    private static final Set<String> ALLOWED_TYPES = Set.of(
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        // Images
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Archives
        "application/zip",
        "application/x-rar-compressed",
        // Code/config
        "application/json",
        "application/xml",
        "text/xml"
    );

    @Autowired
    private FileUploadRepository fileRepo;

    @Autowired
    private JwtUtil jwtUtil;

    private String getEmailFromAuthHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                return jwtUtil.getEmailFromToken(token);
            }
        }
        return null;
    }

    /**
     * POST /api/files/upload
     * Upload a file (multipart)
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file) {

        String email = getEmailFromAuthHeader(authHeader);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body("File too large. Maximum size is 10 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body("File type not allowed: " + contentType);
        }

        try {
            FileUpload upload = new FileUpload();
            upload.setOwnerEmail(email);
            upload.setFileName(sanitizeFileName(file.getOriginalFilename()));
            upload.setFileType(contentType);
            upload.setFileSize(file.getSize());
            upload.setUploadedAt(LocalDateTime.now().toString());
            upload.setFileData(Base64.getEncoder().encodeToString(file.getBytes()));

            fileRepo.save(upload);

            Map<String, Object> response = new HashMap<>();
            response.put("id", upload.getId());
            response.put("fileName", upload.getFileName());
            response.put("fileType", upload.getFileType());
            response.put("fileSize", upload.getFileSize());
            response.put("uploadedAt", upload.getUploadedAt());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * GET /api/files/my-files
     * List all files for the authenticated user (without fileData for performance)
     */
    @GetMapping("/my-files")
    public ResponseEntity<?> myFiles(@RequestHeader("Authorization") String authHeader) {
        String email = getEmailFromAuthHeader(authHeader);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        List<Map<String, Object>> files = fileRepo.findByOwnerEmailOrderByIdDesc(email)
                .stream()
                .map(f -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", f.getId());
                    m.put("fileName", f.getFileName());
                    m.put("fileType", f.getFileType());
                    m.put("fileSize", f.getFileSize());
                    m.put("uploadedAt", f.getUploadedAt());
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(files);
    }

    /**
     * GET /api/files/download/{id}
     * Download a file by ID (only owner can download)
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadFile(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {

        String email = getEmailFromAuthHeader(authHeader);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        Optional<FileUpload> opt = fileRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found");
        }

        FileUpload file = opt.get();
        if (!file.getOwnerEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        byte[] data = Base64.getDecoder().decode(file.getFileData());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(file.getFileType()))
                .contentLength(data.length)
                .body(data);
    }

    /**
     * DELETE /api/files/{id}
     * Delete a file (only owner can delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {

        String email = getEmailFromAuthHeader(authHeader);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        Optional<FileUpload> opt = fileRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found");
        }

        FileUpload file = opt.get();
        if (!file.getOwnerEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        fileRepo.delete(file);
        return ResponseEntity.ok("File deleted");
    }

    private static String sanitizeFileName(String name) {
        if (name == null) return "file";
        // Keep only safe characters
        return name.replaceAll("[^a-zA-Z0-9._\\-()]", "_");
    }
}
