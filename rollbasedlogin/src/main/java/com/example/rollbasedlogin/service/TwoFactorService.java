package com.example.rollbasedlogin.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class TwoFactorService {

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

        public VerifiedPrincipal(String email, String role) {
            this.email = email;
            this.role = role;
        }

        public String getEmail() {
            return email;
        }

        public String getRole() {
            return role;
        }
    }

    private static class Challenge {
        private final String email;
        private final String role;
        private final String codeHash;
        private final Instant expiresAt;
        private int attemptsLeft;

        private Challenge(String email, String role, String codeHash, Instant expiresAt, int attemptsLeft) {
            this.email = email;
            this.role = role;
            this.codeHash = codeHash;
            this.expiresAt = expiresAt;
            this.attemptsLeft = attemptsLeft;
        }
    }

    private final EmailService emailService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();
    private final ConcurrentHashMap<String, Challenge> challenges = new ConcurrentHashMap<>();

    @Value("${app.2fa.code.ttl-seconds:300}")
    private long ttlSeconds;

    @Value("${app.2fa.max-attempts:5}")
    private int maxAttempts;

    public TwoFactorService(EmailService emailService) {
        this.emailService = emailService;
    }

    public StartResult start(String email, String role) {
        String verificationId = UUID.randomUUID().toString();
        String code = generateSixDigitCode();
        Instant expiresAt = Instant.now().plusSeconds(ttlSeconds);

        // Send first; only store if the email send succeeded
        emailService.sendTwoFactorCode(email, code);

        Challenge challenge = new Challenge(email, role, encoder.encode(code), expiresAt, maxAttempts);
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
        return new VerifiedPrincipal(challenge.email, challenge.role);
    }

    private String generateSixDigitCode() {
        int value = random.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
