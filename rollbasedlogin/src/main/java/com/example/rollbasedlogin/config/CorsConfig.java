package com.example.rollbasedlogin.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    /**
     * Comma-separated list of allowed origins or origin patterns.
     * Examples:
     * - http://localhost:3000
     * - https://your-site.netlify.app
     * - https://*.vercel.app
     */
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String[] originsOrPatterns = allowedOrigins == null ? new String[0]
                        : java.util.Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .toArray(String[]::new);

                registry.addMapping("/**")
                        // Use patterns so you can allow Vercel preview domains like https://*.vercel.app
                        .allowedOriginPatterns(originsOrPatterns)
                        .allowedMethods("*")
                        .allowedHeaders("*");
            }
        };
    }
}
