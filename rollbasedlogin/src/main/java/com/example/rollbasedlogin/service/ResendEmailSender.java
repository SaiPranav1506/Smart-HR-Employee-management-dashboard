package com.example.rollbasedlogin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Minimal Resend API client (HTTPS) to send emails from hosts that block SMTP.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */
@Service
public class ResendEmailSender {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.mail.resend.api-key:}")
    private String apiKey;

    @Value("${app.mail.resend.base-url:https://api.resend.com}")
    private String baseUrl;

    public ResendEmailSender(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendTextEmail(String from, String to, String subject, String text) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY is missing. Set it on your host (Render) as an environment variable.");
        }
        if (from == null || from.isBlank()) {
            throw new IllegalStateException("Email 'from' address is missing. Set APP_MAIL_FROM on your host (Render). For Resend, it must be a verified sender/domain.");
        }

        try {
            String payload = objectMapper.writeValueAsString(
                    Map.of(
                            "from", from,
                            "to", List.of(to),
                            "subject", subject,
                            "text", text
                    )
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/emails"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                String body = response.body();
                throw new IllegalStateException(buildResendErrorMessage(status, body, from));
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to call Resend API (I/O error).", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to call Resend API (interrupted).", e);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to send email via Resend.", e);
        }
    }

    private String buildResendErrorMessage(int status, String body, String from) {
        String message = null;
        String errorName = null;

        if (body != null && !body.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> parsed = objectMapper.readValue(body, Map.class);
                Object msg = parsed.get("message");
                Object name = parsed.get("name");
                if (msg != null) message = String.valueOf(msg);
                if (name != null) errorName = String.valueOf(name);
            } catch (Exception ignored) {
                // Keep fallback behavior below.
            }
        }

        String normalized = (message == null ? "" : message).toLowerCase();

        if (status == 401) {
            return "Resend API rejected the request (HTTP 401). Check that RESEND_API_KEY is correct and not expired/revoked.";
        }

        if (status == 403 && normalized.contains("domain") && normalized.contains("not verified")) {
            return "Resend rejected the 'from' domain (HTTP 403): " + (message == null ? "Domain is not verified." : message) + " " +
                    "Fix: set APP_MAIL_FROM to an address on a domain you own and have verified in Resend (Domains → Add domain). " +
                    "Gmail/Yahoo/Outlook addresses cannot be used as the Resend 'from' address. Current APP_MAIL_FROM='" + from + "'.";
        }

        if (message != null && !message.isBlank()) {
            return "Resend API error (HTTP " + status + "): " + message + (errorName == null ? "" : " (" + errorName + ")");
        }

        return "Resend API error (HTTP " + status + "): " + (body == null ? "" : body);
    }
}
