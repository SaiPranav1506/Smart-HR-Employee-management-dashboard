package com.example.rollbasedlogin.service;

import com.example.rollbasedlogin.model.OtpTrip;
import com.example.rollbasedlogin.repository.OtpTripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.security.SecureRandom;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    @Autowired
    private OtpTripRepository otpTripRepo;

    @Autowired
    private TwilioService twilioService;

    @Value("${app.otp.ttl-seconds:600}")
    private long otpTtlSeconds;

    @Value("${app.otp.max-attempts:3}")
    private int maxAttempts;

    private final SecureRandom random = new SecureRandom();

    /**
     * Generate and send OTP for a ride to BOTH employee and driver
     */
    public OtpTrip generateAndSendOtpToMultiple(Long bookingId, String employeeEmail, String employeeName,
                                                 String employeePhone, String driverEmail, String driverName,
                                                 String driverPhone) {
        // Validate both phone numbers
        if (employeePhone == null || employeePhone.isBlank()) {
            log.error("[OTP] Cannot generate OTP: Employee phone number is empty");
            throw new IllegalArgumentException("Employee phone number is required to send OTP");
        }
        if (driverPhone == null || driverPhone.isBlank()) {
            log.error("[OTP] Cannot generate OTP: Driver phone number is empty");
            throw new IllegalArgumentException("Driver phone number is required to send OTP");
        }

        // Check if OTP already exists for this booking
        if (otpTripRepo.findByBookingIdAndVerifiedFalse(bookingId).isPresent()) {
            log.warn("[OTP] OTP already exists for booking {}", bookingId);
            throw new IllegalStateException("OTP already generated for this trip");
        }

        // Generate 6-digit OTP
        String otpCode = generateSixDigitOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(otpTtlSeconds);

        // Create OTP record
        OtpTrip otpTrip = new OtpTrip(bookingId, employeeEmail, driverEmail, otpCode, expiresAt);
        otpTrip.setCreatedAt(LocalDateTime.now());
        otpTripRepo.save(otpTrip);

        // Send OTP via SMS to BOTH employee and driver
        try {
            // Send to Employee
            log.info("[OTP] Attempting to send OTP to employee {} at {}", employeeEmail, employeePhone);
            twilioService.sendOtpSmsWithName(employeePhone, otpCode, employeeName);
            log.info("[OTP] OTP sent successfully to employee {} for booking {}", employeeEmail, bookingId);

            // Send to Driver
            log.info("[OTP] Attempting to send OTP to driver {} at {}", driverEmail, driverPhone);
            twilioService.sendOtpSmsWithName(driverPhone, otpCode, driverName);
            log.info("[OTP] OTP sent successfully to driver {} for booking {}", driverEmail, bookingId);
            
            log.info("[OTP] OTP successfully sent to both employee and driver for booking {}", bookingId);
        } catch (IllegalStateException e) {
            // Twilio not configured - this is a configuration error
            log.error("[OTP] Twilio configuration error for booking {}: {}", bookingId, e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            // Invalid phone number
            log.error("[OTP] Invalid phone number for booking {}: {}", bookingId, e.getMessage());
            throw e;
        } catch (Exception e) {
            // SMS sending failed
            log.error("[OTP] Failed to send SMS for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP via SMS: " + e.getMessage(), e);
        }

        return otpTrip;
    }

    /**
     * Generate and send OTP to EMPLOYEE ONLY (for verification)
     */
    public OtpTrip generateAndSendOtpToEmployeeOnly(Long bookingId, String employeeEmail, String employeeName,
                                                     String employeePhone, String driverEmail) {
        // Validate employee phone
        if (employeePhone == null || employeePhone.isBlank()) {
            log.error("[OTP] Cannot generate OTP: Employee phone number is empty");
            throw new IllegalArgumentException("Employee phone number is required to send OTP");
        }

        // Check if OTP already exists for this booking
        if (otpTripRepo.findByBookingIdAndVerifiedFalse(bookingId).isPresent()) {
            log.warn("[OTP] OTP already exists for booking {}", bookingId);
            throw new IllegalStateException("OTP already generated for this trip");
        }

        // Generate 6-digit OTP
        String otpCode = generateSixDigitOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(otpTtlSeconds);

        // Create OTP record
        OtpTrip otpTrip = new OtpTrip(bookingId, employeeEmail, driverEmail, otpCode, expiresAt);
        otpTrip.setCreatedAt(LocalDateTime.now());
        otpTripRepo.save(otpTrip);

        // Send OTP via SMS to EMPLOYEE ONLY
        try {
            log.info("[OTP] Attempting to send OTP to employee {} at {}", employeeEmail, employeePhone);
            twilioService.sendOtpSmsWithName(employeePhone, otpCode, employeeName);
            log.info("[OTP] ✅ OTP sent successfully to employee {} for booking {}", employeeEmail, bookingId);
        } catch (IllegalStateException e) {
            log.error("[OTP] Twilio configuration error for booking {}: {}", bookingId, e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.error("[OTP] Invalid phone number for booking {}: {}", bookingId, e.getMessage());
            throw e;
        } catch (RuntimeException e) {
            // SMS failed - but OTP is still created in database
            log.warn("[OTP] ⚠️  SMS delivery failed, but OTP created for booking {}: {}", bookingId, e.getMessage());
            log.warn("[OTP] OTP Code: {} | Employee: {} | Phone: {}", otpCode, employeeEmail, employeePhone);
            log.warn("[OTP] User can still verify OTP manually or SMS may work on paid account");
            
            // Don't throw - OTP is already in database and can be verified manually
        } catch (Exception e) {
            log.error("[OTP] Unexpected error sending OTP for booking {}: {}", bookingId, e.getMessage(), e);
            // Still don't throw - OTP is in database
        }

        return otpTrip;
    }

    /**
     * Generate and send OTP for a ride
     */
    public OtpTrip generateAndSendOtp(Long bookingId, String employeeEmail, String employeeName, 
                                       String driverEmail, String phoneNumber) {
        // Validate input
        if (phoneNumber == null || phoneNumber.isBlank()) {
            log.error("[OTP] Cannot generate OTP: Phone number is empty for employee {}", employeeEmail);
            throw new IllegalArgumentException("Phone number is required to send OTP");
        }

        // Check if OTP already exists for this booking
        if (otpTripRepo.findByBookingIdAndVerifiedFalse(bookingId).isPresent()) {
            log.warn("[OTP] OTP already exists for booking {}", bookingId);
            throw new IllegalStateException("OTP already generated for this trip");
        }

        // Generate 6-digit OTP
        String otpCode = generateSixDigitOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(otpTtlSeconds);

        // Create OTP record
        OtpTrip otpTrip = new OtpTrip(bookingId, employeeEmail, driverEmail, otpCode, expiresAt);
        otpTrip.setCreatedAt(LocalDateTime.now());
        otpTripRepo.save(otpTrip);

        // Send OTP via SMS
        try {
            log.info("[OTP] Attempting to send OTP to {} for employee {}", phoneNumber, employeeEmail);
            twilioService.sendOtpSmsWithName(phoneNumber, otpCode, employeeName);
            log.info("[OTP] OTP sent successfully for booking {} to employee {}", bookingId, employeeEmail);
        } catch (IllegalStateException e) {
            // Twilio not configured - this is a configuration error
            log.error("[OTP] Twilio configuration error for booking {}: {}", bookingId, e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            // Invalid phone number
            log.error("[OTP] Invalid phone number for booking {}: {}", bookingId, e.getMessage());
            throw e;
        } catch (Exception e) {
            // SMS sending failed
            log.error("[OTP] Failed to send SMS for booking {} to {}: {}", bookingId, phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP via SMS: " + e.getMessage(), e);
        }

        return otpTrip;
    }

    /**
     * Verify OTP entered by driver
     */
    public boolean verifyOtp(Long bookingId, String enteredOtp) {
        OtpTrip otpTrip = otpTripRepo.findByBookingIdAndVerifiedFalse(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("No pending OTP for this trip"));

        // Check if OTP has expired
        if (LocalDateTime.now().isAfter(otpTrip.getExpiresAt())) {
            log.warn("[OTP] OTP expired for booking {}", bookingId);
            throw new IllegalStateException("OTP has expired. Please request a new one.");
        }

        // Check attempts
        if (otpTrip.getAttempts() >= maxAttempts) {
            log.warn("[OTP] Max attempts exceeded for booking {}", bookingId);
            throw new IllegalStateException("Maximum OTP verification attempts exceeded. Please request a new OTP.");
        }

        otpTrip.setAttempts(otpTrip.getAttempts() + 1);

        // Verify OTP
        if (otpTrip.getOtpCode().equals(enteredOtp)) {
            otpTrip.setVerified(true);
            otpTrip.setVerifiedAt(LocalDateTime.now());
            otpTripRepo.save(otpTrip);
            log.info("[OTP] OTP verified successfully for booking {}", bookingId);
            return true;
        } else {
            otpTripRepo.save(otpTrip);
            log.warn("[OTP] Incorrect OTP for booking {} | Attempts: {}", bookingId, otpTrip.getAttempts());
            throw new IllegalArgumentException("Incorrect OTP. Please try again.");
        }
    }

    /**
     * Resend OTP for a trip
     */
    public OtpTrip resendOtp(Long bookingId, String phoneNumber, String employeeName) {
        OtpTrip existingOtp = otpTripRepo.findByBookingIdAndVerifiedFalse(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("No pending OTP for this trip"));

        // Generate new OTP
        String newOtpCode = generateSixDigitOtp();
        existingOtp.setOtpCode(newOtpCode);
        existingOtp.setExpiresAt(LocalDateTime.now().plusSeconds(otpTtlSeconds));
        existingOtp.setAttempts(0); // Reset attempts
        otpTripRepo.save(existingOtp);

        // Send new OTP via SMS
        try {
            twilioService.sendOtpSmsWithName(phoneNumber, newOtpCode, employeeName);
            log.info("[OTP] OTP resent for booking {}", bookingId);
        } catch (Exception e) {
            log.error("[OTP] Failed to resend SMS for booking {}: {}", bookingId, e.getMessage());
        }

        return existingOtp;
    }

    /**
     * Check if OTP is verified for a booking
     */
    public boolean isOtpVerified(Long bookingId) {
        OtpTrip otpTrip = otpTripRepo.findByBookingId(bookingId)
                .orElse(null);
        return otpTrip != null && otpTrip.isVerified();
    }

    /**
     * Get OTP status for a booking
     */
    public OtpTrip getOtpStatus(Long bookingId) {
        return otpTripRepo.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("No OTP found for this booking"));
    }

    /**
     * Generate 6-digit OTP
     */
    private String generateSixDigitOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
