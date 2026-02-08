package com.example.rollbasedlogin.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DeploymentConfigValidator {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${app.mail.provider:smtp}")
    private String mailProvider;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @PostConstruct
    public void validate() {
        validateResendConfig();

        if (datasourceUrl != null) {
            String trimmedUrl = datasourceUrl.trim();
            if (!trimmedUrl.isEmpty() && !trimmedUrl.startsWith("jdbc:")) {
                throw new IllegalStateException(
                        "Invalid SPRING_DATASOURCE_URL. It must start with 'jdbc:' (for MySQL: 'jdbc:mysql://HOST:PORT/DB'). " +
                                "If you copied a Railway URL that starts with 'mysql://', convert it to JDBC format before setting it on Render."
                );
            }
        }

        if (looksLikePlaceholder(datasourceUrl) || looksLikePlaceholder(datasourceUsername) || looksLikePlaceholder(datasourcePassword)) {
            throw new IllegalStateException(
                    "Database config looks like placeholder text. " +
                            "Set real values for SPRING_DATASOURCE_URL / SPRING_DATASOURCE_USERNAME / SPRING_DATASOURCE_PASSWORD in your host (Render), " +
                            "using the actual host/port/db/user/password from Railway MySQL."
            );
        }
    }

    private void validateResendConfig() {
        String provider = (mailProvider == null ? "smtp" : mailProvider.trim().toLowerCase());
        if (!"resend".equals(provider)) {
            return;
        }

        if (mailFrom == null || mailFrom.isBlank()) {
            throw new IllegalStateException(
                    "Resend is enabled (APP_MAIL_PROVIDER=resend) but APP_MAIL_FROM is missing. " +
                            "Set APP_MAIL_FROM to a verified sender/domain in Resend (for example: noreply@yourdomain.com)."
            );
        }

        String fromLower = mailFrom.trim().toLowerCase();
        int at = fromLower.lastIndexOf('@');
        if (at > -1 && at + 1 < fromLower.length()) {
            String domain = fromLower.substring(at + 1);
            if (isPublicEmailDomain(domain)) {
                throw new IllegalStateException(
                        "APP_MAIL_FROM='" + mailFrom.trim() + "' uses a public email domain ('" + domain + "'). " +
                                "Resend requires you to verify a domain you own, so Gmail/Yahoo/Outlook addresses cannot be used as the Resend 'from' address. " +
                                "Fix: add a domain in Resend (Domains → Add domain), verify DNS, then set APP_MAIL_FROM like noreply@yourdomain.com."
                );
            }
        }
    }

    private static boolean isPublicEmailDomain(String domain) {
        if (domain == null) return false;
        String d = domain.trim().toLowerCase();
        return d.equals("gmail.com")
                || d.equals("googlemail.com")
                || d.equals("yahoo.com")
                || d.equals("outlook.com")
                || d.equals("hotmail.com")
                || d.equals("live.com");
    }

    private static boolean looksLikePlaceholder(String value) {
        if (value == null) return false;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return false;
        return trimmed.contains("<")
                || trimmed.contains(">")
                || trimmed.contains("RAILWAY_HOST")
                || trimmed.contains("RAILWAY_PORT")
                || trimmed.contains("MYSQLHOST")
                || trimmed.contains("MYSQLPORT");
    }
}
