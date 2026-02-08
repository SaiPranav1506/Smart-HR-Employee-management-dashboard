package com.example.rollbasedlogin.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final ResendEmailSender resendEmailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.provider:smtp}")
    private String mailProvider;

    @Value("${app.2fa.delivery:mail}")
    private String deliveryMode;

    @Value("${app.2fa.code.ttl-seconds:300}")
    private long codeTtlSeconds;

    public EmailService(JavaMailSender mailSender, ResendEmailSender resendEmailSender) {
        this.mailSender = mailSender;
        this.resendEmailSender = resendEmailSender;
    }

    public void sendTwoFactorCode(String toEmail, String code) {
        String mode = (deliveryMode == null ? "mail" : deliveryMode.trim().toLowerCase());
        if ("log".equals(mode)) {
            // Dev-only mode to unblock local testing without SMTP.
            System.out.println("[2FA] Verification code for " + toEmail + " is: " + code + " (expires in " + (codeTtlSeconds / 60) + " minutes)");
            return;
        }

        String provider = (mailProvider == null ? "smtp" : mailProvider.trim().toLowerCase());
        if ("resend".equals(provider)) {
            String subject = "Your verification code";
            String text = "Your verification code is: " + code + "\n\nThis code expires in " + (codeTtlSeconds / 60) + " minutes.";
            resendEmailSender.sendTextEmail(from, toEmail, subject, text);
            return;
        }

        if (mailHost == null || mailHost.isBlank()) {
            throw new IllegalStateException(
                    "SMTP is not configured. Set spring.mail.host (and other spring.mail.* properties), or set app.2fa.delivery=log for local testing."
            );
        }

        if (mailUsername == null || mailUsername.isBlank() || mailPassword == null || mailPassword.isBlank()) {
            throw new IllegalStateException(
                "SMTP credentials are missing. Set SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD on your host (Render). " +
                    "For Gmail, SPRING_MAIL_PASSWORD must be a Google App Password (not your normal Gmail password)."
            );
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        message.setTo(toEmail);
        message.setSubject("Your verification code");
        message.setText("Your verification code is: " + code + "\n\nThis code expires in " + (codeTtlSeconds / 60) + " minutes.");

        try {
            mailSender.send(message);
        } catch (RuntimeException ex) {
            String combined = (ex.toString() + " " + (ex.getMessage() == null ? "" : ex.getMessage())).toLowerCase();
            boolean looksLikeGmailAuthIssue =
                    combined.contains("535") ||
                    combined.contains("username and password not accepted") ||
                    combined.contains("authentication failed") ||
                    combined.contains("application-specific") ||
                    combined.contains("bad credentials");

            boolean looksLikeNetworkTimeout =
                    combined.contains("couldn't connect to host") ||
                    combined.contains("could not connect to host") ||
                    combined.contains("connection timed out") ||
                    combined.contains("connectexception");

            log.warn("Failed to send 2FA email to {} via SMTP host '{}'.", toEmail, mailHost, ex);

            if (looksLikeGmailAuthIssue) {
                throw new IllegalStateException(
                        "Failed to send verification email. For Gmail SMTP you must use a Google App Password (not your normal Gmail password) and enable 2-Step Verification on the sender account."
                );
            }

            if (looksLikeNetworkTimeout) {
                throw new IllegalStateException(
                        "Failed to send verification email because the server could not connect to the SMTP host (network timeout). " +
                                "Many hosting providers (including Render) block outbound SMTP ports. " +
                                "Fix: use an email provider with an HTTPS API (SendGrid/Mailgun/Resend/etc.), or temporarily set APP_2FA_DELIVERY=log on Render."
                );
            }

            throw new IllegalStateException("Failed to send verification email. Check SMTP username/password and provider settings.");
        }
    }
}
