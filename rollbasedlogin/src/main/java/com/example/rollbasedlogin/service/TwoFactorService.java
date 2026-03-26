package com.example.rollbasedlogin.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class TwoFactorService {

    private static final Logger log = LoggerFactory.getLogger(TwoFactorService.class);

    public static class StartResult {
        private final String verificationId;
        private final long expiresAtEpochMs;

        public StartResult(String verificationId, long expiresAtEpochMs) {
            this.verificationId = verificationId;
            this.expiresAtEpochMs = expiresAtEpochMs;
        }

        public String getVerificationId() {
            return verificationId;
        }

        public long getExpiresAtEpochMs() {
            return expiresAtEpochMs;
        }
    }

    public static class VerifiedPrincipal {
        private final String email;
        private final String role;
        private final String username;

        public VerifiedPrincipal(String email, String role, String username) {
            this.email = email;
            this.role = role;
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public String getRole() {
            return role;
        }

        public String getUsername() {
            return username;
        }
    }

    private static class Challenge {
        private final String email;
        private final String role;
        private final String username;
        private final String codeHash;
        private final Instant expiresAt;
        private int attemptsLeft;

        private Challenge(String email, String role, String username, String codeHash, Instant expiresAt, int attemptsLeft) {
            this.email = email;
            this.role = role;
            this.username = username;
            this.codeHash = codeHash;
            this.expiresAt = expiresAt;
            this.attemptsLeft = attemptsLeft;
        }
    }

    private final EmailService emailService;
    private final TwilioService twilioService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();
    private final ConcurrentHashMap<String, Challenge> challenges = new ConcurrentHashMap<>();

    @Value("${app.2fa.code.ttl-seconds:300}")
    private long ttlSeconds;

    @Value("${app.2fa.max-attempts:5}")
    private int maxAttempts;

    public TwoFactorService(EmailService emailService, TwilioService twilioService) {
        this.emailService = emailService;
        this.twilioService = twilioService;
    }

    /** Backward-compat overload (email-only 2FA). */
    public StartResult start(String email, String role) {
        return start(email, role, null, null);
    }

    /**
     * Start 2FA: sends OTP to phone via SMS. Falls back to email if phone is unavailable.
     */
    public StartResult start(String email, String role, String username, String phoneNumber) {
        String verificationId = UUID.randomUUID().toString();
        String code = generateSixDigitCode();
        Instant expiresAt = Instant.now().plusSeconds(ttlSeconds);

        // Prefer SMS to phone if Twilio is available, otherwise fall back to email
        if (phoneNumber != null && !phoneNumber.isBlank() && twilioService.isAvailable()) {
            try {
                twilioService.sendLoginOtp(phoneNumber, code);
                log.info("[2FA] OTP sent via SMS to {}", phoneNumber);
            } catch (Exception smsEx) {
                log.warn("[2FA] SMS delivery failed, falling back to email: {}", smsEx.getMessage());
                emailService.sendTwoFactorCode(email, code);
            }
        } else {
            if (phoneNumber != null && !phoneNumber.isBlank()) {
                log.warn("[2FA] Twilio not available — cannot send SMS to {}. Falling back to email.", phoneNumber);
            }
            emailService.sendTwoFactorCode(email, code);
        }

        Challenge challenge = new Challenge(email, role, username, encoder.encode(code), expiresAt, maxAttempts);
        challenges.put(verificationId, challenge);

        return new StartResult(verificationId, expiresAt.toEpochMilli());
    }

    public VerifiedPrincipal verify(String verificationId, String code) {
        if (verificationId == null || verificationId.isBlank()) {
            throw new IllegalArgumentException("verificationId is required");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("code is required");
        }

        Challenge challenge = challenges.get(verificationId);
        if (challenge == null) {
            throw new IllegalStateException("Verification session not found or expired");
        }

        if (Instant.now().isAfter(challenge.expiresAt)) {
            challenges.remove(verificationId);
            throw new IllegalStateException("Verification code expired");
        }

        if (challenge.attemptsLeft <= 0) {
            challenges.remove(verificationId);
            throw new IllegalStateException("Too many attempts. Please login again.");
        }

        boolean ok = encoder.matches(code.trim(), challenge.codeHash);
        if (!ok) {
            challenge.attemptsLeft -= 1;
            throw new IllegalStateException("Invalid verification code");
        }

        challenges.remove(verificationId);
        return new VerifiedPrincipal(challenge.email, challenge.role, challenge.username);
    }

    private String generateSixDigitCode() {
        int value = random.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
