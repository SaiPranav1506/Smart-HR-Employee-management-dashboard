package com.example.rollbasedlogin.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically converts Render-style {@code postgres://} or {@code postgresql://}
 * database URLs into the JDBC format that Spring/HikariCP expects.
 *
 * <p>Resolution order:
 * <ol>
 *   <li>{@code SPRING_DATASOURCE_URL} / {@code spring.datasource.url}</li>
 *   <li>{@code DATABASE_URL} (set automatically by Render when you link a Postgres DB)</li>
 * </ol>
 *
 * <p>If the value starts with {@code postgres://} or {@code postgresql://}, it is
 * rewritten to {@code jdbc:postgresql://host:port/db} and the embedded
 * username/password are extracted into {@code spring.datasource.username} and
 * {@code spring.datasource.password} (unless those are already set).
 *
 * <p>Registered via {@code META-INF/spring.factories} so it runs before any bean
 * is created.
 */
public class RenderDatabaseUrlProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {

        // Try SPRING_DATASOURCE_URL first, then DATABASE_URL (Render auto-sets this).
        String raw = environment.getProperty("spring.datasource.url");

        if (isBlankOrEmpty(raw)) {
            raw = environment.getProperty("DATABASE_URL");
        }

        if (isBlankOrEmpty(raw)) {
            return; // nothing to convert
        }

        raw = raw.trim();

        // Already a valid JDBC URL – nothing to do.
        if (raw.startsWith("jdbc:")) {
            return;
        }

        // Normalize scheme so URI parsing works.
        if (raw.startsWith("postgres://")) {
            raw = "postgresql" + raw.substring("postgres".length());
        }

        if (!raw.startsWith("postgresql://")) {
            return; // not a Postgres URL we can convert
        }

        try {
            // Parse: postgresql://user:pass@host:port/dbname
            URI uri = new URI(raw);

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath(); // e.g. "/smarthr_employee_database"
            String query = uri.getQuery(); // e.g. "sslmode=require"

            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                    .append(host).append(':').append(port)
                    .append(path != null ? path : "/postgres");

            if (query != null && !query.isEmpty()) {
                jdbcUrl.append('?').append(query);
            }

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", jdbcUrl.toString());

            // Extract user info if embedded in the URL.
            String userInfo = uri.getUserInfo(); // "user:pass"
            if (userInfo != null) {
                int colon = userInfo.indexOf(':');
                if (colon > 0) {
                    String user = userInfo.substring(0, colon);
                    String pass = userInfo.substring(colon + 1);

                    // Only override if not explicitly set.
                    if (isBlankOrEmpty(environment.getProperty("spring.datasource.username"))) {
                        props.put("spring.datasource.username", user);
                    }
                    if (isBlankOrEmpty(environment.getProperty("spring.datasource.password"))) {
                        props.put("spring.datasource.password", pass);
                    }
                } else {
                    if (isBlankOrEmpty(environment.getProperty("spring.datasource.username"))) {
                        props.put("spring.datasource.username", userInfo);
                    }
                }
            }

            environment.getPropertySources()
                    .addFirst(new MapPropertySource("renderDatabaseUrl", props));

        } catch (Exception e) {
            // If parsing fails, let the normal Spring error surface.
            System.err.println("[RenderDatabaseUrlProcessor] Failed to parse database URL: " + e.getMessage());
        }
    }

    private static boolean isBlankOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }
}
