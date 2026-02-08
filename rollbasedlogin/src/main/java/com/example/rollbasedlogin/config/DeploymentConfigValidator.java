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

    @PostConstruct
    public void validate() {
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
