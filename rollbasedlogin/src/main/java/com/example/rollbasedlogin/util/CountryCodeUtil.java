package com.example.rollbasedlogin.util;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

public class CountryCodeUtil {

    private static final Map<String, CountryInfo> COUNTRY_MAP = new HashMap<>();

    static {
        COUNTRY_MAP.put("USA", new CountryInfo("+1", "^\\+1\\d{10}$", 10, "USA"));
        COUNTRY_MAP.put("India", new CountryInfo("+91", "^\\+91\\d{10}$", 10, "India"));
        COUNTRY_MAP.put("UK", new CountryInfo("+44", "^\\+44\\d{10}$", 10, "UK"));
        COUNTRY_MAP.put("Canada", new CountryInfo("+1", "^\\+1\\d{10}$", 10, "Canada"));
    }

    /**
     * Get country code for a given country
     */
    public static String getCountryCode(String country) {
        CountryInfo info = COUNTRY_MAP.get(country);
        return info != null ? info.code : null;
    }

    /**
     * Validate phone number for a given country
     */
    public static boolean isValidPhoneNumber(String country, String phoneNumber) {
        CountryInfo info = COUNTRY_MAP.get(country);
        if (info == null) {
            return false;
        }
        
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return false;
        }

        // Check if phone number matches the expected pattern
        Pattern pattern = Pattern.compile(info.pattern);
        return pattern.matcher(phoneNumber).matches();
    }

    /**
     * Format phone number with country code
     */
    public static String formatPhoneNumber(String country, String phoneNumber) {
        CountryInfo info = COUNTRY_MAP.get(country);
        if (info == null) {
            return phoneNumber;
        }

        // Remove any spaces, dashes, or parentheses
        String digitsOnly = phoneNumber.replaceAll("[^0-9+]", "");
        
        // If it starts with +, extract country code and digits
        if (digitsOnly.startsWith("+")) {
            // Remove the + to count digits
            String withoutPlus = digitsOnly.substring(1);
            
            // Handle USA and Canada (they share +1 country code)
            if ("USA".equalsIgnoreCase(country) || "Canada".equalsIgnoreCase(country)) {
                if (withoutPlus.startsWith("1")) {
                    withoutPlus = withoutPlus.substring(1); // Remove the 1 from +1
                }
                if (withoutPlus.length() == 10) {
                    return "+1" + withoutPlus;
                }
            }
            
            // Handle India
            if ("India".equalsIgnoreCase(country)) {
                if (withoutPlus.startsWith("91")) {
                    withoutPlus = withoutPlus.substring(2); // Remove the 91 from +91
                }
                if (withoutPlus.length() == 10) {
                    return "+91" + withoutPlus;
                }
            }
            
            // Handle UK
            if ("UK".equalsIgnoreCase(country)) {
                if (withoutPlus.startsWith("44")) {
                    withoutPlus = withoutPlus.substring(2); // Remove the 44 from +44
                }
                if (withoutPlus.length() == 10) {
                    return "+44" + withoutPlus;
                }
            }
            
            // If it's already in correct format, return it
            return digitsOnly;
        }

        // No + sign, so remove all non-digits
        String pureDigits = phoneNumber.replaceAll("[^0-9]", "");

        // Handle USA and Canada (they share +1 country code)
        if ("USA".equalsIgnoreCase(country) || "Canada".equalsIgnoreCase(country)) {
            if (pureDigits.length() == 10) {
                return "+1" + pureDigits;
            } else if (pureDigits.length() == 11 && pureDigits.startsWith("1")) {
                return "+" + pureDigits;
            }
        }

        // Handle India
        if ("India".equalsIgnoreCase(country)) {
            if (pureDigits.length() == 10) {
                return "+91" + pureDigits;
            } else if (pureDigits.length() == 12 && pureDigits.startsWith("91")) {
                return "+" + pureDigits;
            }
        }

        // Handle UK
        if ("UK".equalsIgnoreCase(country)) {
            if (pureDigits.length() == 10) {
                return "+44" + pureDigits;
            } else if (pureDigits.length() == 12 && pureDigits.startsWith("44")) {
                return "+" + pureDigits;
            }
        }

        return phoneNumber;
    }

    /**
     * Get all supported countries
     */
    public static String[] getSupportedCountries() {
        return new String[]{"USA", "India", "UK", "Canada"};
    }

    /**
     * Get phone number placeholder for a country
     */
    public static String getPhonePlaceholder(String country) {
        switch (country) {
            case "USA":
            case "Canada":
                return "+1 (555) 123-4567 or +15551234567";
            case "India":
                return "+91 98765 43210 or +919876543210";
            case "UK":
                return "+44 7700 900000 or +447700900000";
            default:
                return "";
        }
    }

    /**
     * Country information class
     */
    public static class CountryInfo {
        public String code;
        public String pattern; // Regex pattern for validation
        public int maxDigits;
        public String name;

        public CountryInfo(String code, String pattern, int maxDigits, String name) {
            this.code = code;
            this.pattern = pattern;
            this.maxDigits = maxDigits;
            this.name = name;
        }
    }

    /**
     * Extract only digits from phone number
     */
    public static String extractDigits(String phoneNumber) {
        if (phoneNumber == null) {
            return "";
        }
        return phoneNumber.replaceAll("[^0-9]", "");
    }
}
