package com.example.rollbasedlogin.controller;

import com.example.rollbasedlogin.model.OtpTrip;
import com.example.rollbasedlogin.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/otp")
@CrossOrigin(origins = "*")
public class OtpController {

    @Autowired
    private OtpService otpService;

    /**
     * Verify OTP entered by driver
     * POST /api/otp/verify
     * Request body: { "bookingId": 1, "enteredOtp": "123456" }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            String bookingIdStr = request.get("bookingId");
            String enteredOtp = request.get("enteredOtp");

            if (bookingIdStr == null || enteredOtp == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "bookingId and enteredOtp are required"
                ));
            }

            Long bookingId = Long.parseLong(bookingIdStr);
            boolean verified = otpService.verifyOtp(bookingId, enteredOtp);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP verified successfully",
                "verified", verified
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error verifying OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * Resend OTP
     * POST /api/otp/resend
     * Request body: { "bookingId": 1, "phoneNumber": "+1234567890", "employeeName": "John Doe" }
     */
    @PostMapping("/resend")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        try {
            String bookingIdStr = request.get("bookingId");
            String phoneNumber = request.get("phoneNumber");
            String employeeName = request.get("employeeName");

            if (bookingIdStr == null || phoneNumber == null || employeeName == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "bookingId, phoneNumber, and employeeName are required"
                ));
            }

            Long bookingId = Long.parseLong(bookingIdStr);
            OtpTrip otpTrip = otpService.resendOtp(bookingId, phoneNumber, employeeName);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP resent successfully",
                "expiresAt", otpTrip.getExpiresAt()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error resending OTP: " + e.getMessage()
            ));
        }
    }

    /**
     * Get OTP status for a booking
     * GET /api/otp/status?bookingId=1
     */
    @GetMapping("/status")
    public ResponseEntity<?> getOtpStatus(@RequestParam Long bookingId) {
        try {
            OtpTrip otpTrip = otpService.getOtpStatus(bookingId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("bookingId", otpTrip.getBookingId());
            response.put("verified", otpTrip.isVerified());
            response.put("attempts", otpTrip.getAttempts());
            response.put("expiresAt", otpTrip.getExpiresAt());
            response.put("verifiedAt", otpTrip.getVerifiedAt());
            response.put("createdAt", otpTrip.getCreatedAt());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error fetching OTP status: " + e.getMessage()
            ));
        }
    }

    /**
     * Check if OTP is verified
     * GET /api/otp/is-verified?bookingId=1
     */
    @GetMapping("/is-verified")
    public ResponseEntity<?> isOtpVerified(@RequestParam Long bookingId) {
        try {
            boolean verified = otpService.isOtpVerified(bookingId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "verified", verified,
                "bookingId", bookingId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error checking OTP verification: " + e.getMessage()
            ));
        }
    }
}
