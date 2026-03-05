package com.example.rollbasedlogin;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;

@SpringBootApplication
@EnableCaching
public class RollbasedloginApplication {

	public static void main(String[] args) {
		convertDatabaseUrl();
		SpringApplication.run(RollbasedloginApplication.class, args);
	}

	/**
	 * Converts Render-style postgres:// URLs into JDBC format before Spring starts.
	 * Also fixes jdbc:postgresql://user:pass@host/db URLs (credentials must be separate).
	 * Has no effect on local development (localhost defaults remain untouched).
	 */
	private static void convertDatabaseUrl() {
		String raw = System.getenv("SPRING_DATASOURCE_URL");
		if (raw == null || raw.isBlank()) {
			raw = System.getenv("DATABASE_URL");
		}
		if (raw == null || raw.isBlank()) {
			return;
		}

		raw = raw.trim();

		// Strip jdbc: prefix so we can parse uniformly with URI
		boolean hadJdbcPrefix = false;
		if (raw.startsWith("jdbc:")) {
			hadJdbcPrefix = true;
			raw = raw.substring("jdbc:".length());
		}

		// Normalize: postgres:// → postgresql://
		if (raw.startsWith("postgres://")) {
			raw = "postgresql" + raw.substring("postgres".length());
		}

		if (!raw.startsWith("postgresql://")) {
			// Not a Postgres URL we can handle — leave it as-is
			return;
		}

		try {
			URI uri = new URI(raw);
			String host = uri.getHost();
			int port = uri.getPort() > 0 ? uri.getPort() : 5432;
			String path = uri.getPath();
			String query = uri.getQuery();

			StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
					.append(host).append(':').append(port)
					.append(path != null ? path : "/postgres");
			if (query != null && !query.isEmpty()) {
				jdbcUrl.append('?').append(query);
			}

			System.setProperty("spring.datasource.url", jdbcUrl.toString());
			System.out.println("[DB-URL] Converted to: " + jdbcUrl);

			// Extract user:pass from the URL and set them as separate properties
			String userInfo = uri.getUserInfo();
			if (userInfo != null) {
				int colon = userInfo.indexOf(':');
				if (colon > 0) {
					System.setProperty("spring.datasource.username", userInfo.substring(0, colon));
					System.setProperty("spring.datasource.password", userInfo.substring(colon + 1));
				} else {
					System.setProperty("spring.datasource.username", userInfo);
				}
			}
		} catch (Exception e) {
			System.err.println("[DB-URL] Failed to parse: " + e.getMessage());
		}
	}
}
