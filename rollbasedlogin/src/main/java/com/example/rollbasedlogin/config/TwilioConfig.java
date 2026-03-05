package com.example.rollbasedlogin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.twilio.Twilio;

import jakarta.annotation.PostConstruct;

/**
 * Centralized Twilio Configuration
 * - Initializes Twilio credentials at application startup
 * - Makes Twilio configuration available to multiple services
 * - Validates credentials during initialization
 */
@Configuration
public class TwilioConfig {

    private static final Logger log = LoggerFactory.getLogger(TwilioConfig.class);

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String phoneNumber;

    @Value("${twilio.enabled:false}")
    private boolean enabled;

    /**
     * Initialize Twilio credentials at application startup
     * This ensures Twilio is ready for use across all services
     */
    @PostConstruct
    public void initTwilio() {
        log.info("[TWILIO] ========== TWILIO INITIALIZATION START ==========");
        log.info("[TWILIO] Twilio.enabled: {}", enabled);

        // Check if Twilio is enabled
        if (!enabled) {
            log.warn("[TWILIO] ⚠️  Twilio is DISABLED. SMS features will NOT work.");
            log.warn("[TWILIO] To enable: Set environment variable TWILIO_ENABLED=true");
            log.info("[TWILIO] ========== TWILIO INITIALIZATION END ==========");
            return;
        }

        // Validate credentials
        boolean isValid = true;
        
        if (accountSid == null || accountSid.trim().isBlank()) {
            log.error("[TWILIO] ❌ Account SID is missing. Set TWILIO_ACCOUNT_SID environment variable.");
            isValid = false;
        } else {
            log.info("[TWILIO] ✓ Account SID provided: {}", maskSensitive(accountSid));
        }
        
        if (authToken == null || authToken.trim().isBlank()) {
            log.error("[TWILIO] ❌ Auth Token is missing. Set TWILIO_AUTH_TOKEN environment variable.");
            isValid = false;
        } else {
            log.info("[TWILIO] ✓ Auth Token provided: {}", maskSensitive(authToken));
        }
        
        if (phoneNumber == null || phoneNumber.trim().isBlank()) {
            log.error("[TWILIO] ❌ Phone Number is missing. Set TWILIO_PHONE_NUMBER environment variable.");
            isValid = false;
        } else {
            log.info("[TWILIO] ✓ Phone Number provided: {}", phoneNumber);
        }

        if (!isValid) {
            log.error("[TWILIO] ❌ Twilio credentials incomplete. SMS will not work.");
            log.info("[TWILIO] ========== TWILIO INITIALIZATION END ==========");
            return;
        }

        try {
            // Initialize Twilio with credentials
            Twilio.init(accountSid, authToken);
            log.info("[TWILIO] ✅ Successfully initialized Twilio Client");
            log.info("[TWILIO] Twilio is ready to send SMS messages");
            log.info("[TWILIO] ========== TWILIO INITIALIZATION END ==========");
        } catch (Exception e) {
            log.error("[TWILIO] ❌ Failed to initialize Twilio: {}", e.getMessage(), e);
            log.info("[TWILIO] ========== TWILIO INITIALIZATION END ==========");
        }
    }

    /**
     * Mask sensitive data for logging
     */
    private String maskSensitive(String value) {
        if (value == null || value.length() < 4) {
            return "****";
        }
        return value.substring(0, 2) + "****" + value.substring(value.length() - 2);
    }

    // Getters for configuration properties
    public String getAccountSid() {
        return accountSid;
    }

    public String getAuthToken() {
        return authToken;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Validate if Twilio is properly configured
     */
    public boolean isProperlyConfigured() {
        return enabled && 
               accountSid != null && !accountSid.trim().isBlank() &&
               authToken != null && !authToken.trim().isBlank() &&
               phoneNumber != null && !phoneNumber.trim().isBlank();
    }
}
