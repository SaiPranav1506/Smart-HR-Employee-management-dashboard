package com.example.rollbasedlogin.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import com.example.rollbasedlogin.config.TwilioConfig;

@Service
public class TwilioService {

    private static final Logger log = LoggerFactory.getLogger(TwilioService.class);

    @Autowired
    private TwilioConfig twilioConfig;

    public void sendOtpSms(String phoneNumber, String otpCode) {
        log.info("[OTP-SMS] Sending OTP to phone: {}", phoneNumber);
        
        // Validate phone number format
        if (phoneNumber == null || phoneNumber.trim().isBlank()) {
            log.error("[OTP-SMS] ❌ Phone number is missing");
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        // If Twilio is disabled, just log the OTP
        if (!twilioConfig.isEnabled()) {
            log.warn("[OTP-SMS] ⚠️  Twilio is DISABLED. SMS will NOT be sent.");
            log.info("[OTP-SMS-DEMO] To: {} | OTP Code: {}", phoneNumber, otpCode);
            return;
        }

        // Validate Twilio credentials
        if (!twilioConfig.isProperlyConfigured()) {
            log.warn("[OTP-SMS] ⚠️  Twilio credentials incomplete. SMS will NOT be sent.");
            log.warn("[OTP-SMS] To enable SMS, set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
            log.info("[OTP-SMS-DEMO] To: {} | OTP Code: {}", phoneNumber, otpCode);
            return;
        }

        try {
            String messageBody = "Your ride OTP is: " + otpCode + ". Valid for 10 minutes. Do not share this code.";

            log.debug("[OTP-SMS] Creating Twilio message to: {} | From: {}", phoneNumber, twilioConfig.getPhoneNumber());
            
            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),                      // To number
                    new PhoneNumber(twilioConfig.getPhoneNumber()),    // From number
                    messageBody                                         // Message body
                )
                .create();

            log.info("[OTP-SMS] ✅ Successfully sent OTP to {} | Message SID: {}", phoneNumber, message.getSid());
        } catch (Exception e) {
            log.error("[OTP-SMS] ❌ Failed to send OTP to {} | Error: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP via SMS: " + e.getMessage());
        }
    }

    public void sendOtpSmsWithName(String phoneNumber, String otpCode, String employeeName) {
        log.info("[OTP-SMS] Sending OTP to {} for employee: {}", phoneNumber, employeeName);
        
        // Validate phone number format
        if (phoneNumber == null || phoneNumber.trim().isBlank()) {
            log.error("[OTP-SMS] ❌ Phone number is missing for employee: {}", employeeName);
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        // If Twilio is disabled, just log the OTP
        if (!twilioConfig.isEnabled()) {
            log.warn("[OTP-SMS] ⚠️  Twilio is DISABLED. SMS will NOT be sent.");
            log.info("[OTP-SMS-DEMO] To: {} | Employee: {} | OTP Code: {}", phoneNumber, employeeName, otpCode);
            return;
        }

        // Validate Twilio credentials
        if (!twilioConfig.isProperlyConfigured()) {
            log.warn("[OTP-SMS] ⚠️  Twilio credentials incomplete. SMS will NOT be sent.");
            log.warn("[OTP-SMS] To enable SMS, set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
            log.info("[OTP-SMS-DEMO] To: {} | Employee: {} | OTP Code: {}", phoneNumber, employeeName, otpCode);
            return;
        }

        try {
            String messageBody = "Hi " + employeeName + ", your ride OTP is: " + otpCode + ". Valid for 10 minutes.";

            log.debug("[OTP-SMS] Creating Twilio message to: {} | From: {}", phoneNumber, twilioConfig.getPhoneNumber());
            
            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),                      // To number
                    new PhoneNumber(twilioConfig.getPhoneNumber()),    // From number
                    messageBody                                         // Message body
                )
                .create();

            log.info("[OTP-SMS] ✅ Successfully sent OTP to {} | Employee: {} | Message SID: {}", 
                phoneNumber, employeeName, message.getSid());
        } catch (Exception e) {
            // Log the error but indicate this might succeed with paid account
            log.warn("[OTP-SMS] ⚠️  SMS failed for {} (might be trial account restriction)", phoneNumber);
            log.warn("[OTP-SMS] Error: {}", e.getMessage());
            log.warn("[OTP-SMS] Solution: Upgrade Twilio to paid account or verify this number");
            log.info("[OTP-SMS-FALLBACK] Logging OTP for manual verification: {} | Employee: {} | OTP: {}", 
                phoneNumber, employeeName, otpCode);
            
            // In production with paid Twilio: throw exception
            // In trial/test: don't throw - let the system continue with logged OTP
            throw new RuntimeException("Failed to send OTP via SMS (trial account restriction): " + e.getMessage());
        }
    }

    /**
     * Send trip assignment notification to driver
     */
    public void sendTripAssignmentNotification(String phoneNumber, String driverName, 
                                               String employeeName, String pickupLocation, String destination) {
        log.info("[TRIP-SMS] Sending trip assignment notification to {} (driver: {})", phoneNumber, driverName);
        
        // Validate phone number format
        if (phoneNumber == null || phoneNumber.trim().isBlank()) {
            log.error("[TRIP-SMS] ❌ Phone number is missing for driver: {}", driverName);
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        // If Twilio is disabled, just log the notification
        if (!twilioConfig.isEnabled()) {
            log.warn("[TRIP-SMS] ⚠️  Twilio is DISABLED. SMS will NOT be sent.");
            log.info("[TRIP-SMS-DEMO] To: {} | Driver: {} | From: {} To: {}", 
                phoneNumber, driverName, pickupLocation, destination);
            return;
        }

        // Validate Twilio credentials
        if (!twilioConfig.isProperlyConfigured()) {
            log.warn("[TRIP-SMS] ⚠️  Twilio credentials incomplete. SMS will NOT be sent.");
            log.warn("[TRIP-SMS] To enable SMS, set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
            log.info("[TRIP-SMS-DEMO] To: {} | Driver: {} | From: {} To: {}", 
                phoneNumber, driverName, pickupLocation, destination);
            return;
        }

        try {
            String messageBody = "Hi " + driverName + ", you have a new trip assignment from " + employeeName + 
                               ". Pickup: " + pickupLocation + " → Destination: " + destination;

            log.debug("[TRIP-SMS] Creating Twilio message to: {} | From: {}", phoneNumber, twilioConfig.getPhoneNumber());
            
            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),                      // To number
                    new PhoneNumber(twilioConfig.getPhoneNumber()),    // From number
                    messageBody                                         // Message body
                )
                .create();

            log.info("[TRIP-SMS] ✅ Successfully sent trip assignment notification to {} | Driver: {} | Message SID: {}", 
                phoneNumber, driverName, message.getSid());
        } catch (Exception e) {
            // Log error but don't fail the entire request
            log.warn("[TRIP-SMS] ⚠️  Failed to send notification to {} (trial account restriction)", phoneNumber);
            log.warn("[TRIP-SMS] Error: {}", e.getMessage());
            log.info("[TRIP-SMS-FALLBACK] Logging notification: Driver: {} | From: {} To: {}", 
                driverName, pickupLocation, destination);
            // Note: We don't throw here because trip assignment already succeeded
        }
    }
}
