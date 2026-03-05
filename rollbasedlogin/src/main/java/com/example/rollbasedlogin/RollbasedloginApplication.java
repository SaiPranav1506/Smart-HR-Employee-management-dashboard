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
	 * Only activates when SPRING_DATASOURCE_URL or DATABASE_URL contains a non-JDBC URL.
	 * Has no effect on local development (localhost defaults remain untouched).
	 */
	private static void convertDatabaseUrl() {
		String raw = System.getenv("SPRING_DATASOURCE_URL");
		if (raw == null || raw.isBlank()) {
			raw = System.getenv("DATABASE_URL");
		}
		if (raw == null || raw.isBlank() || raw.startsWith("jdbc:")) {
			return;
		}

		raw = raw.trim();
		if (raw.startsWith("postgres://")) {
			raw = "postgresql" + raw.substring("postgres".length());
		}
		if (!raw.startsWith("postgresql://")) {
			return;
		}

		try {
			URI uri = new URI(raw);
			String host = uri.getHost();
			int port = uri.getPort() > 0 ? uri.getPort() : 5432;
			String path = uri.getPath();

			String jdbcUrl = "jdbc:postgresql://" + host + ":" + port
					+ (path != null ? path : "/postgres");

			System.setProperty("spring.datasource.url", jdbcUrl);
			System.out.println("[DB-URL] Converted to: " + jdbcUrl);

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
