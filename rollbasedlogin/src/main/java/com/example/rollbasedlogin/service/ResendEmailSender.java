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
                throw new IllegalStateException("Resend API error (HTTP " + status + "): " + (body == null ? "" : body));
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
}
