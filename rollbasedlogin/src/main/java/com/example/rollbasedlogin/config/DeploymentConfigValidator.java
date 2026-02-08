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
        return trimmed.contains("<") || trimmed.contains(">") || trimmed.contains("RAILWAY_HOST") || trimmed.contains("RAILWAY_PORT");
    }
}
