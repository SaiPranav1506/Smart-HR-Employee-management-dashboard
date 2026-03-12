package com.example.rollbasedlogin.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically converts non-JDBC PostgreSQL URLs (from Render, Supabase, etc.)
 * into the JDBC format that Spring/HikariCP expects.
 *
 * <p>Resolution order:
 * <ol>
 *   <li>{@code SPRING_DATASOURCE_URL} / {@code spring.datasource.url}</li>
 *   <li>{@code DATABASE_URL} (set automatically by Render/Supabase when you link a Postgres DB)</li>
 * </ol>
 *
 * <p>If the value starts with {@code postgres://} or {@code postgresql://}, it is
 * rewritten to {@code jdbc:postgresql://host:port/db?sslmode=require} and the embedded
 * username/password are extracted into {@code spring.datasource.username} and
 * {@code spring.datasource.password} (unless those are already set).
 *
 * <p>For URLs that are already in JDBC format, if the host is not localhost and
 * {@code sslmode} is missing, {@code sslmode=require} is appended automatically
 * (required by Supabase and Render).
 *
 * <p>Registered via {@code META-INF/spring.factories} so it runs before any bean
 * is created.
 */
public class RenderDatabaseUrlProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {

        // Try SPRING_DATASOURCE_URL first, then DATABASE_URL (Render/Supabase auto-sets this).
        String raw = environment.getProperty("spring.datasource.url");

        if (isBlankOrEmpty(raw)) {
            raw = environment.getProperty("DATABASE_URL");
        }

        if (isBlankOrEmpty(raw)) {
            return; // nothing to convert
        }

        raw = raw.trim();

        // Already a valid JDBC URL – ensure sslmode is present for remote hosts, then return.
        if (raw.startsWith("jdbc:")) {
            String ensured = ensureSslMode(raw);
            if (!ensured.equals(raw)) {
                Map<String, Object> props = new HashMap<>();
                props.put("spring.datasource.url", ensured);
                environment.getPropertySources()
                        .addFirst(new MapPropertySource("renderDatabaseUrl", props));
                System.out.println("[DatabaseUrlProcessor] Added sslmode=require: " + ensured);
            }
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

            // Build query string, auto-appending sslmode=require for remote hosts
            boolean hasQuery = query != null && !query.isEmpty();
            boolean isRemote = host != null && !"localhost".equals(host) && !"127.0.0.1".equals(host);
            if (hasQuery) {
                jdbcUrl.append('?').append(query);
                if (isRemote && !query.contains("sslmode")) {
                    jdbcUrl.append("&sslmode=require");
                }
            } else if (isRemote) {
                jdbcUrl.append("?sslmode=require");
            }

            System.out.println("[DatabaseUrlProcessor] Converted DB URL to: " + jdbcUrl);

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
            System.err.println("[DatabaseUrlProcessor] Failed to parse database URL: " + e.getMessage());
        }
    }

    /**
     * For JDBC URLs targeting remote hosts, ensure sslmode=require is present.
     */
    private static String ensureSslMode(String jdbcUrl) {
        // Quick check: skip localhost
        if (jdbcUrl.contains("localhost") || jdbcUrl.contains("127.0.0.1")) {
            return jdbcUrl;
        }
        if (jdbcUrl.contains("sslmode")) {
            return jdbcUrl;
        }
        return jdbcUrl.contains("?") ? jdbcUrl + "&sslmode=require" : jdbcUrl + "?sslmode=require";
    }

    private static boolean isBlankOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }
}
