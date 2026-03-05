package com.example.rollbasedlogin.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rollbasedlogin.model.Driver;
import com.example.rollbasedlogin.model.User;
import com.example.rollbasedlogin.repository.DriverRepository;
import com.example.rollbasedlogin.repository.UserRepository;
import com.example.rollbasedlogin.util.CountryCodeUtil;
import com.example.rollbasedlogin.util.JwtUtil;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class PersonalInfoController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private DriverRepository driverRepo;

    @Autowired
    private JwtUtil jwtUtil;

    private String getEmailFromAuthHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                return jwtUtil.getEmailFromToken(token);
            }
        }
        return null;
    }

    /**
     * GET /api/profile/me
     * Get current user's personal information
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        String email = getEmailFromAuthHeader(authHeader);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        return ResponseEntity.ok(buildPersonalInfoResponse(user));
    }

    /**
     * GET /api/profile/user?email=xxx
     * Get any user's personal information (with email param)
     */
    @GetMapping("/user")
    public ResponseEntity<?> getUserProfile(@RequestParam String email) {
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        return ResponseEntity.ok(buildPersonalInfoResponse(user));
    }

    /**
     * GET /api/profile/driver?email=xxx
     * Get driver profile information (public view)
     */
    @GetMapping("/driver")
    public ResponseEntity<?> getDriverProfile(@RequestParam String email) {
        Optional<Driver> driverOpt = driverRepo.findByEmail(email);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }

        Driver driver = driverOpt.get();
        Optional<User> userOpt = userRepo.findByEmail(email);

        Map<String, Object> response = new HashMap<>();
        response.put("name", driver.getName());
        response.put("email", driver.getEmail());
        response.put("cabType", driver.getCabType());
        response.put("available", driver.isAvailable());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            response.put("phoneNumber", maskPhoneNumber(user.getPhoneNumber()));
            response.put("country", user.getCountry());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Build personal info response object
     */
    private Map<String, Object> buildPersonalInfoResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("phoneNumber", user.getPhoneNumber());
        response.put("country", user.getCountry());
        response.put("countryCode", CountryCodeUtil.getCountryCode(user.getCountry()));
        
        // Role-specific info
        if ("employee".equalsIgnoreCase(user.getRole())) {
            response.put("hrEmail", user.getHrEmail());
            response.put("accountType", "Employee");
        } else if ("driver".equalsIgnoreCase(user.getRole())) {
            Optional<Driver> driverOpt = driverRepo.findByEmail(user.getEmail());
            if (driverOpt.isPresent()) {
                Driver driver = driverOpt.get();
                response.put("cabType", driver.getCabType());
                response.put("available", driver.isAvailable());
                response.put("accountType", "Driver");
            }
        } else if ("hr".equalsIgnoreCase(user.getRole())) {
            response.put("accountType", "HR");
        } else if ("admin".equalsIgnoreCase(user.getRole())) {
            response.put("accountType", "Admin");
        }

        return response;
    }

    /**
     * Mask phone number for privacy
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "***MASKED***";
        }
        String lastFour = phoneNumber.substring(phoneNumber.length() - 4);
        return "****" + lastFour;
    }

    /**
     * GET /api/profile/validate-phone?country=USA&phoneNumber=+11234567890
     * Validate phone number format
     */
    @GetMapping("/validate-phone")
    public ResponseEntity<?> validatePhoneNumber(
            @RequestParam String country,
            @RequestParam String phoneNumber) {
        
        String formatted = CountryCodeUtil.formatPhoneNumber(country, phoneNumber);
        boolean isValid = CountryCodeUtil.isValidPhoneNumber(country, formatted);

        Map<String, Object> response = new HashMap<>();
        response.put("country", country);
        response.put("phoneNumber", phoneNumber);
        response.put("formattedPhoneNumber", formatted);
        response.put("isValid", isValid);
        response.put("countryCode", CountryCodeUtil.getCountryCode(country));

        if (!isValid) {
            response.put("message", "Invalid phone number format. Expected: " + CountryCodeUtil.getPhonePlaceholder(country));
        }

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/profile/phone-placeholder?country=USA
     * Get phone number placeholder for a country
     */
    @GetMapping("/phone-placeholder")
    public ResponseEntity<?> getPhonePlaceholder(@RequestParam String country) {
        Map<String, Object> response = new HashMap<>();
        response.put("country", country);
        response.put("countryCode", CountryCodeUtil.getCountryCode(country));
        response.put("placeholder", CountryCodeUtil.getPhonePlaceholder(country));
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/profile/supported-countries
     * Get list of supported countries
     */
    @GetMapping("/supported-countries")
    public ResponseEntity<?> getSupportedCountries() {
        Map<String, Object> response = new HashMap<>();
        response.put("countries", CountryCodeUtil.getSupportedCountries());
        response.put("total", CountryCodeUtil.getSupportedCountries().length);
        
        // Add country info
        Map<String, Map<String, String>> countryInfo = new HashMap<>();
        for (String country : CountryCodeUtil.getSupportedCountries()) {
            Map<String, String> info = new HashMap<>();
            info.put("countryCode", CountryCodeUtil.getCountryCode(country));
            info.put("placeholder", CountryCodeUtil.getPhonePlaceholder(country));
            countryInfo.put(country, info);
        }
        response.put("countryInfo", countryInfo);
        
        return ResponseEntity.ok(response);
    }
}
