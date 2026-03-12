package com.example.rollbasedlogin;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableCaching
public class RollbasedloginApplication {

	public static void main(String[] args) {
		// Log database env for debugging deployment issues
		String dbUrlEnv = System.getenv("DATABASE_URL");
		String dsUrlEnv = System.getenv("SPRING_DATASOURCE_URL");
		if (dbUrlEnv == null && dsUrlEnv == null) {
			System.err.println("[STARTUP] WARNING: Neither DATABASE_URL nor SPRING_DATASOURCE_URL is set. "
					+ "The app will try localhost:5432 which will fail on hosted platforms. "
					+ "Set SPRING_DATASOURCE_URL to your Supabase JDBC connection string.");
		} else {
			System.out.println("[STARTUP] Database URL env var detected — DatabaseUrlProcessor will handle conversion.");
		}

		// URL conversion is handled by RenderDatabaseUrlProcessor (EnvironmentPostProcessor)
		SpringApplication.run(RollbasedloginApplication.class, args);
	}
}
